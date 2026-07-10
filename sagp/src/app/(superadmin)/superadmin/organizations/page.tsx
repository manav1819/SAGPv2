import { redirect } from 'next/navigation';
import { getSuperadminOrganizations } from '@/lib/actions/superadmin';
import { SuperadminOrganizationsClient } from './SuperadminOrganizationsClient';

export default async function SuperadminOrganizationsPage() {
  const result = await getSuperadminOrganizations();

  if (!result.success) redirect('/login');

  return <SuperadminOrganizationsClient orgs={result.orgs} />;
}
