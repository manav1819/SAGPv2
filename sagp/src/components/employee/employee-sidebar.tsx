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
    <header className="sagp-topbar">
      <div className="sagp-topbar-inner">
        <Link href="/dashboard" className="sagp-brand shrink-0">
          <div className="sagp-brand-mark">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="sagp-brand-text sagp-neon-text">SAGP</span>
        </Link>

        <nav className="sagp-horizontal-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sagp-nav-link ${isActive ? 'is-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sagp-horizontal-actions">
          <div className="sagp-badge sagp-badge-purple">
            <Flame className="h-3.5 w-3.5" />
            {streak} day streak
          </div>
          {activeBattle && (
            <div className="sagp-badge sagp-badge-green">
              <Swords className="h-3.5 w-3.5" />
              Battle active
            </div>
          )}
          <div className="hidden max-w-52 truncate text-sm sagp-text-muted lg:block">
            {userName}
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
