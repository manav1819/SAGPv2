/**
 * Admin Employee Report — Server Component
 *
 * Per-employee drill-down for org admins: risk history, persona, and game
 * session activity for a single employee.
 *
 * Org scoping: `getEmployeeReport` looks the target user up by
 * (user_id, org_id) and returns null if they aren't a member of the
 * caller's org — we resolve `orgId` from the admin's own session, never
 * from the URL, so a different org's admin cannot page through this route
 * to view another organization's employees. `notFound()` is used instead
 * of a generic error so cross-org attempts and typos look identical.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getEmployeeReport } from '@/lib/actions/dashboard';
import { EmployeeReportView } from './EmployeeReportView';
import { redirect, notFound } from 'next/navigation';

export default async function AdminEmployeeReportPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

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

  const report = await getEmployeeReport(userId, membership.org_id as string);
  if (!report) notFound();

  return <EmployeeReportView report={report} />;
}
