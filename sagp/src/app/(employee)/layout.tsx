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
    <div className="sagp-app flex min-h-screen">
      <div className="sagp-radial-center" />
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
