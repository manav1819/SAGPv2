import { Building, Plus, Search } from 'lucide-react';

export default function SuperadminOrganizationsPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Building className="h-7 w-7 sagp-text-primary" />
          Organisations
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Organisation
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
        <input type="search" placeholder="Search organisations…" className="sagp-input pl-9 w-full" />
      </div>

      <div className="sagp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Domain</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Join Code</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="px-4 py-16 text-center sagp-text-muted">
                No organisations yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
