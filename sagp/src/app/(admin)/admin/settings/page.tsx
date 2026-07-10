import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { AdminSettingsClient } from './AdminSettingsClient';

export default async function AdminSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = await createServiceRoleClient();
  const { data: membership } = await service
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.org_id) redirect('/login');

  const { data: org } = await service
    .from('organizations')
    .select('name, join_code')
    .eq('id', membership.org_id)
    .maybeSingle();

  return <AdminSettingsClient orgName={org?.name ?? ''} joinCode={org?.join_code ?? ''} />;
}
