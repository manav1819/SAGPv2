import { createServiceRoleClient } from '@/lib/supabase/server';
import type { LeaderboardEntry, LeaderboardScope } from '@/types/database';

export async function updateLeaderboard(
  userId: string,
  orgId: string
): Promise<void> {
  const client = await createServiceRoleClient();

  // Get user's department
  const { data: membership } = await client
    .from('org_memberships')
    .select('department')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  // Calculate total points from all completed sessions
  const { data: sessions } = await client
    .from('game_sessions')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('status', 'completed');

  const totalPoints = sessions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;

  const { data: badges } = await client
    .from('user_badges')
    .select('id')
    .eq('user_id', userId);

  const { data: progress } = await client
    .from('progress')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('status', 'completed');

  const { data: streak } = await client
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  // Upsert org-scope leaderboard row
  const { data: orgLeaderboard } = await client
    .from('leaderboard')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('scope', 'org')
    .single();

  if (orgLeaderboard) {
    await client
      .from('leaderboard')
      .update({
        total_points: totalPoints,
        badges_earned: badges?.length || 0,
        streak_days: streak?.current_streak || 0,
        modules_completed: progress?.length || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgLeaderboard.id);
  } else {
    await client.from('leaderboard').insert({
      user_id: userId,
      org_id: orgId,
      department: membership?.department || null,
      scope: 'org',
      total_points: totalPoints,
      badges_earned: badges?.length || 0,
      streak_days: streak?.current_streak || 0,
      modules_completed: progress?.length || 0,
      rank: 0,
    });
  }

  // Upsert department-scope leaderboard row if user has a department
  if (membership?.department) {
    const { data: deptLeaderboard } = await client
      .from('leaderboard')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('scope', 'department')
      .eq('department', membership.department)
      .single();

    if (deptLeaderboard) {
      await client
        .from('leaderboard')
        .update({
          total_points: totalPoints,
          badges_earned: badges?.length || 0,
          streak_days: streak?.current_streak || 0,
          modules_completed: progress?.length || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deptLeaderboard.id);
    } else {
      await client.from('leaderboard').insert({
        user_id: userId,
        org_id: orgId,
        department: membership.department,
        scope: 'department',
        total_points: totalPoints,
        badges_earned: badges?.length || 0,
        streak_days: streak?.current_streak || 0,
        modules_completed: progress?.length || 0,
        rank: 0,
      });
    }
  }

  // Recalculate ranks for all users in org
  await recalculateRanks(orgId);
}

async function recalculateRanks(orgId: string): Promise<void> {
  const client = await createServiceRoleClient();

  // Org scope: rank by total_points descending
  const { data: orgEntries } = await client
    .from('leaderboard')
    .select('id')
    .eq('org_id', orgId)
    .eq('scope', 'org')
    .order('total_points', { ascending: false });

  if (orgEntries) {
    for (let i = 0; i < orgEntries.length; i++) {
      await client
        .from('leaderboard')
        .update({ rank: i + 1 })
        .eq('id', orgEntries[i].id);
    }
  }

  // Department scope: rank within each department
  const { data: deptRows } = await client
    .from('leaderboard')
    .select('department')
    .eq('org_id', orgId)
    .eq('scope', 'department')
    .not('department', 'is', null);

  const uniqueDepts = [...new Set((deptRows || []).map((r) => r.department))];

  for (const dept of uniqueDepts) {
    const { data: deptEntries } = await client
      .from('leaderboard')
      .select('id')
      .eq('org_id', orgId)
      .eq('scope', 'department')
      .eq('department', dept)
      .order('total_points', { ascending: false });

    if (deptEntries) {
      for (let i = 0; i < deptEntries.length; i++) {
        await client
          .from('leaderboard')
          .update({ rank: i + 1 })
          .eq('id', deptEntries[i].id);
      }
    }
  }
}

export async function getLeaderboard(
  scope: LeaderboardScope,
  orgId: string,
  department?: string
): Promise<LeaderboardEntry[]> {
  const client = await createServiceRoleClient();

  let query = client
    .from('leaderboard')
    .select('*')
    .eq('org_id', orgId)
    .eq('scope', scope);

  if (scope === 'department' && department) {
    query = query.eq('department', department);
  }

  const { data, error } = await query.order('rank', { ascending: true });

  if (error) throw error;
  return data || [];
}
