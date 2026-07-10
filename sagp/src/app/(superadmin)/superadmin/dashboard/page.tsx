import { LayoutDashboard, Building, Users, TrendingUp } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSuperadminPlatformStats } from '@/lib/actions/superadmin';

export default async function SuperadminDashboardPage() {
  const result = await getSuperadminPlatformStats();

  // requireSuperadmin() inside the action already gates this, but middleware
  // is the primary guard — this redirect only fires if someone's session
  // role changed mid-flight.
  if (!result.success) redirect('/login');

  const { stats } = result;

  const cards = [
    { icon: <Building className="h-5 w-5" />, label: 'Organisations', value: String(stats.totalOrganizations) },
    { icon: <Users className="h-5 w-5" />, label: 'Total Users', value: String(stats.totalUsers) },
    { icon: <TrendingUp className="h-5 w-5" />, label: 'Platform Completion', value: `${stats.platformCompletionPct}%` },
  ];

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 sagp-text-primary" />
          Superadmin Dashboard
        </h1>
        <div className="sagp-badge sagp-badge-purple">Platform Overview</div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ icon, label, value }) => (
          <div key={label} className="sagp-card p-4 space-y-2">
            <div className="flex items-center gap-2 sagp-text-primary">
              {icon}
              <span className="text-xs uppercase tracking-wider sagp-text-muted">{label}</span>
            </div>
            <p className="text-2xl font-bold sagp-neon-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="sagp-card p-6 text-sm sagp-text-muted text-center">
        {stats.totalOrganizations === 0
          ? 'Platform-wide analytics will populate here as organisations onboard.'
          : 'See Organisations for per-org detail and to reassign org admins.'}
      </div>
    </div>
  );
}
