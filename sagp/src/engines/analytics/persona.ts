import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SecurityPersona, SecurityPersonaRecord } from '@/types/database';

interface PersonaSignals {
  avg_reaction_time: number;
  reaction_time_variance: number;
  accuracy_rate: number;
  phishing_click_rate: number;
  phishing_report_rate: number;
  speed_sessions_pct: number;
  session_count: number;
}

export async function classifyPersona(
  userId: string,
  orgId: string
): Promise<SecurityPersonaRecord> {
  const client = await createServiceRoleClient();

  // Gather signals
  const signals = await gatherSignals(userId, orgId);

  // Classify based on signals
  let persona: SecurityPersona = 'careful_defender';
  let confidence = 0;

  if (
    signals.accuracy_rate > 85 &&
    signals.phishing_click_rate < 20 &&
    signals.phishing_report_rate > 30
  ) {
    persona = 'careful_defender';
    confidence = 0.9;
  } else if (signals.avg_reaction_time < 5000 && signals.accuracy_rate > 75) {
    persona = 'speed_runner';
    confidence = 0.8;
  } else if (signals.accuracy_rate < 60 && signals.phishing_click_rate > 50) {
    persona = 'clicker';
    confidence = 0.85;
  } else if (
    signals.speed_sessions_pct < 20 &&
    signals.reaction_time_variance > 50000
  ) {
    persona = 'guesser';
    confidence = 0.75;
  } else if (signals.phishing_report_rate > 60 && signals.accuracy_rate > 80) {
    persona = 'skeptic';
    confidence = 0.88;
  } else {
    persona = 'careful_defender';
    confidence = 0.5;
  }

  // Upsert persona
  const { data: existing } = await client
    .from('security_personas')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (existing) {
    const { data, error } = await client
      .from('security_personas')
      .update({
        persona,
        confidence,
        signals,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await client
      .from('security_personas')
      .insert({
        user_id: userId,
        org_id: orgId,
        persona,
        confidence,
        signals,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

async function gatherSignals(
  userId: string,
  orgId: string
): Promise<PersonaSignals> {
  const client = await createServiceRoleClient();

  // Get reaction times
  const { data: reactionEvents } = await client
    .from('game_events')
    .select('reaction_ms')
    .eq('user_id', userId)
    .not('reaction_ms', 'is', null);

  let avgReactionTime = 0;
  let reactionTimeVariance = 0;

  if (reactionEvents && reactionEvents.length > 0) {
    const reactions = reactionEvents
      .map((e) => e.reaction_ms || 0)
      .filter((r) => r > 0);

    avgReactionTime = reactions.reduce((a, b) => a + b, 0) / reactions.length;

    if (reactions.length > 1) {
      const mean = avgReactionTime;
      const variance =
        reactions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        reactions.length;
      reactionTimeVariance = Math.sqrt(variance);
    }
  }

  // Get accuracy rate
  const { data: gameEvents } = await client
    .from('game_events')
    .select('is_correct')
    .eq('user_id', userId)
    .eq('event_type', 'answer');

  let accuracyRate = 0;
  if (gameEvents && gameEvents.length > 0) {
    const correct = gameEvents.filter((e) => e.is_correct).length;
    accuracyRate = (correct / gameEvents.length) * 100;
  }

  // Get phishing metrics
  const { data: phishingEvents } = await client
    .from('phishing_events')
    .select('event_type')
    .eq('user_id', userId);

  let phishingClickRate = 0;
  let phishingReportRate = 0;

  if (phishingEvents && phishingEvents.length > 0) {
    const clickedCount = phishingEvents.filter((e) =>
      ['email_opened', 'link_clicked', 'credentials_entered'].includes(e.event_type)
    ).length;

    const reportedCount = phishingEvents.filter(
      (e) => e.event_type === 'report_submitted'
    ).length;

    phishingClickRate = (clickedCount / phishingEvents.length) * 100;
    phishingReportRate = (reportedCount / phishingEvents.length) * 100;
  }

  // Get speed sessions percentage
  const { data: sessions } = await client
    .from('game_sessions')
    .select('*, modules: module_id (estimated_mins)')
    .eq('user_id', userId)
    .eq('org_id', orgId);

  let speedSessionsPct = 0;
  if (sessions && sessions.length > 0) {
    const speedCount = sessions.filter((s) => {
      const estimated = (s.modules as any)?.estimated_mins || 5;
      const estimated_seconds = estimated * 60;
      return s.time_taken_seconds && s.time_taken_seconds < estimated_seconds * 0.6;
    }).length;

    speedSessionsPct = (speedCount / sessions.length) * 100;
  }

  return {
    avg_reaction_time: Math.round(avgReactionTime),
    reaction_time_variance: Math.round(reactionTimeVariance),
    accuracy_rate: Math.round(accuracyRate),
    phishing_click_rate: Math.round(phishingClickRate),
    phishing_report_rate: Math.round(phishingReportRate),
    speed_sessions_pct: Math.round(speedSessionsPct),
    session_count: sessions?.length || 0,
  };
}
