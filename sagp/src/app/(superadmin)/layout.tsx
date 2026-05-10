import React from 'react';
import { SuperadminSidebar } from '@/components/superadmin/superadmin-sidebar';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sagp-app flex h-screen">
      <div className="sagp-radial-center" />
      <SuperadminSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
