'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gamepad2, AlertTriangle } from 'lucide-react';

/**
 * /game
 *
 * Generic game launcher. Expects ?moduleId=<uuid> in the query string.
 * The actual game rendering lives in the IframeGame / PhaserGame / ScormGame
 * components — wire them up once the module data fetch is in place.
 */
function GameLauncher() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId');

  if (!moduleId) {
    return (
      <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-400" />
        <p className="sagp-heading-3 sagp-text-muted">No module specified</p>
        <p className="sagp-text-muted text-sm">
          Please launch a game from the{' '}
          <a href="/modules" className="sagp-link">Modules</a> page.
        </p>
      </div>
    );
  }

  return (
    <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Gamepad2 className="h-12 w-12 sagp-text-primary animate-pulse" />
      <p className="sagp-heading-3 sagp-neon-text">Loading module…</p>
      <p className="sagp-text-muted text-sm font-mono text-xs">{moduleId}</p>
      {/* TODO: Fetch module by id, then render <IframeGame />, <PhaserGame />, or <ScormGame /> */}
    </div>
  );
}

export default function GamePage() {
  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <Gamepad2 className="h-7 w-7 sagp-text-primary" />
        Game Session
      </h1>
      <Suspense
        fallback={
          <div className="sagp-card flex items-center justify-center py-20">
            <Gamepad2 className="h-10 w-10 sagp-text-primary animate-pulse" />
          </div>
        }
      >
        <GameLauncher />
      </Suspense>
    </div>
  );
}
