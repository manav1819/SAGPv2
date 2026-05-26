'use client';

import { BookOpen, Search, Filter } from 'lucide-react';

export default function ModulesPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <BookOpen className="h-7 w-7 sagp-text-primary" />
          Training Modules
        </h1>
      </div>

      {/* Search / filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
          <input
            type="search"
            placeholder="Search modules…"
            className="sagp-input pl-9 w-full"
          />
        </div>
        <button className="sagp-btn sagp-btn-secondary flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Empty state — replace with real data fetch */}
      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BookOpen className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No modules yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Modules assigned to your organisation will appear here. Check back soon!
        </p>
      </div>
    </div>
  );
}
