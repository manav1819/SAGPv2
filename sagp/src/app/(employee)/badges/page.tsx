'use client';

import { Award, Lock } from 'lucide-react';

export default function BadgesPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      {/* Empty state */}
      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Lock className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No badges earned yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Complete games, maintain streaks, and ace phishing simulations to unlock badges.
        </p>
        <a href="/games" className="sagp-btn sagp-btn-primary mt-2">
          Start Training
        </a>
      </div>
    </div>
  );
}
