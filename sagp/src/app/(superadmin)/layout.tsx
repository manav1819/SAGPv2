import React from 'react';
import { SuperadminSidebar } from '@/components/superadmin/superadmin-sidebar';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sagp-app flex min-h-screen flex-col">
      <div className="sagp-radial-center" />
      <SuperadminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
