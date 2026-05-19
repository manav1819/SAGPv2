'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { GameConfig } from '@/config/games.config';

interface IframeGameProps {
  game: GameConfig;
  playerName: string;
  sessionRef: string;
}

/**
 * Generic iframe game host.
 *
 * Embeds a self-contained HTML game (living in public/games/<id>/) inside
 * a full-screen iframe and listens for a GAME_COMPLETE postMessage.
 * playerName and sessionRef are forwarded as query params so the game
 * can display the player's name and tag analytics events.
 *
 * Result submission goes to /api/game/result.
 * Games that need bespoke result logic (e.g. the phishing simulator)
 * should keep their own dedicated page and set `href` in games.config.ts.
 */
export function IframeGame({ game, playerName, sessionRef }: IframeGameProps) {
  const router = useRouter();

  const gameUrl = game.iframeUrl
    ? `${game.iframeUrl}?playerName=${encodeURIComponent(playerName)}&sessionRef=${encodeURIComponent(sessionRef)}`
    : '';

  // Listen for GAME_COMPLETE messages from the iframe
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Only accept same-origin messages
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GAME_COMPLETE') return;

      try {
        await fetch('/api/game/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            sessionRef,
            result: event.data,
          }),
        });
      } catch (err) {
        console.error('[IframeGame] Failed to post result:', err);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [game.id, sessionRef]);

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      {/* Slim header bar — matches phishing game page style */}
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

      {/* Game frame */}
      <div className="flex-1 overflow-hidden">
        {gameUrl ? (
          <iframe
            src={gameUrl}
            className="h-full w-full border-0"
            title={game.title}
            allow="autoplay"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Game URL not configured.
          </div>
        )}
      </div>
    </div>
  );
}
