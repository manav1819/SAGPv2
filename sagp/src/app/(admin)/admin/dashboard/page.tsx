/**
 * Admin Dashboard — Server Component
 *
 * Fetches org data on the server for instant SSR rendering.
 * The client-side realtime layer (useAdminDashboard) is isolated
 * in <AdminDashboardClient> so the page shell renders immediately
 * and the numbers hydrate in <1s from cache.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import { AdminDashboardClient } from './AdminDashboardClient';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  // Resolve org_id server-side
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

  // SSR fetch — data lands in the initial HTML, no loading flash
  const initialData = await getAdminDashboardData(membership.org_id).catch(() => null);

  return (
    <AdminDashboardClient
      orgId={membership.org_id}
      initialData={initialData}
    />
  );
}
