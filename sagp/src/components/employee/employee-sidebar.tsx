'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Award,
  User,
  LogOut,
  Flame,
  Swords,
  Gamepad2,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Modules', href: '/modules', icon: BookOpen },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Badges', href: '/badges', icon: Award },
  { label: 'Profile', href: '/profile', icon: User },
];

interface EmployeeSidebarProps {
  streak?: number;
  activeBattle?: boolean;
  userName?: string;
}

export function EmployeeSidebar({
  streak = 0,
  activeBattle = false,
  userName = 'User',
}: EmployeeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="sagp-neon-card sticky top-0 z-20 h-screen w-64 shrink-0 overflow-y-auto border-y-0 border-l-0 p-6">
      <Link href="/dashboard" className="sagp-brand mb-8">
        <div className="sagp-brand-mark">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="sagp-brand-text sagp-neon-text">SAGP</span>
      </Link>

      <div className="sagp-purple-row mb-8 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="sagp-stat-label">Current Streak</p>
            <p className="sagp-stat-value">{streak}</p>
            <p className="sagp-stat-hint">days</p>
          </div>
          <Flame className="h-10 w-10 sagp-text-green" />
        </div>
      </div>

      {activeBattle && (
        <div className="sagp-cyan-row mb-6 flex items-center gap-2">
          <Swords className="h-4 w-4 sagp-text-cyan" />
          <span className="text-sm font-medium sagp-text-cyan">Battle Active</span>
        </div>
      )}

      <nav className="mb-8 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sagp-nav-link w-full ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-6 border-t border-cyan-300/15" />

      <div className="sagp-glass-row mb-4">
        <p className="sagp-stat-label">Logged in as</p>
        <p className="truncate font-medium text-white">{userName}</p>
      </div>

      <Button onClick={handleLogout} variant="ghost" className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </aside>
  );
}
