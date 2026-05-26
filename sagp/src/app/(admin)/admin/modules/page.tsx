import { BookOpen, Plus } from 'lucide-react';

export default function AdminModulesPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <BookOpen className="h-7 w-7 sagp-text-primary" />
          Modules
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Module
        </button>
      </div>

      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BookOpen className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No modules yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Create or import security awareness modules to assign to your employees.
        </p>
      </div>
    </div>
  );
}
