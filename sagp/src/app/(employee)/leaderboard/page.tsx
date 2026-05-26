'use client';

import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <Trophy className="h-7 w-7 sagp-text-primary" />
        Leaderboard
      </h1>

      {/* Tab row — scopes */}
      <div className="flex gap-2 border-b border-slate-700 pb-1">
        {['Global', 'Organisation', 'Department', 'Weekly'].map((scope, i) => (
          <button
            key={scope}
            className={`sagp-nav-link ${i === 0 ? 'is-active' : ''}`}
          >
            {scope}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Medal className="h-12 w-12 sagp-text-muted opacity-30" />
        <p className="sagp-heading-3 sagp-text-muted">No rankings yet</p>
        <p className="sagp-text-muted text-sm max-w-xs">
          Complete training modules to earn points and appear on the leaderboard.
        </p>
      </div>
    </div>
  );
}
