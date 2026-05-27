/**
 * SAGP Company-Level Risk Score Engine
 *
 * Computes an org-level security posture score from per-employee risk scores,
 * completion rates, and ARM-weighted averages.
 *
 * Formula:
 *   company_score = 100
 *     - ARM_weighted_avg_risk × 0.50
 *     - incomplete_rate        × 0.30
 *     - critical_pct           × 0.20
 *
 *   ARM_weighted_avg_risk = Σ(score_i × arm_i) / Σ(arm_i)
 *
 * Fixes applied vs. previous version:
 *   BUG-004: Deduplication was by score VALUE not user_id. Two employees sharing
 *            a score (e.g., 72) would cause one to be silently dropped. Fixed by
 *            selecting user_id and deduplicating with a Map keyed on user_id.
 *   BUG-005: N+1 query loop fired one Supabase roundtrip per user for completion
 *            stats. Fixed by fetching all progress rows in a single .in() query.
 *   GAP-007: Company score now ARM-weighted so privileged-role failures count more.
 *   GAP-008: getScoreHistory now uses latest-score-per-user per day, not all rows.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { ARM_BASE, type RoleContext } from './risk-score';

export interface CompanyScoreData {
  score: number;
  avg_risk: number;
  arm_weighted_avg_risk: number;
  incomplete_rate: number;
  critical_pct: number;
  total_users: number;
  scored_users: number;         // users with at least one score computed
  coverage_pct: number;         // scored_users / total_users × 100
  avg_completion_rate: number;
  computed_at: string;
}

// ─── ARM lookup for weighting (mirrors ARM_BASE from risk-score.ts) ──────────

function getArmForRoleBand(roleBand: string | null | undefined): number {
  return ARM_BASE[(roleBand ?? 'standard') as keyof typeof ARM_BASE] ?? ARM_BASE.standard;
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

export async function computeCompanyScore(orgId: string): Promise<CompanyScoreData> {
  const client = await createServiceRoleClient();

  // 1. Fetch org members with their role_band for ARM weighting.
  const { data: orgMembers } = await client
    .from('org_memberships')
    .select('user_id')
    .eq('org_id', orgId);

  const userIds = (orgMembers ?? []).map((m: { user_id: string }) => m.user_id);

  // 2. Fetch latest risk score per user.
  //    FIX (BUG-004): We now select user_id and deduplicate by it in memory,
  //    taking the first row per user (query is ordered newest-first).
  //    The previous version deduped by score VALUE, silently dropping users
  //    who shared the same numeric score.
  const { data: allRiskScores } = await client
    .from('risk_scores')
    .select('user_id, total_score, risk_tier')
    .eq('org_id', orgId)
    .order('computed_at', { ascending: false });

  // Latest score per user (Map preserves insertion order; first hit = latest).
  const latestByUser = new Map<string, { total_score: number; risk_tier: string }>();
  for (const row of allRiskScores ?? []) {
    if (!latestByUser.has(row.user_id)) {
      latestByUser.set(row.user_id, { total_score: row.total_score, risk_tier: row.risk_tier });
    }
  }

  // 3. Fetch role_band for all org members so we can ARM-weight.
  let roleBandByUser = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, role_band')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      if (p.role_band) roleBandByUser.set(p.id, p.role_band);
    }
  }

  // 4. Compute plain and ARM-weighted averages from latest-per-user scores.
  let plainSum = 0;
  let armWeightedSum = 0;
  let armTotal = 0;
  let criticalCount = 0;
  const scoredUsers = latestByUser.size;

  for (const [userId, row] of latestByUser) {
    const arm = getArmForRoleBand(roleBandByUser.get(userId));
    plainSum += row.total_score;
    armWeightedSum += row.total_score * arm;
    armTotal += arm;
    if (row.risk_tier === 'critical') criticalCount += 1;
  }

  const avgRisk = scoredUsers > 0 ? plainSum / scoredUsers : 0;
  // GAP-007 fix: arm-weighted average ensures high-privilege employee risk matters more.
  const armWeightedAvgRisk = armTotal > 0 ? armWeightedSum / armTotal : avgRisk;
  const criticalPct = scoredUsers > 0 ? (criticalCount / scoredUsers) * 100 : 0;

  // 5. Completion rates — single batched query (FIX BUG-005: no more N+1 loop).
  const { data: allModules } = await client
    .from('modules')
    .select('id')
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .eq('is_active', true);

  const moduleCount = allModules?.length ?? 1;
  let avgCompletionRate = 0;

  if (userIds.length > 0 && moduleCount > 0) {
    // Single query for all users' completed module counts.
    const { data: completedRows } = await client
      .from('progress')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .in('user_id', userIds);

    // Count completed modules per user.
    const completedByUser = new Map<string, number>();
    for (const row of completedRows ?? []) {
      completedByUser.set(row.user_id, (completedByUser.get(row.user_id) ?? 0) + 1);
    }

    const totalCompletionRate = userIds.reduce((sum, uid) => {
      const completed = completedByUser.get(uid) ?? 0;
      return sum + (completed / moduleCount) * 100;
    }, 0);
    avgCompletionRate = totalCompletionRate / userIds.length;
  }

  const incompleteRate = 100 - avgCompletionRate;

  // 6. Company score formula (GAP-007: ARM-weighted avg risk instead of plain avg).
  const companyScore =
    100 - armWeightedAvgRisk * 0.5 - incompleteRate * 0.3 - criticalPct * 0.2;

  return {
    score: Math.max(0, Math.round(companyScore)),
    avg_risk: Math.round(avgRisk),
    arm_weighted_avg_risk: Math.round(armWeightedAvgRisk * 10) / 10,
    incomplete_rate: Math.round(incompleteRate),
    critical_pct: Math.round(criticalPct),
    total_users: userIds.length,
    scored_users: scoredUsers,
    coverage_pct: userIds.length > 0 ? Math.round((scoredUsers / userIds.length) * 100) : 0,
    avg_completion_rate: Math.round(avgCompletionRate),
    computed_at: new Date().toISOString(),
  };
}

// ─── Score history ────────────────────────────────────────────────────────────

export async function getScoreHistory(
  orgId: string,
  days: number = 30
): Promise<Array<{ date: string; score: number; coverage_pct: number }>> {
  const client = await createServiceRoleClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // FIX (GAP-008): The previous version averaged ALL score rows per day, so a
  // day with many recalculations (e.g., after a phishing campaign) was biased.
  // We now take the latest score per user per day, then average those.
  const { data: riskScores } = await client
    .from('risk_scores')
    .select('user_id, computed_at, total_score')
    .eq('org_id', orgId)
    .gte('computed_at', startDate.toISOString())
    .order('computed_at', { ascending: false }); // newest first for dedup

  // Group: date → user_id → latest_score (first occurrence per user per day is latest).
  type DayBucket = Map<string, number>; // user_id → score
  const buckets = new Map<string, DayBucket>();

  for (const row of riskScores ?? []) {
    const date = row.computed_at.split('T')[0];
    if (!buckets.has(date)) buckets.set(date, new Map());
    const dayBucket = buckets.get(date)!;
    if (!dayBucket.has(row.user_id)) {
      dayBucket.set(row.user_id, row.total_score);
    }
  }

  // Get total user count for coverage calculation.
  const { data: orgMembers } = await client
    .from('org_memberships')
    .select('user_id')
    .eq('org_id', orgId);
  const totalUsers = orgMembers?.length ?? 1;

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, userScores]) => {
      const scores = [...userScores.values()];
      const avgRisk = scores.reduce((a, b) => a + b, 0) / scores.length;
      // Simplified daily score: mirrors main formula with only avg_risk term.
      const score = Math.max(0, Math.round(100 - avgRisk * 0.5));
      const coverage_pct = Math.round((scores.length / totalUsers) * 100);
      return { date, score, coverage_pct };
    });
}
