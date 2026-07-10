import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  User,
  Swords,
  CheckCircle2,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { RISK_TIER_COLORS, PERSONA_LABELS } from '@/lib/hooks/useLiveData';
import type { EmployeeReportData } from '@/lib/actions/dashboard';

interface Props {
  report: EmployeeReportData;
}

export function EmployeeReportView({ report }: Props) {
  const { profile } = report;
  const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
  const riskTierColor = report.riskTier ? RISK_TIER_COLORS[report.riskTier] : 'sagp-neon-text';
  const completionPct =
    report.totalActiveModules > 0
      ? Math.round((report.modulesCompleted / report.totalActiveModules) * 100)
      : 0;

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <Link href="/admin/users" className="sagp-link inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="sagp-heading-1 flex items-center gap-3">
            <User className="h-7 w-7 sagp-text-primary" />
            {name}
          </h1>
          <p className="sagp-text-muted text-sm mt-1">
            {profile.email}
            {profile.department ? ` · ${profile.department}` : ''}
            {' · '}
            <span className="capitalize">{profile.orgRole.replace(/_/g, ' ')}</span>
          </p>
        </div>
        <span className={`sagp-badge ${profile.isActive ? 'sagp-badge-green' : 'sagp-badge-purple'}`}>
          {profile.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Risk Score"
          value={report.riskScore != null ? String(report.riskScore) : '—'}
          hint={report.riskTier ? `Tier: ${report.riskTier.toUpperCase()}` : 'No score yet'}
          valueClass={riskTierColor}
        />
        <StatCard
          icon={<User className="h-5 w-5" />}
          label="Persona"
          value={report.persona ? PERSONA_LABELS[report.persona] ?? report.persona : '—'}
          hint={
            report.personaConfidence != null
              ? `${Math.round(report.personaConfidence * 100)}% confidence`
              : 'Not yet classified'
          }
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Modules Completed"
          value={`${report.modulesCompleted}/${report.totalActiveModules}`}
          hint={`${completionPct}% completion`}
        />
        <StatCard
          icon={<Swords className="h-5 w-5" />}
          label="Sessions Played"
          value={String(report.sessions.length)}
          hint="Most recent 25 shown below"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk breakdown */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sagp-text-primary" />
            Risk Score Breakdown
          </h2>
          {report.latestRiskExplanation ? (
            <div className="space-y-3">
              {report.latestRiskExplanation.components.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200 capitalize">{c.name}</span>
                    <span className="sagp-text-muted">
                      {c.raw_subscore.toFixed(0)} raw · weight {Math.round(c.weight * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-500/70"
                      style={{ width: `${Math.min(100, Math.max(0, c.raw_subscore))}%` }}
                    />
                  </div>
                  <p className="text-xs sagp-text-muted">{c.explanation}</p>
                </div>
              ))}
              <p className="text-xs sagp-text-muted pt-2 border-t border-slate-800">
                ARM {report.latestRiskExplanation.arm.total.toFixed(2)}
                {report.latestRiskExplanation.spike.value > 0 &&
                  ` · Spike +${report.latestRiskExplanation.spike.value.toFixed(1)}`}
                {report.latestRiskExplanation.recovery_credit > 0 &&
                  ` · Recovery −${report.latestRiskExplanation.recovery_credit.toFixed(1)}`}
                {` · Confidence ${Math.round(report.latestRiskExplanation.confidence * 100)}%`}
              </p>
            </div>
          ) : (
            <EmptyState message="No risk score computed yet. This employee must complete a game first." />
          )}
        </div>

        {/* Risk history */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sagp-text-primary" />
            Risk Score History
          </h2>
          {report.riskHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-end gap-1 h-28">
                {report.riskHistory.map((r) => (
                  <div
                    key={r.computedAt}
                    className={`flex-1 rounded-t min-w-0 transition-colors ${
                      r.riskTier === 'critical'
                        ? 'bg-red-500/60 hover:bg-red-400/80'
                        : r.riskTier === 'high'
                        ? 'bg-orange-500/60 hover:bg-orange-400/80'
                        : r.riskTier === 'medium'
                        ? 'bg-yellow-500/60 hover:bg-yellow-400/80'
                        : 'bg-green-500/60 hover:bg-green-400/80'
                    }`}
                    style={{ height: `${Math.max(r.totalScore, 4)}%` }}
                    title={`${new Date(r.computedAt).toLocaleDateString()}: ${r.totalScore} (${r.riskTier})`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs sagp-text-muted">
                <span>{new Date(report.riskHistory[0].computedAt).toLocaleDateString()}</span>
                <span>
                  Latest: {report.riskHistory[report.riskHistory.length - 1]?.totalScore ?? '—'}
                </span>
                <span>
                  {new Date(report.riskHistory[report.riskHistory.length - 1].computedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState message="No score history yet." />
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="sagp-card p-5 space-y-4">
        <h2 className="sagp-heading-3 flex items-center gap-2">
          <Clock className="h-4 w-4 sagp-text-primary" />
          Session History
        </h2>
        {report.sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Module</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Type</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Status</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Score</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Result</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider sagp-text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.sessions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-2 text-slate-200 truncate max-w-[220px]">{s.moduleTitle}</td>
                    <td className="px-3 py-2 sagp-text-muted capitalize">{s.gameType.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 sagp-text-muted capitalize">{s.status.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 sagp-text-muted">{s.score ?? '—'}</td>
                    <td className="px-3 py-2">
                      {s.passed == null ? (
                        <span className="sagp-text-muted">—</span>
                      ) : (
                        <span className={s.passed ? 'text-green-400' : 'text-red-400'}>
                          {s.passed ? 'PASS' : 'FAIL'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 sagp-text-muted whitespace-nowrap">
                      {new Date(s.endedAt ?? s.startedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No game data yet for this employee." />
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({
  icon, label, value, hint, valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="sagp-card p-4 space-y-2">
      <div className="flex items-center gap-2 sagp-text-primary">
        {icon}
        <span className="text-xs uppercase tracking-wider sagp-text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold truncate ${valueClass ?? 'sagp-neon-text'}`}>{value}</p>
      <p className="text-xs sagp-text-muted">{hint}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Shield className="h-8 w-8 sagp-text-muted opacity-30" />
      <p className="sagp-text-muted text-sm max-w-xs">{message}</p>
    </div>
  );
}
