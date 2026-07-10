/**
 * Admin Users — Server Component
 *
 * Lists every employee in the admin's own organization along with their
 * game participation, risk score, and persona. Scoped server-side to the
 * caller's org_id (see getOrgEmployees in @/lib/actions/dashboard) — never
 * trust a client-supplied org id here.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getOrgEmployees } from '@/lib/actions/dashboard';
import { AdminUsersClient } from './AdminUsersClient';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
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
  const employees = await getOrgEmployees(orgId);

  return <AdminUsersClient employees={employees} />;
}
