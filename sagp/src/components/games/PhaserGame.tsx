'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { GameConfig } from '@/config/games.config';

interface PhaserGameProps {
  game: GameConfig;
  playerName: string;
}

/**
 * Native Phaser 3 game host.
 *
 * Dynamically imports the Phaser scene class from src/games/<id>/index.ts,
 * boots a Phaser.Game instance inside a container div, and tears it down
 * on unmount.
 *
 * Convention for native Phaser games:
 *   src/games/<id>/index.ts  — exports a default Phaser.Scene subclass
 *   public/games/<id>/assets/ — sprite sheets, audio, tilemaps
 *
 * The scene can read the player name and game id from the Phaser registry:
 *   this.registry.get('playerName')
 *   this.registry.get('gameId')
 */
export function PhaserGame({ game, playerName }: PhaserGameProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phaserRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !game.phaserScene) return;

    let mounted = true;

    (async () => {
      // Phaser is loaded as a static asset in native scenes.
      // If your project adds phaser to package.json, switch to:
      //   const Phaser = (await import('phaser')).default;
      // For now we pull it from the window (loaded by the scene's html).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Phaser = (window as any).Phaser;

      if (!Phaser) {
        console.error('[PhaserGame] window.Phaser not found. Add a <Script src="/phaser.js"> to the layout or install the phaser npm package.');
        return;
      }

      if (!mounted || !containerRef.current) return;

      // Dynamically import the scene class from src/games/<id>/index
      const { default: SceneClass } = await import(
        /* webpackIgnore: true */
        `@/games/${game.id}/index`
      );

      const phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        scene: [SceneClass],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        backgroundColor: '#1e293b',
        callbacks: {
          preBoot: (g: { registry: { set: (k: string, v: unknown) => void } }) => {
            g.registry.set('playerName', playerName);
            g.registry.set('gameId', game.id);
          },
        },
      });

      phaserRef.current = phaserGame;
    })();

    return () => {
      mounted = false;
      if (phaserRef.current) {
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
    };
  }, [game.id, game.phaserScene, playerName]);

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

      {/* Phaser mounts into this div */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
