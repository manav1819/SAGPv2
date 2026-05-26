import { LayoutDashboard, Users, BookOpen, Shield, TrendingUp, BarChart3 } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 sagp-text-primary" />
          Admin Dashboard
        </h1>
        <div className="sagp-badge sagp-badge-purple">Organisation Overview</div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <Users className="h-5 w-5" />, label: 'Total Employees', value: '—' },
          { icon: <BookOpen className="h-5 w-5" />, label: 'Active Modules', value: '—' },
          { icon: <Shield className="h-5 w-5" />, label: 'Avg Risk Score', value: '—' },
          { icon: <TrendingUp className="h-5 w-5" />, label: 'Completion Rate', value: '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="sagp-card p-4 space-y-2">
            <div className="flex items-center gap-2 sagp-text-primary">
              {icon}
              <span className="text-xs font-medium uppercase tracking-wider sagp-text-muted">{label}</span>
            </div>
            <p className="text-2xl font-bold sagp-neon-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder analytics */}
      <div className="sagp-card p-6 flex flex-col items-center justify-center gap-3 py-16 text-center">
        <BarChart3 className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">Analytics coming soon</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Connect your organisation's data to see live risk scores, completion rates, and persona breakdowns.
        </p>
      </div>
    </div>
  );
}
