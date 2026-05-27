'use client';

import { useAdminDashboard, RISK_TIER_COLORS } from '@/lib/hooks/useLiveData';
import type { AdminDashboardData } from '@/lib/actions/dashboard';
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  RefreshCw,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface TopRiskUser {
  user_id: string;
  total_score: number;
  risk_tier: string;
  computed_at: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

interface Props {
  orgId: string;
  initialData: AdminDashboardData | null;
  topRiskUsers: TopRiskUser[];
}

export function AdminAnalyticsClient({ orgId, initialData, topRiskUsers }: Props) {
  const { data: liveData, isLoading, reload } = useAdminDashboard(orgId);
  const d = liveData ?? initialData;

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 sagp-text-primary" />
          Analytics
        </h1>
        <button onClick={reload} className="p-2 rounded sagp-card hover:border-cyan-500/40 transition-colors" title="Refresh">
          <RefreshCw className={`h-4 w-4 sagp-text-muted ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricTile
          icon={<Users className="h-5 w-5" />}
          label="Active Learners"
          value={d?.scoredUsers != null ? String(d.scoredUsers) : '—'}
          sub={`of ${d?.totalUsers ?? '—'} total`}
        />
        <MetricTile
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Risk Score"
          value={d?.avgRisk != null ? String(d.avgRisk) : '—'}
          sub={`ARM-weighted: ${d?.armWeightedAvgRisk ?? '—'}`}
          valueClass={d?.avgRisk != null ? (d.avgRisk > 60 ? 'text-red-400' : d.avgRisk > 40 ? 'text-yellow-400' : 'text-green-400') : 'sagp-neon-text'}
        />
        <MetricTile
          icon={<Shield className="h-5 w-5" />}
          label="High-Risk Users"
          value={d?.riskDistribution ? String((d.riskDistribution.high ?? 0) + (d.riskDistribution.critical ?? 0)) : '—'}
          sub={d?.criticalPct != null ? `${d.criticalPct}% critical` : ''}
          valueClass="text-orange-400"
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top high-risk employees */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Highest Risk Employees
          </h2>
          {topRiskUsers.length > 0 ? (
            <div className="space-y-1">
              {topRiskUsers.map((u) => {
                const name = u.profiles
                  ? `${u.profiles.first_name} ${u.profiles.last_name}`.trim()
                  : u.user_id.slice(0, 8);
                return (
                  <div key={u.user_id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{name}</p>
                      <p className="text-xs sagp-text-muted truncate">{u.profiles?.email ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-sm font-semibold ${RISK_TIER_COLORS[u.risk_tier] ?? 'sagp-text-muted'}`}>
                        {u.total_score}
                      </span>
                      <span className={`text-xs uppercase px-1.5 py-0.5 rounded ${
                        u.risk_tier === 'critical' ? 'bg-red-500/20 text-red-400' :
                        u.risk_tier === 'high'     ? 'bg-orange-500/20 text-orange-400' :
                        u.risk_tier === 'medium'   ? 'bg-yellow-500/20 text-yellow-400' :
                                                     'bg-green-500/20 text-green-400'
                      }`}>
                        {u.risk_tier}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No risk scores computed yet. Employees must complete a module first." />
          )}
        </div>

        {/* Persona distribution */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <Activity className="h-4 w-4 sagp-text-primary" />
            Persona Distribution
          </h2>
          {d?.topPersonas && d.topPersonas.length > 0 ? (
            <div className="space-y-3">
              {d.topPersonas.map(({ persona, count }) => {
                const total = d.topPersonas.reduce((s, p) => s + p.count, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={persona} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 capitalize">{persona.replace(/_/g, ' ')}</span>
                      <span className="sagp-text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-cyan-500/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Personas are generated after phishing simulations and training games." />
          )}
        </div>
      </div>

      {/* 30-day score history */}
      {d?.scoreHistory && d.scoreHistory.length > 0 && (
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sagp-text-primary" />
            Company Score — 30 Day Trend
          </h2>
          <div className="flex items-end gap-0.5 h-32">
            {d.scoreHistory.map(({ date, score, coverage_pct }) => (
              <div
                key={date}
                className="flex-1 rounded-t bg-cyan-500/50 hover:bg-cyan-400/80 transition-colors cursor-default min-w-0"
                style={{ height: `${Math.max(score, 4)}%` }}
                title={`${date}: score ${score} (${coverage_pct}% coverage)`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs sagp-text-muted">
            <span>{d.scoreHistory[0]?.date}</span>
            <span>Latest: {d.scoreHistory[d.scoreHistory.length - 1]?.score ?? '—'}</span>
            <span>{d.scoreHistory[d.scoreHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function MetricTile({ icon, label, value, sub, valueClass }: {
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
        <span className="text-xs uppercase tracking-wider sagp-text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClass ?? 'sagp-neon-text'}`}>{value}</p>
      {sub && <p className="text-xs sagp-text-muted">{sub}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <BarChart3 className="h-8 w-8 sagp-text-muted opacity-30" />
      <p className="sagp-text-muted text-sm max-w-xs">{message}</p>
    </div>
  );
}
