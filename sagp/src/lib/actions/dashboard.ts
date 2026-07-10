'use server';

/**
 * Server actions for dashboard data fetching.
 *
 * These are called from client components via useTransition / useEffect.
 * They run on the server, bypass RLS via service role where needed,
 * and return plain serialisable objects.
 *
 * All queries return `null` on error (not throws) so dashboards degrade
 * gracefully and display a "—" fallback rather than crashing.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { computeCompanyScore, getScoreHistory } from '@/engines/analytics/company-score';
import { GAMES } from '@/config/games.config';
import type { RiskTier, SecurityPersona, UserRole } from '@/types/database';
import type { RiskScoreExplanation } from '@/engines/analytics/risk-score';

// ── Employee dashboard ──────────────────────────────────────────────────────
export interface EmployeeDashboardData {
  riskScore: number | null;
  riskTier: RiskTier | null;
  persona: SecurityPersona | null;
  personaConfidence: number | null;
  streakDays: number;
  totalPoints: number;
  modulesCompleted: number;
  userBadges: Array<{
    badgeId: string;
    badgeName: string;
    badgeIcon: string | null;
    earnedAt: string;
  }>;
  recentSessions: Array<{
    id: string;
    moduleTitle: string;
    gameId: string | null;
    gameTitle: string | null;
    maxScore: number | null;
    score: number | null;
    passed: boolean | null;
    endedAt: string | null;
  }>;
}

export async function getEmployeeDashboardData(
  userId: string,
  orgId: string
): Promise<EmployeeDashboardData | null> {
  try {
    const client = await createServiceRoleClient();

    // Helper: Extract game ID from module title
    const extractGameId = (moduleTitle: string): string | null => {
      const titleToId: Record<string, string> = {
        'Phishing Simulator': 'phishing',
        'Vishing Simulator': 'vishing',
        'CyberGuard: Office Security': '3d-office',
        'CyberForge': 'cyberforge',
        'Cyber Carnival: Threat Hunt': 'carnival-shooter',
      };
      return titleToId[moduleTitle] ?? null;
    };

    // Helper: Get game config by ID
    const getGameConfig = (gameId: string | null) => {
      if (!gameId) return null;
      return GAMES.find((g) => g.id === gameId);
    };

    const [riskRes, personaRes, streakRes, completedRes, sessionsRes, badgesRes] = await Promise.all([
      // Latest risk score
      client
        .from('risk_scores')
        .select('total_score, risk_tier')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Latest persona
      client
        .from('security_personas')
        .select('persona, confidence')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Streak + points from leaderboard (single source of truth)
      client
        .from('leaderboard')
        .select('total_points, streak_days')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('scope', 'org')
        .maybeSingle(),

      // Modules completed count
      client
        .from('progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'completed'),

      // Last 5 completed sessions (no join — we resolve titles in a second step)
      client
        .from('game_sessions')
        .select('id, module_id, score, passed, ended_at')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(5),

      // User badges with badge details
      client
        .from('user_badges')
        .select('badges(id, name, icon_url), earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5),
    ]);

    // Resolve module titles for the recent sessions list.
    // We do this as a separate IN query rather than a PostgREST join to avoid
    // silent null returns when the FK hint syntax varies across PostgREST versions.
    const sessionRows = sessionsRes.data ?? [];
    const moduleIds = [...new Set(sessionRows.map((s: any) => s.module_id).filter(Boolean))];
    const moduleTitleMap = new Map<string, string>();

    if (moduleIds.length > 0) {
      const { data: modulesData } = await client
        .from('modules')
        .select('id, title')
        .in('id', moduleIds);

      for (const m of modulesData ?? []) {
        moduleTitleMap.set(m.id, m.title);
      }
    }

    return {
      riskScore: riskRes.data?.total_score ?? null,
      riskTier: (riskRes.data?.risk_tier as RiskTier) ?? null,
      persona: (personaRes.data?.persona as SecurityPersona) ?? null,
      personaConfidence: personaRes.data?.confidence ?? null,
      streakDays: streakRes.data?.streak_days ?? 0,
      totalPoints: streakRes.data?.total_points ?? 0,
      modulesCompleted: completedRes.count ?? 0,
      userBadges: (badgesRes.data ?? []).map((b: any) => ({
        badgeId: b.badges?.id ?? '',
        badgeName: b.badges?.name ?? 'Unknown Badge',
        badgeIcon: b.badges?.icon_url ?? null,
        earnedAt: b.earned_at,
      })),
      recentSessions: sessionRows.map((s: any) => {
        const moduleTitle = moduleTitleMap.get(s.module_id) ?? 'Unknown module';
        const gameId = extractGameId(moduleTitle);
        const gameConfig = getGameConfig(gameId);
        return {
          id: s.id,
          moduleTitle,
          gameId,
          gameTitle: gameConfig?.title ?? null,
          maxScore: gameConfig?.maxScore ?? null,
          score: s.score,
          passed: s.passed,
          endedAt: s.ended_at,
        };
      }),
    };
  } catch (err) {
    console.error('[getEmployeeDashboardData]', err);
    return null;
  }
}

export async function getEmployeeStreakDays(
  userId: string,
  orgId: string
): Promise<number> {
  try {
    const client = await createServiceRoleClient();

    const { data } = await client
      .from('leaderboard')
      .select('streak_days')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('scope', 'org')
      .maybeSingle();

    return data?.streak_days ?? 0;
  } catch (err) {
    console.error('[getEmployeeStreakDays]', err);
    return 0;
  }
}

// ── Admin dashboard ──────────────────────────────────────────────────────────

export interface AdminDashboardData {
  companyScore: number;
  avgRisk: number;
  armWeightedAvgRisk: number;
  criticalPct: number;
  totalUsers: number;
  scoredUsers: number;
  coveragePct: number;
  avgCompletionRate: number;
  incompleteRate: number;
  activeModules: number;
  scoreHistory: Array<{ date: string; score: number; coverage_pct: number }>;
  riskDistribution: Record<RiskTier, number>;
  topPersonas: Array<{ persona: string; count: number }>;
}

export async function getAdminDashboardData(
  orgId: string
): Promise<AdminDashboardData | null> {
  try {
    const client = await createServiceRoleClient();
    const [companyData, historyData, modulesRes, personasRes, riskDistRes] = await Promise.all([
      computeCompanyScore(orgId),
      getScoreHistory(orgId, 30),

      // Active module count
      client
        .from('modules')
        .select('id', { count: 'exact', head: true })
        .or(`org_id.eq.${orgId},org_id.is.null`)
        .eq('is_active', true),

      // Latest persona per user — summarise top personas
      client
        .from('security_personas')
        .select('user_id, persona')
        .eq('org_id', orgId)
        .order('assigned_at', { ascending: false }),

      // Risk tier distribution from latest scores per user
      client
        .from('risk_scores')
        .select('user_id, risk_tier')
        .eq('org_id', orgId)
        .order('computed_at', { ascending: false }),
    ]);

    // Deduplicate riskDistRes by user_id (latest score per user)
    const latestTierByUser = new Map<string, RiskTier>();
    for (const row of riskDistRes.data ?? []) {
      if (!latestTierByUser.has(row.user_id)) {
        latestTierByUser.set(row.user_id, row.risk_tier as RiskTier);
      }
    }
    const riskDistribution: Record<RiskTier, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const tier of latestTierByUser.values()) {
      if (tier in riskDistribution) riskDistribution[tier] += 1;
    }

    // Deduplicate personasRes by user_id — latest persona per user.
    // FIX: previous version counted every historical persona row instead of
    // just each user's latest classification, overstating counts for anyone
    // reclassified more than once. Data is ordered by assigned_at DESC, so
    // the first occurrence per user_id is their latest persona.
    const personaRowsSorted = (personasRes.data ?? []) as Array<{ user_id: string; persona: string }>;
    const latestPersonaByUser = new Map<string, string>();
    for (const row of personaRowsSorted) {
      if (!latestPersonaByUser.has(row.user_id)) {
        latestPersonaByUser.set(row.user_id, row.persona);
      }
    }
    const personaCounts = new Map<string, number>();
    for (const persona of latestPersonaByUser.values()) {
      personaCounts.set(persona, (personaCounts.get(persona) ?? 0) + 1);
    }
    const topPersonas = [...personaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([persona, count]) => ({ persona, count }));

    return {
      companyScore: companyData.score,
      avgRisk: companyData.avg_risk,
      armWeightedAvgRisk: companyData.arm_weighted_avg_risk,
      criticalPct: companyData.critical_pct,
      totalUsers: companyData.total_users,
      scoredUsers: companyData.scored_users,
      coveragePct: companyData.coverage_pct,
      avgCompletionRate: companyData.avg_completion_rate,
      incompleteRate: companyData.incomplete_rate,
      activeModules: modulesRes.count ?? 0,
      scoreHistory: historyData,
      riskDistribution,
      topPersonas,
    };
  } catch (err) {
    console.error('[getAdminDashboardData]', err);
    return null;
  }
}

// ── Admin: org employee list ─────────────────────────────────────────────────
//
// Every query below is explicitly filtered by `.eq('org_id', orgId)` (or joined
// against a set of user_ids already scoped to that org). RLS on these tables
// only grants self-access (see supabase/schema.sql), so the service-role
// client + explicit org_id filter is the enforcement boundary here — the same
// pattern already used by getAdminDashboardData above. Never widen these
// queries without keeping the org_id filter.

export interface OrgEmployeeSummary {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  orgRole: UserRole;
  isActive: boolean;
  joinedAt: string;
  sessionsPlayed: number;
  sessionsCompleted: number;
  modulesCompleted: number;
  riskScore: number | null;
  riskTier: RiskTier | null;
  persona: SecurityPersona | null;
  lastActivityAt: string | null;
}

export async function getOrgEmployees(orgId: string): Promise<OrgEmployeeSummary[]> {
  try {
    const client = await createServiceRoleClient();

    const { data: memberships } = await client
      .from('org_memberships')
      .select('user_id, department, org_role, joined_at')
      .eq('org_id', orgId);

    const rows = memberships ?? [];
    if (rows.length === 0) return [];

    const userIds = rows.map((m) => m.user_id as string);

    const [profilesRes, sessionsRes, completedRes, riskRes, personaRes] = await Promise.all([
      client
        .from('profiles')
        .select('id, first_name, last_name, email, is_active')
        .in('id', userIds),

      // All sessions for this org, scoped to these users — used for
      // played/completed counts and last-activity timestamp.
      client
        .from('game_sessions')
        .select('user_id, status, ended_at, started_at')
        .eq('org_id', orgId)
        .in('user_id', userIds),

      client
        .from('progress')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .in('user_id', userIds),

      client
        .from('risk_scores')
        .select('user_id, total_score, risk_tier, computed_at')
        .eq('org_id', orgId)
        .in('user_id', userIds)
        .order('computed_at', { ascending: false }),

      client
        .from('security_personas')
        .select('user_id, persona, assigned_at')
        .eq('org_id', orgId)
        .in('user_id', userIds)
        .order('assigned_at', { ascending: false }),
    ]);

    const profileById = new Map<string, { first_name: string; last_name: string; email: string; is_active: boolean }>();
    for (const p of profilesRes.data ?? []) {
      profileById.set(p.id, p);
    }

    type SessionAgg = { played: number; completed: number; lastActivityAt: string | null };
    const sessionAggByUser = new Map<string, SessionAgg>();
    for (const s of (sessionsRes.data ?? []) as Array<{ user_id: string; status: string; ended_at: string | null; started_at: string }>) {
      const agg = sessionAggByUser.get(s.user_id) ?? { played: 0, completed: 0, lastActivityAt: null };
      agg.played += 1;
      if (s.status === 'completed') agg.completed += 1;
      const activityAt = s.ended_at ?? s.started_at;
      if (activityAt && (!agg.lastActivityAt || activityAt > agg.lastActivityAt)) {
        agg.lastActivityAt = activityAt;
      }
      sessionAggByUser.set(s.user_id, agg);
    }

    const completedModulesByUser = new Map<string, number>();
    for (const row of (completedRes.data ?? []) as Array<{ user_id: string }>) {
      completedModulesByUser.set(row.user_id, (completedModulesByUser.get(row.user_id) ?? 0) + 1);
    }

    const latestRiskByUser = new Map<string, { total_score: number; risk_tier: RiskTier }>();
    for (const row of (riskRes.data ?? []) as Array<{ user_id: string; total_score: number; risk_tier: RiskTier }>) {
      if (!latestRiskByUser.has(row.user_id)) {
        latestRiskByUser.set(row.user_id, { total_score: row.total_score, risk_tier: row.risk_tier });
      }
    }

    const latestPersonaByUser = new Map<string, SecurityPersona>();
    for (const row of (personaRes.data ?? []) as Array<{ user_id: string; persona: SecurityPersona }>) {
      if (!latestPersonaByUser.has(row.user_id)) {
        latestPersonaByUser.set(row.user_id, row.persona);
      }
    }

    return rows.map((m): OrgEmployeeSummary => {
      const userId = m.user_id as string;
      const profile = profileById.get(userId);
      const sessionAgg = sessionAggByUser.get(userId);
      const risk = latestRiskByUser.get(userId);
      return {
        userId,
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        email: profile?.email ?? 'unknown',
        department: (m.department as string | null) ?? null,
        orgRole: m.org_role as UserRole,
        isActive: profile?.is_active ?? true,
        joinedAt: m.joined_at as string,
        sessionsPlayed: sessionAgg?.played ?? 0,
        sessionsCompleted: sessionAgg?.completed ?? 0,
        modulesCompleted: completedModulesByUser.get(userId) ?? 0,
        riskScore: risk?.total_score ?? null,
        riskTier: risk?.risk_tier ?? null,
        persona: latestPersonaByUser.get(userId) ?? null,
        lastActivityAt: sessionAgg?.lastActivityAt ?? null,
      };
    });
  } catch (err) {
    console.error('[getOrgEmployees]', err);
    return [];
  }
}

// ── Admin: individual employee report (drill-down) ───────────────────────────

export interface EmployeeReportData {
  profile: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
    orgRole: UserRole;
    isActive: boolean;
    joinedAt: string;
  };
  riskScore: number | null;
  riskTier: RiskTier | null;
  riskHistory: Array<{ computedAt: string; totalScore: number; riskTier: RiskTier }>;
  latestRiskExplanation: RiskScoreExplanation | null;
  persona: SecurityPersona | null;
  personaConfidence: number | null;
  personaHistory: Array<{ assignedAt: string; persona: SecurityPersona; confidence: number }>;
  modulesCompleted: number;
  totalActiveModules: number;
  sessions: Array<{
    id: string;
    moduleTitle: string;
    gameType: string;
    status: string;
    score: number | null;
    passed: boolean | null;
    startedAt: string;
    endedAt: string | null;
  }>;
}

/**
 * Returns null if the target user is not a member of `orgId` — this is the
 * server-side org-scoping check that keeps one org's admin from viewing
 * another org's employee data, independent of anything the UI does.
 */
export async function getEmployeeReport(
  userId: string,
  orgId: string
): Promise<EmployeeReportData | null> {
  try {
    const client = await createServiceRoleClient();

    const { data: membership } = await client
      .from('org_memberships')
      .select('user_id, department, org_role, joined_at')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();

    // Target user does not belong to this admin's org — refuse to return
    // anything rather than leaking a partially-empty report.
    if (!membership) return null;

    const [profileRes, riskHistoryRes, personaHistoryRes, sessionsRes, completedRes, modulesRes] = await Promise.all([
      client
        .from('profiles')
        .select('first_name, last_name, email, is_active')
        .eq('id', userId)
        .maybeSingle(),

      client
        .from('risk_scores')
        .select('total_score, risk_tier, computed_at, explanation_json')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .order('computed_at', { ascending: false })
        .limit(30),

      client
        .from('security_personas')
        .select('persona, confidence, assigned_at')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .order('assigned_at', { ascending: false })
        .limit(10),

      client
        .from('game_sessions')
        .select('id, module_id, status, score, passed, started_at, ended_at')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .order('started_at', { ascending: false })
        .limit(25),

      client
        .from('progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'completed'),

      client
        .from('modules')
        .select('id', { count: 'exact', head: true })
        .or(`org_id.eq.${orgId},org_id.is.null`)
        .eq('is_active', true),
    ]);

    const riskRows = (riskHistoryRes.data ?? []) as Array<{
      total_score: number;
      risk_tier: RiskTier;
      computed_at: string;
      explanation_json: RiskScoreExplanation | null;
    }>;
    const latest = riskRows[0];

    const personaRows = (personaHistoryRes.data ?? []) as Array<{
      persona: SecurityPersona;
      confidence: number;
      assigned_at: string;
    }>;
    const latestPersona = personaRows[0];

    const sessionRows = (sessionsRes.data ?? []) as Array<{
      id: string;
      module_id: string;
      status: string;
      score: number | null;
      passed: boolean | null;
      started_at: string;
      ended_at: string | null;
    }>;

    const moduleIds = [...new Set(sessionRows.map((s) => s.module_id).filter(Boolean))];
    const moduleInfoById = new Map<string, { title: string; game_type: string }>();
    if (moduleIds.length > 0) {
      const { data: moduleRows } = await client
        .from('modules')
        .select('id, title, game_type')
        .in('id', moduleIds);
      for (const m of moduleRows ?? []) {
        moduleInfoById.set(m.id, { title: m.title, game_type: m.game_type });
      }
    }

    return {
      profile: {
        userId,
        firstName: profileRes.data?.first_name ?? '',
        lastName: profileRes.data?.last_name ?? '',
        email: profileRes.data?.email ?? 'unknown',
        department: (membership.department as string | null) ?? null,
        orgRole: membership.org_role as UserRole,
        isActive: profileRes.data?.is_active ?? true,
        joinedAt: membership.joined_at as string,
      },
      riskScore: latest?.total_score ?? null,
      riskTier: latest?.risk_tier ?? null,
      riskHistory: riskRows
        .slice()
        .reverse()
        .map((r) => ({ computedAt: r.computed_at, totalScore: r.total_score, riskTier: r.risk_tier })),
      latestRiskExplanation: latest?.explanation_json ?? null,
      persona: latestPersona?.persona ?? null,
      personaConfidence: latestPersona?.confidence ?? null,
      personaHistory: personaRows.map((p) => ({
        assignedAt: p.assigned_at,
        persona: p.persona,
        confidence: p.confidence,
      })),
      modulesCompleted: completedRes.count ?? 0,
      totalActiveModules: modulesRes.count ?? 0,
      sessions: sessionRows.map((s) => ({
        id: s.id,
        moduleTitle: moduleInfoById.get(s.module_id)?.title ?? 'Unknown module',
        gameType: moduleInfoById.get(s.module_id)?.game_type ?? 'unknown',
        status: s.status,
        score: s.score,
        passed: s.passed,
        startedAt: s.started_at,
        endedAt: s.ended_at,
      })),
    };
  } catch (err) {
    console.error('[getEmployeeReport]', err);
    return null;
  }
}
