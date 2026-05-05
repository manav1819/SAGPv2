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
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Modules',
    href: '/modules',
    icon: BookOpen,
  },
  {
    label: 'Games',
    href: '/games',
    icon: Gamepad2,
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
  },
  {
    label: 'Badges',
    href: '/badges',
    icon: Award,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
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
    <aside className="w-64 border-r border-slate-700 bg-slate-800 p-6">
      {/* Logo */}
      <Link href="/dashboard" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600">
          <span className="text-lg font-bold text-white">🛡️</span>
        </div>
        <span className="text-xl font-bold text-white">SAGP</span>
      </Link>

      {/* Streak Counter */}
      <div className="mb-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Current Streak</p>
            <p className="text-2xl font-bold text-white">{streak}</p>
            <p className="text-xs text-slate-400">days</p>
          </div>
          <Flame className="h-10 w-10 text-orange-500" />
        </div>
      </div>

      {/* Active Battle */}
      {activeBattle && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-teal-900 p-3">
          <Swords className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-medium text-teal-200">Battle Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="mb-8 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mb-6 border-t border-slate-700"></div>

      {/* User Info */}
      <div className="mb-4 rounded-lg bg-slate-700 p-3">
        <p className="text-xs text-slate-400">Logged in as</p>
        <p className="font-medium text-white">{userName}</p>
      </div>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        className="w-full"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </aside>
  );
}
