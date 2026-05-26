import { Users, UserPlus, Search } from 'lucide-react';

export default function SuperadminAdminsPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Users className="h-7 w-7 sagp-text-primary" />
          Organisation Admins
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
        <input type="search" placeholder="Search admins…" className="sagp-input pl-9 w-full" />
      </div>

      <div className="sagp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Email</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Organisation</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="px-4 py-16 text-center sagp-text-muted">
                No admins found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
