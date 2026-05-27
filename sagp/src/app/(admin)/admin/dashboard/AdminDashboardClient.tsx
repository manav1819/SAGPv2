'use client';

import { useAdminDashboard, RISK_TIER_COLORS } from '@/lib/hooks/useLiveData';
import type { AdminDashboardData } from '@/lib/actions/dashboard';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Shield,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';

interface Props {
  orgId: string;
  initialData: AdminDashboardData | null;
}

export function AdminDashboardClient({ orgId, initialData }: Props) {
  const { data: liveData, isLoading, reload } = useAdminDashboard(orgId);

  // Use live data when available, fall back to SSR data
  const d = liveData ?? initialData;

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 sagp-text-primary" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={reload} className="p-2 rounded sagp-card hover:border-cyan-500/40 transition-colors" title="Refresh">
            <RefreshCw className={`h-4 w-4 sagp-text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="sagp-badge sagp-badge-purple">Organisation Overview</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Total Employees"
          value={d?.totalUsers != null ? String(d.totalUsers) : '—'}
          sub={d ? `${d.scoredUsers} scored (${d.coveragePct}% coverage)` : ''}
        />
        <KpiCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Active Modules"
          value={d?.activeModules != null ? String(d.activeModules) : '—'}
          sub={d ? `${Math.round(d.avgCompletionRate)}% avg completion` : ''}
        />
        <KpiCard
          icon={<Shield className="h-5 w-5" />}
          label="Org Risk Score"
          value={d?.armWeightedAvgRisk != null ? String(d.armWeightedAvgRisk) : '—'}
          sub={d ? `${d.criticalPct}% critical users` : ''}
          valueClass={d?.criticalPct && d.criticalPct > 10 ? 'text-red-400' : 'sagp-neon-text'}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Company Score"
          value={d?.companyScore != null ? String(d.companyScore) : '—'}
          sub={d ? `${d.incompleteRate}% incomplete rate` : ''}
          valueClass={
            d?.companyScore != null
              ? d.companyScore >= 70 ? 'text-green-400' : d.companyScore >= 50 ? 'text-yellow-400' : 'text-red-400'
              : 'sagp-neon-text'
          }
        />
      </div>

      {/* Risk distribution + Top personas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk tier distribution */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sagp-text-primary" />
            Risk Tier Distribution
          </h2>
          {d?.riskDistribution ? (
            <div className="space-y-3">
              {(['critical', 'high', 'medium', 'low'] as const).map((tier) => {
                const count = d.riskDistribution[tier] ?? 0;
                const total = d.scoredUsers || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium uppercase ${RISK_TIER_COLORS[tier]}`}>{tier}</span>
                      <span className="sagp-text-muted">{count} users ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          tier === 'critical' ? 'bg-red-500' :
                          tier === 'high' ? 'bg-orange-500' :
                          tier === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No risk data yet. Employees must complete at least one module." />
          )}
        </div>

        {/* Top personas */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <Activity className="h-4 w-4 sagp-text-primary" />
            Persona Breakdown
          </h2>
          {d?.topPersonas && d.topPersonas.length > 0 ? (
            <div className="space-y-2">
              {d.topPersonas.map(({ persona, count }) => (
                <div key={persona} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-sm text-slate-200 capitalize">{persona.replace(/_/g, ' ')}</span>
                  <span className="text-sm sagp-neon-text font-semibold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Personas are assigned after phishing simulations or training modules." />
          )}
        </div>
      </div>

      {/* Score history sparkline — data only, no charting lib needed */}
      {d?.scoreHistory && d.scoreHistory.length > 0 && (
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sagp-text-primary" />
            Company Score — 30 Day Trend
          </h2>
          <div className="flex items-end gap-1 h-24">
            {d.scoreHistory.map(({ date, score }) => (
              <div
                key={date}
                className="flex-1 rounded-t bg-cyan-500/60 hover:bg-cyan-400 transition-colors"
                style={{ height: `${score}%` }}
                title={`${date}: ${score}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs sagp-text-muted">
            <span>{d.scoreHistory[0]?.date}</span>
            <span>{d.scoreHistory[d.scoreHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function KpiCard({ icon, label, value, sub, valueClass }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="sagp-card p-4 space-y-2">
      <div className="flex items-center gap-2 sagp-text-primary">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider sagp-text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClass ?? 'sagp-neon-text'}`}>{value}</p>
      {sub && <p className="text-xs sagp-text-muted">{sub}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <BarChart3 className="h-8 w-8 sagp-text-muted opacity-30" />
      <p className="sagp-text-muted text-sm max-w-xs">{message}</p>
    </div>
  );
}
