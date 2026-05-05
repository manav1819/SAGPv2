import { createServiceRoleClient } from '@/lib/supabase/server';
import { calculatePoints } from './points';
import { checkAndAwardBadges } from './badges';
import { updateLeaderboard } from './leaderboard';
import { updateStreak } from './streaks';
import { getRemediationAction, logRemediation, classifySession } from './remediation';
import type { GameSession } from '@/types/database';

export async function processSessionCompletion(
  sessionId: string
): Promise<void> {
  const client = await createServiceRoleClient();

  // Get session details
  const { data: session, error: sessionError } = await client
    .from('game_sessions')
    .select(`
      *,
      modules: module_id (points_value, estimated_mins, difficulty),
      game_events: id (count)
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  if (!session) throw new Error('Session not found');

  // Calculate points
  const points = await calculatePoints(
    session,
    session.modules,
    session.time_taken_seconds || 0
  );

  // Update session with points and score
  await client
    .from('game_sessions')
    .update({
      score: points,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  // Classify session for remediation
  const classification = classifySession(
    session.time_taken_seconds || 0,
    session.modules.estimated_mins,
    session.passed || false
  );

  // Get remediation action
  const remediationAction = getRemediationAction(
    classification.timeBucket,
    classification.quizResult,
    session.attempt_number
  );

  // Log remediation
  await logRemediation(sessionId, remediationAction);

  // Update streak
  await updateStreak(session.user_id, session.org_id);

  // Check and award badges
  await checkAndAwardBadges(session.user_id, session.org_id);

  // Update leaderboard
  await updateLeaderboard(session.user_id, session.org_id);
}

export { calculatePoints } from './points';
export { checkAndAwardBadges } from './badges';
export { updateLeaderboard, getLeaderboard } from './leaderboard';
export { updateStreak } from './streaks';
export { getRemediationAction, classifySession } from './remediation';
