import { createServiceRoleClient } from '@/lib/supabase/server';

interface BadgeCriteria {
  type: string;
  threshold?: number;
  [key: string]: any;
}

export async function checkAndAwardBadges(
  userId: string,
  orgId: string
): Promise<void> {
  const client = await createServiceRoleClient();

  // Get all badges with criteria
  const { data: badges, error: badgesError } = await client
    .from('badges')
    .select();

  if (badgesError) throw badgesError;

  // Get user's current stats
  const { data: leaderboardEntry } = await client
    .from('leaderboard_entries')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  const { data: streak } = await client
    .from('user_streaks')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  const { data: riskScore } = await client
    .from('risk_scores')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  const { data: sessions } = await client
    .from('game_sessions')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId);

  // Get user's existing badges
  const { data: existingBadges } = await client
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) || []);

  for (const badge of badges || []) {
    // Skip if already earned
    if (existingBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as BadgeCriteria;
    let shouldAward = false;

    if (criteria.type === 'total_points') {
      if (
        leaderboardEntry?.total_points &&
        leaderboardEntry.total_points >= (criteria.threshold || 1000)
      ) {
        shouldAward = true;
      }
    } else if (criteria.type === 'streak_days') {
      if (
        streak?.current_streak &&
        streak.current_streak >= (criteria.threshold || 7)
      ) {
        shouldAward = true;
      }
    } else if (criteria.type === 'modules_completed') {
      if (
        leaderboardEntry?.modules_completed &&
        leaderboardEntry.modules_completed >= (criteria.threshold || 5)
      ) {
        shouldAward = true;
      }
    } else if (criteria.type === 'accuracy_rate') {
      // Calculate accuracy from sessions
      const passed = sessions?.filter((s) => s.passed).length || 0;
      const total = sessions?.length || 0;
      if (total > 0) {
        const accuracy = (passed / total) * 100;
        if (accuracy >= (criteria.threshold || 95)) {
          shouldAward = true;
        }
      }
    } else if (criteria.type === 'phishing_reports') {
      // Count phishing reports
      const { data: events } = await client
        .from('game_events')
        .select()
        .eq('user_id', userId)
        .eq('event_type', 'report_submitted');

      if (events && events.length >= (criteria.threshold || 10)) {
        shouldAward = true;
      }
    } else if (criteria.type === 'speed_run') {
      // Complete module in less than 50% of estimated time
      const { data: speedSessions } = await client
        .from('game_sessions')
        .select('*, modules: module_id (estimated_mins)')
        .eq('user_id', userId)
        .eq('org_id', orgId);

      for (const session of speedSessions || []) {
        const estimatedSeconds = ((session.modules as any)?.estimated_mins || 5) * 60;
        if (
          session.time_taken_seconds &&
          session.time_taken_seconds < estimatedSeconds * 0.5
        ) {
          shouldAward = true;
          break;
        }
      }
    } else if (criteria.type === 'low_risk_score') {
      if (riskScore && riskScore.total_score <= (criteria.threshold || 30)) {
        shouldAward = true;
      }
    }

    if (shouldAward) {
      await client.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      });
    }
  }
}
