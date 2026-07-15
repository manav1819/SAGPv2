'use client';

import { notFound } from 'next/navigation';
import { use, useState } from 'react';
import { GAMES } from '@/config/games.config';
import { IframeGame } from '@/components/games/IframeGame';
import { useAuth } from '@/lib/hooks/useAuth';
import { ModeSelectDialog, type GameDifficultyMode } from '@/components/game/ModeSelectDialog';

/**
 * Games that offer a Basic / Challenge difficulty picker before boot.
 * CyberForge is the first game wired up for this — see PROJECT notes on
 * "gamification difficulty modes". Add more game ids here as they're
 * updated to read `?mode=` from their own iframe URL.
 */
const DIFFICULTY_MODE_GAMES = new Set(['cyberforge']);

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /play/[id]
 *
 * Generic game player page. Looks up the game by id in GAMES config and
 * renders it inside the appropriate host component (IframeGame for now).
 * Redirects to 404 if the id is unknown or the game is inactive.
 */
export default function PlayPage({ params }: PlayPageProps) {
  const { id } = use(params);
  const { profile } = useAuth();

  const game = GAMES.find((g) => g.id === id && g.active);

  if (!game) {
    notFound();
  }

  const playerName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Agent';

  // sessionRef must be stable for the lifetime of this page mount.
  // Using useState with a lazy initialiser prevents regeneration on re-renders
  // (which would change the URL passed to the iframe and break result matching).
  const [sessionRef] = useState<string>(() =>
    typeof crypto !== 'undefined'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const needsModePicker = DIFFICULTY_MODE_GAMES.has(game.id);
  const [mode, setMode] = useState<GameDifficultyMode | null>(null);

  if (game.type === 'iframe' && game.iframeUrl) {
    if (needsModePicker && !mode) {
      return (
        <ModeSelectDialog open gameTitle={game.title} onSelect={setMode} />
      );
    }

    return (
      <IframeGame
        game={game}
        playerName={playerName}
        sessionRef={sessionRef}
        mode={mode ?? undefined}
      />
    );
  }

  // Fallback for unsupported types in this route
  return (
    <div className="sagp-content-area flex items-center justify-center min-h-[60vh]">
      <p className="sagp-text-muted">
        This game type is not yet supported in the player.
      </p>
    </div>
  );
}
