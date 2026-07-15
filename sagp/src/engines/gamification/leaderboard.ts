import { createServiceRoleClient } from '@/lib/supabase/server';
import type { LeaderboardEntry, LeaderboardScope } from '@/types/database';

export async function updateLeaderboard(
  userId: string,
  orgId: string
): Promise<void> {
  const client = await createServiceRoleClient();

  const [{ data: membership }, { data: profile }] = await Promise.all([
    client
      .from('org_memberships')
      .select('department')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single(),
    client
      .from('profiles')
      .select('display_name, first_name, last_name')
      .eq('id', userId)
      .single(),
  ]);

  const displayName =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    'Player';

  // Calculate total points from all completed sessions.
  //
  // Uses normalized_score (0-1000 per session, rescaled from each game's own
  // maxScore) rather than the raw `score` column. Raw scores are on wildly
  // different scales per game (Phishing ~1950 max, CyberForge 3000,
  // CyberCarnival 10000, Human Firewall effectively uncapped) — summing them
  // directly made total_points mostly reflect which high-scale games a user
  // happened to play, not overall performance. See
  // supabase/migrations/20260715000000_normalized_game_scores.sql.
  const { data: sessions } = await client
    .from('game_sessions')
    .select('normalized_score, passed')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('status', 'completed');

  const totalPoints = sessions?.reduce((sum, s) => sum + (s.normalized_score || 0), 0) || 0;

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

  const commonEntry = {
    user_id: userId,
    org_id: orgId,
    display_name: displayName,
    total_points: totalPoints,
    badges_earned: badges?.length || 0,
    streak_days: streak?.current_streak || 0,
    modules_completed: progress?.length || 0,
    updated_at: new Date().toISOString(),
  };

  const rows = [
    { ...commonEntry, department: null, scope: 'org' as const },
    ...(membership?.department
      ? [{ ...commonEntry, department: membership.department, scope: 'department' as const }]
      : []),
  ];

  const { error: upsertError } = await client
    .from('leaderboard')
    .upsert(rows, { onConflict: 'user_id,org_id,scope,department' });

  if (upsertError) {
    const isLegacySchema =
      (upsertError.code === '42703' && upsertError.message.includes('display_name')) ||
      upsertError.code === '42P10';
    if (!isLegacySchema) throw upsertError;

    // Compatibility path until the professional_badges_leaderboard_repair
    // migration is deployed. It intentionally omits new-schema columns.
    for (const row of rows) {
      let existingQuery = client
        .from('leaderboard')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('scope', row.scope)
        .limit(1);
      if (row.scope === 'department') {
        existingQuery = existingQuery.eq('department', row.department);
      }
      const { data: existingRows, error: lookupError } = await existingQuery;
      if (lookupError) throw lookupError;

      const legacyValues = {
        total_points: row.total_points,
        badges_earned: row.badges_earned,
        streak_days: row.streak_days,
        modules_completed: row.modules_completed,
        updated_at: row.updated_at,
      };
      const existing = existingRows?.[0];
      if (existing) {
        const { error } = await client
          .from('leaderboard')
          .update(legacyValues)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('leaderboard').insert({
          ...legacyValues,
          user_id: userId,
          org_id: orgId,
          department: row.department,
          scope: row.scope,
          rank: 0,
        });
        if (error) throw error;
      }
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
