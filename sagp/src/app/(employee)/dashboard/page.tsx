'use client';

import { useAuth } from '@/lib/hooks/useAuth';
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
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, isLoading } = useAuth();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Agent';

  if (isLoading) {
    return (
      <div className="sagp-content-area flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-10 w-10 sagp-text-primary animate-pulse" />
          <p className="sagp-text-muted text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

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
        <div className="sagp-badge sagp-badge-green">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Active
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Risk Score"
          value="—"
          hint="Computed after first module"
          accent="purple"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Day Streak"
          value="—"
          hint="Complete a module to start"
          accent="orange"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Total Points"
          value="0"
          hint="Earn points by training"
          accent="yellow"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Modules Done"
          value="0"
          hint="Start your first module"
          accent="cyan"
        />
      </div>

      {/* Action panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="sagp-card p-5 space-y-4 lg:col-span-2">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sagp-text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction
              href="/modules"
              icon={<BookOpen className="h-4 w-4" />}
              title="Browse Modules"
              desc="Pick up a training module"
            />
            <QuickAction
              href="/games"
              icon={<Swords className="h-4 w-4" />}
              title="Play a Game"
              desc="Gamified security challenges"
            />
            <QuickAction
              href="/leaderboard"
              icon={<Trophy className="h-4 w-4" />}
              title="Leaderboard"
              desc="See how you rank"
            />
            <QuickAction
              href="/badges"
              icon={<Shield className="h-4 w-4" />}
              title="My Badges"
              desc="View earned achievements"
            />
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div className="sagp-card p-5 space-y-4">
          <h2 className="sagp-heading-3 flex items-center gap-2">
            <Clock className="h-4 w-4 sagp-text-primary" />
            Recent Activity
          </h2>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <BookOpen className="h-8 w-8 sagp-text-muted opacity-40" />
            <p className="sagp-text-muted text-sm">No activity yet.</p>
            <a href="/modules" className="sagp-link text-xs">
              Start your first module →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: 'purple' | 'orange' | 'yellow' | 'cyan';
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
      <p className="text-2xl font-bold sagp-neon-text">{value}</p>
      <p className="text-xs sagp-text-muted">{hint}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      className="sagp-card p-4 flex items-start gap-3 hover:border-cyan-500/40 transition-colors group"
    >
      <div className="mt-0.5 sagp-text-primary group-hover:sagp-neon-text">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs sagp-text-muted">{desc}</p>
      </div>
    </a>
  );
}
