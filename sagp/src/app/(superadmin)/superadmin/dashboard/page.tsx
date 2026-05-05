import { Building, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SuperadminDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Superadmin Dashboard</h1>
        <p className="mt-1 text-slate-400">Platform-level management for SAGP.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          href="/superadmin/organizations"
          className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-purple-500/50 hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
            <Building className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Organisations</h2>
            <p className="mt-1 text-sm text-slate-400">Create organisations and view their join codes.</p>
          </div>
        </Link>

        <Link
          href="/superadmin/admins"
          className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-purple-500/50 hover:bg-slate-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Invite Admins</h2>
            <p className="mt-1 text-sm text-slate-400">Send invite emails to new organisation admins.</p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
            <ShieldCheck className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-300">Your Role</h2>
            <p className="mt-1 text-sm text-slate-400">
              You are a Superadmin. You have full platform access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
