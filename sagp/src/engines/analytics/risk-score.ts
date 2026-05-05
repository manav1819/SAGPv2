import { createServiceRoleClient } from '@/lib/supabase/server';
import type { RiskScore, RiskTier } from '@/types/database';

export async function computeRiskScore(
  userId: string,
  orgId: string
): Promise<RiskScore> {
  const client = await createServiceRoleClient();

  // 1. Phishing Susceptibility: % of phishing emails where user failed
  const { data: phishingEvents } = await client
    .from('phishing_events')
    .select('event_type')
    .eq('user_id', userId);

  let phishingSusceptibility = 0;
  if (phishingEvents && phishingEvents.length > 0) {
    const failedCount = phishingEvents.filter((e) =>
      ['email_opened', 'link_clicked', 'credentials_entered'].includes(e.event_type)
    ).length;
    phishingSusceptibility = (failedCount / phishingEvents.length) * 100;
  }

  // 2. Incorrect Answer Rate: % of questions answered incorrectly
  const { data: gameEvents } = await client
    .from('game_events')
    .select('is_correct')
    .eq('user_id', userId)
    .eq('event_type', 'answer');

  let incorrectAnswerRate = 0;
  if (gameEvents && gameEvents.length > 0) {
    const incorrectCount = gameEvents.filter((e) => !e.is_correct).length;
    incorrectAnswerRate = (incorrectCount / gameEvents.length) * 100;
  }

  // 3. Reaction Time Deviation: variance from baseline
  const { data: reactionEvents } = await client
    .from('game_events')
    .select('reaction_ms')
    .eq('user_id', userId)
    .not('reaction_ms', 'is', null);

  let reactionTimeDeviation = 0;
  if (reactionEvents && reactionEvents.length > 1) {
    const reactions = reactionEvents
      .map((e) => e.reaction_ms || 0)
      .filter((r) => r > 0);

    const mean = reactions.reduce((a, b) => a + b, 0) / reactions.length;
    const variance =
      reactions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      reactions.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-100 scale
    reactionTimeDeviation = Math.min((stdDev / mean) * 100, 100);
  }

  // 4. Remediation Failure Rate: % of assigned remediations not completed
  const { data: remediationLogs } = await client
    .from('remediation_logs')
    .select('remediation_module_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .not('remediation_module_id', 'is', null);

  let remediationFailureRate = 0;
  if (remediationLogs && remediationLogs.length > 0) {
    const moduleIds = remediationLogs
      .map((r) => r.remediation_module_id)
      .filter((m): m is string => m !== null && m !== undefined);

    if (moduleIds.length > 0) {
      const { data: completed } = await client
        .from('progress')
        .select()
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .in('module_id', moduleIds);

      remediationFailureRate =
        ((moduleIds.length - (completed?.length || 0)) / moduleIds.length) * 100;
    }
  }

  // Calculate weighted score
  const totalScore =
    0.35 * phishingSusceptibility +
    0.25 * incorrectAnswerRate +
    0.2 * reactionTimeDeviation +
    0.2 * remediationFailureRate;

  const riskTier = classifyRiskTier(totalScore);

  // Upsert risk score
  const { data: existing } = await client
    .from('risk_scores')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const { data, error } = await client
      .from('risk_scores')
      .update({
        total_score: Math.round(totalScore),
        phishing_susceptibility: Math.round(phishingSusceptibility),
        incorrect_answer_rate: Math.round(incorrectAnswerRate),
        reaction_time_deviation: Math.round(reactionTimeDeviation),
        remediation_failure_rate: Math.round(remediationFailureRate),
        risk_tier: riskTier,
        computed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await client
      .from('risk_scores')
      .insert({
        user_id: userId,
        org_id: orgId,
        total_score: Math.round(totalScore),
        phishing_susceptibility: Math.round(phishingSusceptibility),
        incorrect_answer_rate: Math.round(incorrectAnswerRate),
        reaction_time_deviation: Math.round(reactionTimeDeviation),
        remediation_failure_rate: Math.round(remediationFailureRate),
        risk_tier: riskTier,
        computed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export function classifyRiskTier(score: number): RiskTier {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}
