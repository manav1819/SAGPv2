import { Users, UserPlus, Search } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Users className="h-7 w-7 sagp-text-primary" />
          Users
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
        <input type="search" placeholder="Search users…" className="sagp-input pl-9 w-full max-w-sm" />
      </div>

      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Users className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No users yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Invite employees to join your organisation using the join code in Settings.
        </p>
      </div>
    </div>
  );
}
