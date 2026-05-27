/**
 * SAGP Gamification Pipeline
 *
 * processSessionCompletion is the single entry-point called by the API route
 * after a game_session is persisted. It runs all gamification side-effects
 * in dependency order and emits structured logs at each stage.
 *
 * Fixes applied vs. previous version:
 *   - Broken PostgREST join syntax (`modules: module_id (...)`) replaced with
 *     two explicit queries so the data is actually fetched.
 *   - game_events: id (count) join replaced with a separate count query using
 *     the correct FK column (session_id on game_events).
 *   - Progress table is now upserted when a session completes, so completion
 *     rates in the analytics engine reflect reality.
 *   - All stages wrapped in withPipelineStage for structured logging.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { pipelineLog, withPipelineStage } from '@/lib/logger';
import { calculatePoints } from './points';
import { checkAndAwardBadges } from './badges';
import { updateLeaderboard } from './leaderboard';
import { updateStreak } from './streaks';
import { getRemediationAction, logRemediation, classifySession } from './remediation';

export async function processSessionCompletion(sessionId: string): Promise<void> {
  const client = await createServiceRoleClient();

  // ── 1. Fetch session (core fields only, no PostgREST join) ────────────────
  const { data: session, error: sessionError } = await client
    .from('game_sessions')
    .select('id, user_id, org_id, module_id, score, passed, attempt_number, time_taken_seconds, integrity_flag, time_bucket')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    pipelineLog({ stage: 'error', sessionId, error: sessionError?.message ?? 'Session not found', data: { failedStage: 'gamification_started' } });
    throw sessionError ?? new Error('Session not found');
  }

  pipelineLog({ stage: 'gamification_started', sessionId, userId: session.user_id, orgId: session.org_id });

  // ── 2. Fetch related module separately (fix: was a broken join) ───────────
  const { data: module } = await client
    .from('modules')
    .select('id, points_value, estimated_mins, difficulty')
    .eq('id', session.module_id)
    .single();

  // ── 3. Calculate points ───────────────────────────────────────────────────
  const points = await withPipelineStage(
    'points_calculated',
    { sessionId, userId: session.user_id, orgId: session.org_id },
    () => calculatePoints(session, module, session.time_taken_seconds || 0)
  );

  // Update session score
  await client
    .from('game_sessions')
    .update({ score: points })
    .eq('id', sessionId);

  // ── 4. Upsert progress row ────────────────────────────────────────────────
  //    Previously missing — completion rates in the analytics engine were always 0.
  await withPipelineStage(
    'progress_updated',
    { sessionId, userId: session.user_id, orgId: session.org_id },
    async () => {
      const { data: existing } = await client
        .from('progress')
        .select('id, attempts, best_score')
        .eq('user_id', session.user_id)
        .eq('module_id', session.module_id)
        .eq('org_id', session.org_id)
        .maybeSingle();

      if (existing) {
        await client.from('progress').update({
          status: session.passed ? 'completed' : 'in_progress',
          attempts: (existing.attempts ?? 0) + 1,
          best_score: Math.max(existing.best_score ?? 0, points),
          completed_at: session.passed ? new Date().toISOString() : null,
        }).eq('id', existing.id);
      } else {
        await client.from('progress').insert({
          user_id: session.user_id,
          module_id: session.module_id,
          org_id: session.org_id,
          status: session.passed ? 'completed' : 'in_progress',
          attempts: 1,
          best_score: points,
          completed_at: session.passed ? new Date().toISOString() : null,
        });
      }
    }
  );

  // ── 5. Classify session and log remediation ───────────────────────────────
  const classification = classifySession(
    session.time_taken_seconds || 0,
    module?.estimated_mins ?? 5,
    session.passed ?? false
  );

  const remediationAction = getRemediationAction(
    classification.timeBucket,
    classification.quizResult,
    session.attempt_number ?? 1
  );

  await withPipelineStage(
    'remediation_logged',
    { sessionId, userId: session.user_id, orgId: session.org_id, data: { action: remediationAction } },
    () => logRemediation(sessionId, remediationAction)
  );

  // ── 6. Streak, badges, leaderboard (all independent — run in parallel) ────
  await Promise.allSettled([
    withPipelineStage('streak_updated',      { sessionId, userId: session.user_id, orgId: session.org_id }, () => updateStreak(session.user_id, session.org_id)),
    withPipelineStage('badges_checked',      { sessionId, userId: session.user_id, orgId: session.org_id }, () => checkAndAwardBadges(session.user_id, session.org_id)),
    withPipelineStage('leaderboard_updated', { sessionId, userId: session.user_id, orgId: session.org_id }, () => updateLeaderboard(session.user_id, session.org_id)),
  ]);
}

export { calculatePoints } from './points';
export { checkAndAwardBadges } from './badges';
export { updateLeaderboard, getLeaderboard } from './leaderboard';
export { updateStreak } from './streaks';
export { getRemediationAction, classifySession } from './remediation';
