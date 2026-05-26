import { BarChart3, TrendingUp, Users, Shield } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 sagp-text-primary" />
        Analytics
      </h1>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: <Users className="h-5 w-5" />, label: 'Active Learners', value: '—' },
          { icon: <TrendingUp className="h-5 w-5" />, label: 'Avg Score', value: '—' },
          { icon: <Shield className="h-5 w-5" />, label: 'High-Risk Users', value: '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="sagp-card p-4 space-y-2">
            <div className="flex items-center gap-2 sagp-text-primary">{icon}
              <span className="text-xs uppercase tracking-wider sagp-text-muted">{label}</span>
            </div>
            <p className="text-2xl font-bold sagp-neon-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <BarChart3 className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No analytics data yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Analytics are generated as employees complete training modules.
        </p>
      </div>
    </div>
  );
}
