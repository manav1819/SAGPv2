import { Users } from 'lucide-react';

export default function AdminUsersLoading() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Users className="h-7 w-7 sagp-text-primary" />
          Users
        </h1>
      </div>
      <div className="h-9 w-full max-w-sm rounded bg-slate-800 animate-pulse" />
      <div className="sagp-card overflow-hidden">
        <div className="divide-y divide-slate-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
