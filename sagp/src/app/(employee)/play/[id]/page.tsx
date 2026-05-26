'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { GAMES } from '@/config/games.config';
import { IframeGame } from '@/components/games/IframeGame';
import { useAuth } from '@/lib/hooks/useAuth';

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

  // sessionRef: simple unique id per play session
  const sessionRef =
    typeof crypto !== 'undefined'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (game.type === 'iframe' && game.iframeUrl) {
    return (
      <IframeGame game={game} playerName={playerName} sessionRef={sessionRef} />
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
