import { Mail, Plus } from 'lucide-react';

export default function AdminPhishingPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Mail className="h-7 w-7 sagp-text-primary" />
          Phishing Simulations
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign status tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-1">
        {['All', 'Active', 'Scheduled', 'Completed'].map((tab, i) => (
          <button key={tab} className={`sagp-nav-link ${i === 0 ? 'is-active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Mail className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No campaigns yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Create a phishing simulation campaign to test your employees' awareness.
        </p>
      </div>
    </div>
  );
}
