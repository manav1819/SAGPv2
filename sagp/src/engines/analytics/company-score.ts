import { createServiceRoleClient } from '@/lib/supabase/server';

export interface CompanyScoreData {
  score: number;
  avg_risk: number;
  incomplete_rate: number;
  critical_pct: number;
  total_users: number;
  avg_completion_rate: number;
  computed_at: string;
}

export async function computeCompanyScore(orgId: string): Promise<CompanyScoreData> {
  const client = await createServiceRoleClient();

  // Get all risk scores for org users
  const { data: riskScores } = await client
    .from('risk_scores')
    .select('total_score, risk_tier')
    .eq('org_id', orgId)
    .order('computed_at', { ascending: false });

  let avgRisk = 0;
  let criticalPct = 0;
  const totalUsers = new Set<string>();

  if (riskScores && riskScores.length > 0) {
    const uniqueRisks = riskScores.reduce(
      (acc, curr) => {
        if (!acc[curr.total_score]) {
          acc[curr.total_score] = curr;
        }
        return acc;
      },
      {} as Record<number, any>
    );

    const scores = Object.values(uniqueRisks).map((r: any) => r.total_score);
    avgRisk = scores.reduce((a, b) => a + b, 0) / scores.length;

    const criticalCount = Object.values(uniqueRisks).filter(
      (r: any) => r.risk_tier === 'critical'
    ).length;

    criticalPct = (criticalCount / scores.length) * 100;
  }

  // Get completion stats
  const { data: orgMembers } = await client
    .from('org_memberships')
    .select('user_id')
    .eq('org_id', orgId);

  const userIds = orgMembers?.map((m) => m.user_id) || [];
  let completionRates: number[] = [];

  if (userIds.length > 0) {
    const { data: allModules } = await client
      .from('modules')
      .select('id')
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .eq('is_active', true);

    const moduleCount = allModules?.length || 1;

    for (const userId of userIds) {
      const { data: completed } = await client
        .from('progress')
        .select()
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'completed');

      const rate = (completed?.length || 0) / moduleCount;
      completionRates.push(rate * 100);
    }
  }

  const avgCompletionRate =
    completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;

  const incompleteRate = 100 - avgCompletionRate;

  // Formula: 100 - (avg_risk × 0.5) - (incomplete_rate × 0.3) - (critical_pct × 0.2)
  const companyScore = 100 - avgRisk * 0.5 - incompleteRate * 0.3 - criticalPct * 0.2;

  return {
    score: Math.max(0, Math.round(companyScore)),
    avg_risk: Math.round(avgRisk),
    incomplete_rate: Math.round(incompleteRate),
    critical_pct: Math.round(criticalPct),
    total_users: userIds.length,
    avg_completion_rate: Math.round(avgCompletionRate),
    computed_at: new Date().toISOString(),
  };
}

export async function getScoreHistory(
  orgId: string,
  days: number = 30
): Promise<Array<{ date: string; score: number }>> {
  const client = await createServiceRoleClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all risk score records for date range
  const { data: riskScores } = await client
    .from('risk_scores')
    .select('computed_at, total_score')
    .eq('org_id', orgId)
    .gte('computed_at', startDate.toISOString())
    .order('computed_at', { ascending: true });

  // Group by day and calculate average score
  const scoresByDate: Record<string, number[]> = {};

  (riskScores || []).forEach((record) => {
    const date = record.computed_at.split('T')[0];
    if (!scoresByDate[date]) {
      scoresByDate[date] = [];
    }
    scoresByDate[date].push(record.total_score);
  });

  // Calculate company score for each day
  const history = Object.entries(scoresByDate).map(([date, scores]) => {
    const avgRisk = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Simplified score based on avg risk
    const score = Math.max(0, 100 - avgRisk * 0.5);

    return { date, score: Math.round(score) };
  });

  return history;
}
