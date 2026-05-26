import { Scroll, Search } from 'lucide-react';

export default function AdminAuditPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <Scroll className="h-7 w-7 sagp-text-primary" />
        Audit Log
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
          <input type="search" placeholder="Filter events…" className="sagp-input pl-9 w-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="sagp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Time</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Actor</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Action</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Entity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="px-4 py-16 text-center sagp-text-muted">
                No audit events recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
