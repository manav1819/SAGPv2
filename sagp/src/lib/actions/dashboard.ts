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
import type { RiskTier, SecurityPersona } from '@/types/database';

// ── Employee dashboard ──────────────────────────────────────────────────────

export interface EmployeeDashboardData {
  riskScore: number | null;
  riskTier: RiskTier | null;
  persona: SecurityPersona | null;
  personaConfidence: number | null;
  streakDays: number;
  totalPoints: number;
  modulesCompleted: number;
  recentSessions: Array<{
    id: string;
    moduleTitle: string;
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

    const [riskRes, personaRes, streakRes, completedRes, sessionsRes] = await Promise.all([
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
      recentSessions: sessionRows.map((s: any) => ({
        id: s.id,
        moduleTitle: moduleTitleMap.get(s.module_id) ?? 'Unknown module',
        score: s.score,
        passed: s.passed,
        endedAt: s.ended_at,
      })),
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
        .select('persona')
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

    // Deduplicate personasRes by user_id — latest persona per user
    const latestPersonaByUser = new Map<string, string>();
    const personaRowsSorted = (personasRes.data ?? []) as Array<{ persona: string }>;
    // Data is ordered by assigned_at DESC, so first occurrence per user is latest
    for (const row of personaRowsSorted) {
      // No user_id in this select — count all, latest per persona label aggregate
      latestPersonaByUser.set(row.persona, (latestPersonaByUser.get(row.persona) ?? '') + '1');
    }
    const personaCounts = new Map<string, number>();
    for (const row of personaRowsSorted) {
      personaCounts.set(row.persona, (personaCounts.get(row.persona) ?? 0) + 1);
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
