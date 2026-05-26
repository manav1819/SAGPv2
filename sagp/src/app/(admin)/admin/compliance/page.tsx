import { Shield, CheckCircle2 } from 'lucide-react';
import type { ComplianceFramework } from '@/types/database';

const FRAMEWORKS: ComplianceFramework[] = ['NIST', 'ISO27001', 'SOC2', 'PCI_DSS', 'HIPAA'];

export default function AdminCompliancePage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <Shield className="h-7 w-7 sagp-text-primary" />
        Compliance
      </h1>

      {/* Framework overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FRAMEWORKS.map((fw) => (
          <div key={fw} className="sagp-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="sagp-badge sagp-badge-purple">{fw}</span>
              <CheckCircle2 className="h-4 w-4 sagp-text-muted opacity-30" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-700">
              <div className="h-1.5 rounded-full bg-cyan-500/40 w-0" />
            </div>
            <p className="text-xs sagp-text-muted">0% coverage</p>
          </div>
        ))}
      </div>

      <div className="sagp-card p-5 text-sm sagp-text-muted">
        Compliance coverage is computed automatically as employees complete modules tagged with each framework.
      </div>
    </div>
  );
}
