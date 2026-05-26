import { LayoutDashboard, Building, Users, TrendingUp } from 'lucide-react';

export default function SuperadminDashboardPage() {
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
        {[
          { icon: <Building className="h-5 w-5" />, label: 'Organisations', value: '—' },
          { icon: <Users className="h-5 w-5" />, label: 'Total Users', value: '—' },
          { icon: <TrendingUp className="h-5 w-5" />, label: 'Platform Completion', value: '—' },
        ].map(({ icon, label, value }) => (
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
        Platform-wide analytics will populate here as organisations onboard.
      </div>
    </div>
  );
}
