'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building, Users, LogOut, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Organisations', href: '/superadmin/organizations', icon: <Building className="h-4 w-4" /> },
  { label: 'Admins', href: '/superadmin/admins', icon: <Users className="h-4 w-4" /> },
];

export function SuperadminSidebar() {
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
    <header className="sagp-topbar">
      <div className="sagp-topbar-inner">
        <Link href="/superadmin/dashboard" className="sagp-brand shrink-0">
          <div className="sagp-brand-mark">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="sagp-brand-text sagp-neon-text">SAGP</span>
          <span className="sagp-badge sagp-badge-purple">Superadmin</span>
        </Link>

        <nav className="sagp-horizontal-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sagp-nav-link', isActive && 'is-active')}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sagp-horizontal-actions">
          <button onClick={handleSignOut} className="sagp-btn sagp-btn-ghost sagp-btn-sm">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
