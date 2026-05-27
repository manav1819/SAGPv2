/**
 * Admin Analytics - Server Component
 *
 * Live risk score data, persona distribution, and score history.
 * SSR initial data + client realtime updates via useAdminDashboard hook.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import { AdminAnalyticsClient } from './AdminAnalyticsClient';
import { redirect } from 'next/navigation';

type TopRiskUserRow = {
  user_id: string;
  total_score: number;
  risk_tier: string;
  computed_at: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
};

async function queryTopRiskUsers(
  service: Awaited<ReturnType<typeof createServiceRoleClient>>,
  orgId: string
): Promise<TopRiskUserRow[]> {
  const { data } = await service
    .from('risk_scores')
    .select('user_id, total_score, risk_tier, computed_at, profiles!user_id(first_name, last_name, email)')
    .eq('org_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(200);

  const seen = new Set<string>();
  const rows = (data ?? []) as Array<Record<string, unknown>>;

  return rows
    .filter((r) => {
      const uid = r.user_id as string;
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    })
    .sort((a, b) => (b.total_score as number) - (a.total_score as number))
    .slice(0, 20)
    .map((r): TopRiskUserRow => {
      const pa = r.profiles as Array<{ first_name: string; last_name: string; email: string }> | null;
      return {
        user_id: r.user_id as string,
        total_score: r.total_score as number,
        risk_tier: r.risk_tier as string,
        computed_at: r.computed_at as string,
        profiles: Array.isArray(pa) && pa.length > 0 ? pa[0] : null,
      };
    });
}

export default async function AdminAnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = await createServiceRoleClient();
  const { data: membership } = await service
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.org_id) redirect('/login');

  const orgId = membership.org_id as string;

  const [dashData, topRiskUsers] = await Promise.all([
    getAdminDashboardData(orgId).catch(() => null),
    queryTopRiskUsers(service, orgId).catch((): TopRiskUserRow[] => []),
  ]);

  return (
    <AdminAnalyticsClient
      orgId={orgId}
      initialData={dashData}
      topRiskUsers={topRiskUsers}
    />
  );
}
