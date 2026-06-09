'use client';

import { EmployeeSidebar } from '@/components/employee/employee-sidebar';
import { getEmployeeStreakDays } from '@/lib/actions/dashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState, useTransition } from 'react';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, membership } = useAuth();
  const [streak, setStreak] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!user?.id || !membership?.org_id) {
      setStreak(0);
      return;
    }

    startTransition(async () => {
      const days = await getEmployeeStreakDays(user.id, membership.org_id);
      setStreak(days);
    });
  }, [user?.id, membership?.org_id]);

  return (
    <div className="sagp-app flex min-h-screen flex-col">
      <div className="sagp-radial-center" />
      <EmployeeSidebar
        userName={user?.email || 'User'}
        streak={streak}
        activeBattle={false}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
