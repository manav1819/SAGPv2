'use client';

import { EmployeeSidebar } from '@/components/employee/employee-sidebar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-900">
      <EmployeeSidebar
        userName={user?.email || 'User'}
        streak={7}
        activeBattle={false}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
