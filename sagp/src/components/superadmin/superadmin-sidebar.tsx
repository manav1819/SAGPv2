'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building, Users, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/superadmin/dashboard',     icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Organisations', href: '/superadmin/organizations', icon: <Building className="w-5 h-5" /> },
  { label: 'Admins',        href: '/superadmin/admins',        icon: <Users className="w-5 h-5" /> },
];

export function SuperadminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

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
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">SAGP</h1>
            <p className="text-xs text-purple-400">Superadmin</p>
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
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              )}
            >
              <span className={cn('flex-shrink-0', isActive ? 'text-purple-400' : 'text-slate-400')}>
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
