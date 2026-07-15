import { createServiceRoleClient } from '@/lib/supabase/server';
import { GAMES } from '@/config/games.config';

interface BadgeCriteria {
  type: string;
  threshold?: number;
  game_id?: string;
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
    .from('leaderboard')
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
    .select('id, module_id, passed, ended_at')
    .eq('user_id', userId)
    .eq('org_id', orgId);

  // Get user's existing badges
  const { data: existingBadges } = await client
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) || []);

  // Build set of completed games from sessions
  // Map module titles to game IDs using games config.
  //
  // NOTE: modules created by /api/game/result are titled `[Game] <title>`
  // (see moduleTitleFor() there), not the bare title — so we strip that
  // prefix before lookup. Previously this map's keys had no prefix and the
  // "[Game] " one always came through the DB, so this lookup never matched
  // and `game_completed` criteria badges were never actually awarded.
  //
  // CyberCarnival: Threat Hunt is one games.config.ts entry with an in-game
  // difficulty picker; each level's module title carries a "— Easy" /
  // "— Medium" / "— Legendary" suffix (again from moduleTitleFor()), so it
  // maps to 3 distinct game_ids here instead of 1.
  const titleToId: Record<string, string> = {
    'Phishing Simulator': 'phishing',
    'Vishing Simulator': 'vishing',
    'CyberGuard: Office Security': '3d-office',
    'CyberForge': 'cyberforge',
    'Cyber Carnival: Threat Hunt — Easy': 'carnival-shooter-easy',
    'Cyber Carnival: Threat Hunt — Medium': 'carnival-shooter-medium',
    'Cyber Carnival: Threat Hunt — Legendary': 'carnival-shooter-legendary',
    'Operation Human Firewall': 'human-firewall',
  };

  const completedGames = new Set<string>();

  if (sessions && sessions.length > 0) {
    // Get module titles
    const moduleIds = [...new Set(sessions.map((s: any) => s.module_id).filter(Boolean))];
    if (moduleIds.length > 0) {
      const { data: modulesData } = await client
        .from('modules')
        .select('id, title')
        .in('id', moduleIds);

      for (const module of modulesData ?? []) {
        const cleanTitle = String(module.title ?? '').replace(/^\[Game\]\s*/, '');
        const gameId = titleToId[cleanTitle];
        if (gameId) {
          completedGames.add(gameId);
        }
      }
    }
  }

  // GAMES (games.config.ts) still lists a single 'carnival-shooter' id — keep
  // that id valid for any badge/criteria keyed on it (e.g. 'all_games_completed')
  // by deriving it once all 3 difficulty levels have been cleared.
  if (
    completedGames.has('carnival-shooter-easy') &&
    completedGames.has('carnival-shooter-medium') &&
    completedGames.has('carnival-shooter-legendary')
  ) {
    completedGames.add('carnival-shooter');
  }

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
    } else if (criteria.type === 'game_completed') {
      // Check if user has completed a specific game
      if (criteria.game_id && completedGames.has(criteria.game_id)) {
        shouldAward = true;
      }
    } else if (criteria.type === 'all_games_completed') {
      // Check if user has completed all 5 games
      const allGameIds = GAMES.map((g) => g.id);
      const hasCompletedAll = allGameIds.every((gameId) => completedGames.has(gameId));
      if (hasCompletedAll) {
        shouldAward = true;
      }
    }

    if (shouldAward) {
      await client.from('user_badges').insert({
        user_id: userId,
        org_id: orgId,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      });
    }
  }
}
