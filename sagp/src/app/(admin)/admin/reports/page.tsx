import { FileText, Download } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <FileText className="h-7 w-7 sagp-text-primary" />
          Reports
        </h1>
        <button className="sagp-btn sagp-btn-secondary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <FileText className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No reports generated yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Compliance and training reports will appear here after your employees complete games.
        </p>
      </div>
    </div>
  );
}
