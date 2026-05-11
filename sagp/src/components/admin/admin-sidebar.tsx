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
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Modules', href: '/admin/modules', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Reports', href: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
  { label: 'Phishing', href: '/admin/phishing', icon: <Mail className="h-4 w-4" /> },
  { label: 'Compliance', href: '/admin/compliance', icon: <Shield className="h-4 w-4" /> },
  { label: 'Battles', href: '/admin/battles', icon: <Swords className="h-4 w-4" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Audit Log', href: '/admin/audit', icon: <Scroll className="h-4 w-4" /> },
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
    <header className="sagp-topbar">
      <div className="sagp-topbar-inner">
        <Link href="/admin/dashboard" className="sagp-brand shrink-0">
          <div className="sagp-brand-mark">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="sagp-brand-text sagp-neon-text">SAGP</span>
          <span className="sagp-badge sagp-badge-purple">Admin</span>
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
