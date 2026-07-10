import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowUpRight } from 'lucide-react';
import { getSuperadminOrganizations } from '@/lib/actions/superadmin';

export default async function SuperadminAdminsPage() {
  const result = await getSuperadminOrganizations();

  if (!result.success) redirect('/login');

  const admins = result.orgs
    .filter((org) => org.orgAdmin !== null)
    .map((org) => ({ org, admin: org.orgAdmin! }));

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Users className="h-7 w-7 sagp-text-primary" />
          Organisation Admins
        </h1>
      </div>

      <div className="sagp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Email</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Organisation</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center sagp-text-muted">
                  No org admins assigned yet — assign one from the Organisations page.
                </td>
              </tr>
            ) : (
              admins.map(({ org, admin }) => (
                <tr key={org.orgId} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{admin.name}</td>
                  <td className="px-4 py-3 sagp-text-muted">{admin.email}</td>
                  <td className="px-4 py-3 sagp-text-muted">{org.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href="/superadmin/organizations"
                      className="sagp-link inline-flex items-center gap-1 text-xs whitespace-nowrap"
                    >
                      Manage <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
