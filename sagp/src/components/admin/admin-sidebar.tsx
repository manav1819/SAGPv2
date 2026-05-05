'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Mail,
  Shield,
  Swords,
  Settings,
  Scroll,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Modules', href: '/admin/modules', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Reports', href: '/admin/reports', icon: <FileText className="w-5 h-5" /> },
  { label: 'Phishing', href: '/admin/phishing', icon: <Mail className="w-5 h-5" /> },
  { label: 'Compliance', href: '/admin/compliance', icon: <Shield className="w-5 h-5" /> },
  { label: 'Battles', href: '/admin/battles', icon: <Swords className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  { label: 'Audit Log', href: '/admin/audit', icon: <Scroll className="w-5 h-5" /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">SAGP</h1>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              )}
            >
              <span className={cn('flex-shrink-0', isActive ? 'text-teal-400' : 'text-slate-400')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
