import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-900">
      <AdminSidebar />
      <main className="ml-64 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
