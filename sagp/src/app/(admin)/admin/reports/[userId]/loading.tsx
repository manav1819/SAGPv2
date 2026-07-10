import { Shield } from 'lucide-react';

export default function EmployeeReportLoading() {
  return (
    <div className="sagp-content-area flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Shield className="h-10 w-10 sagp-text-primary animate-pulse" />
        <p className="sagp-text-muted text-sm">Loading employee report…</p>
      </div>
    </div>
  );
}
