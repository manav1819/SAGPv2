'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { GameConfig } from '@/config/games.config';

interface ScormGameProps {
  game: GameConfig;
  playerName: string;
}

/**
 * SCORM 1.2 / 2004 game host.
 *
 * Serves the SCORM package from public/games/<id>/<scormPath>.
 * The package is expected to be self-contained and communicate
 * completion back via the SCORM API (window.API / window.API_1484_11).
 *
 * If you need to intercept SCORM completion events (e.g. to award
 * points), inject a SCORM API shim before the package loads.
 * See ADDING_GAMES.md → SCORM section for details.
 */
export function ScormGame({ game, playerName }: ScormGameProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the SCORM entry point URL
  const scormEntry = game.scormPath ?? 'index.html';
  const scormUrl = `/games/${game.id}/${scormEntry}?playerName=${encodeURIComponent(playerName)}`;

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
        <button
          onClick={() => router.push('/games')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Games
        </button>
        <span className="text-sm font-medium text-slate-300">
          {game.icon ? `${game.icon} ` : ''}{game.title}
        </span>
        <span className="text-xs text-slate-500">Playing as {playerName}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          src={scormUrl}
          className="h-full w-full border-0"
          title={game.title}
          // SCORM packages often use allow-same-origin + allow-scripts
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
