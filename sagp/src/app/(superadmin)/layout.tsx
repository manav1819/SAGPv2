import React from 'react';
import { SuperadminSidebar } from '@/components/superadmin/superadmin-sidebar';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-900">
      <SuperadminSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
