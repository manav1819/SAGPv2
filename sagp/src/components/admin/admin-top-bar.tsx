'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminTopBarProps {
  breadcrumbs?: Breadcrumb[];
  title?: string;
  actions?: React.ReactNode;
}

export function AdminTopBar({ breadcrumbs, title, actions }: AdminTopBarProps) {
  return (
    <div className="h-16 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-8">
      <div className="flex items-center gap-2">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-500" />}
                {crumb.href ? (
                  <a href={crumb.href} className="text-slate-400 hover:text-slate-200 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-100 font-medium' : 'text-slate-400'}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {title && <h1 className="text-lg font-semibold text-slate-100">{title}</h1>}
      </div>

      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </div>
  );
}
