'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import {
  useEmployeeDashboard,
  PERSONA_LABELS,
  RISK_TIER_COLORS,
} from '@/lib/hooks/useLiveData';
import {
  LayoutDashboard,
  Shield,
  BookOpen,
  Trophy,
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
  Swords,
  User,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, membership, isLoading: authLoading } = useAuth();
  const { data, isLoading, reload } = useEmployeeDashboard(
    profile?.id,
    membership?.org_id ?? undefined
  );

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Agent';

  if (authLoading) {
    return (
      <div className="sagp-content-area flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-10 w-10 sagp-text-primary animate-pulse" />
          <p className="sagp-text-muted text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const riskTierColor = data?.riskTier ? RISK_TIER_COLORS[data.riskTier] : 'sagp-text-primary';

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="sagp-heading-1 flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 sagp-text-primary" />
            Dashboard
          </h1>
          <p className="sagp-text-muted mt-1">
            Welcome back, <span className="sagp-neon-text">{displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            className="p-2 rounded sagp-card hover:border-cyan-500/40 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 sagp-text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="sagp-badge sagp-badge-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </div>
        </div>
      </div>

      {/* Stat cards — live from Supabase */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Risk Score"
          value={data?.riskScore != null ? String(data.riskScore) : '—'}
          hint={
            data?.riskTier
              ? `Tier: ${data.riskTier.toUpperCase()}`
              : isLoading
              ? 'Computing…'
              : 'Computed after first module'
          }
          accent="purple"
          valueClass={riskTierColor}
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Day Streak"
          value={data?.streakDays != null ? String(data.streakDays) : '—'}
          hint={
            data?.streakDays
              ? `${data.streakDays} day${data.streakDays !== 1 ? 's' : ''} in a row`
              : 'Complete a module to start'
          }
          accent="orange"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Total Points"
          value={data?.totalPoints != null ? data.totalPoints.toLocaleString() : '0'}
          hint="Earn points by training"
          accent="yellow"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Modules Done"
          value={data?.modulesCompleted != null ? String(data.modulesCompleted) : '0'}
          hint="Training modules completed"
          accent="cyan"
        />
      </div>

      {/* Persona + recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Persona card */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <User className="h-4 w-4 sagp-text-primary" />
            Security Persona
          </h2>
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Shield className="h-6 w-6 sagp-text-muted animate-pulse" />
              <p className="sagp-text-muted text-sm">Analysing behaviour…</p>
            </div>
          ) : data?.persona ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="sagp-neon-text font-semibold text-lg">
                  {PERSONA_LABELS[data.persona] ?? data.persona}
                </span>
                {data.personaConfidence != null && (
                  <span className="text-xs sagp-text-muted">
                    {Math.round(data.personaConfidence * 100)}% confidence
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700">
                <div
                  className="h-1.5 rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.round((data.personaConfidence ?? 0) * 100)}%` }}
                />
              </div>
              <p className="text-xs sagp-text-muted">
                {getPersonaDescription(data.persona)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Shield className="h-6 w-6 sagp-text-muted opacity-40" />
              <p className="sagp-text-muted text-sm">No persona yet.</p>
              <a href="/games" className="sagp-link text-xs">
                Complete a simulation →
              </a>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sagp-text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickAction href="/modules" icon={<BookOpen className="h-4 w-4" />} title="Browse Modules" desc="Pick up a training module" />
            <QuickAction href="/games"   icon={<Swords className="h-4 w-4" />}   title="Play a Game"    desc="Gamified security challenges" />
            <QuickAction href="/leaderboard" icon={<Trophy className="h-4 w-4" />} title="Leaderboard" desc="See how you rank" />
          </div>
        </div>

        {/* Recent activity — live */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <Clock className="h-4 w-4 sagp-text-primary" />
            Recent Activity
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data?.recentSessions && data.recentSessions.length > 0 ? (
            <div className="space-y-2">
              {data.recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate">{s.moduleTitle}</p>
                    <p className="text-xs sagp-text-muted">
                      {s.endedAt ? new Date(s.endedAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ml-2 shrink-0 ${s.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {s.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <BookOpen className="h-8 w-8 sagp-text-muted opacity-40" />
              <p className="sagp-text-muted text-sm">No activity yet.</p>
              <a href="/modules" className="sagp-link text-xs">Start your first module →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({
  icon, label, value, hint, accent, valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: 'purple' | 'orange' | 'yellow' | 'cyan';
  valueClass?: string;
}) {
  const accentMap: Record<string, string> = {
    purple: 'sagp-badge-purple',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    cyan: 'text-cyan-400',
  };
  return (
    <div className="sagp-card p-4 space-y-2">
      <div className={`flex items-center gap-2 ${accentMap[accent] ?? 'sagp-text-primary'}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider sagp-text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClass ?? 'sagp-neon-text'}`}>{value}</p>
      <p className="text-xs sagp-text-muted">{hint}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <a href={href} className="sagp-card p-3 flex items-start gap-3 hover:border-cyan-500/40 transition-colors group">
      <div className="mt-0.5 sagp-text-primary group-hover:sagp-neon-text">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs sagp-text-muted">{desc}</p>
      </div>
    </a>
  );
}

function getPersonaDescription(persona: string): string {
  const map: Record<string, string> = {
    fast_clicker:     'Tends to act quickly without verifying. Auto-enrolled in urgency-awareness modules.',
    sentinel:         'Fast and vigilant — reports threats proactively. Receiving advanced scenarios.',
    hesitant_worker:  'Deliberate but passive. Confidence-building modules have been assigned.',
    diligent_analyst: 'Careful and vigilant. Receiving red-team challenge content.',
    repeat_offender:  'Persistent failure pattern detected. Mandatory live training assigned.',
    provisional:      'More data needed to classify behaviour. Keep completing modules.',
  };
  return map[persona] ?? 'Persona classification in progress.';
}
