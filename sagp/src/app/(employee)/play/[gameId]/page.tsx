import { notFound } from 'next/navigation';
import { GAMES } from '@/config/games.config';
import { IframeGame } from '@/components/games/IframeGame';
import { PhaserGame } from '@/components/games/PhaserGame';
import { ScormGame } from '@/components/games/ScormGame';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ gameId: string }>;
}

/**
 * Generic game launcher — /play/[gameId]
 *
 * Looks up the game by id from the GAMES registry in games.config.ts.
 * Returns a 404 for unknown or inactive games.
 * Renders <IframeGame>, <PhaserGame>, or <ScormGame> based on the
 * game's `type` field.
 *
 * Note: the phishing simulator has its own dedicated page at
 * /game/phishing (set via `href` in games.config.ts) and is not
 * served through this route.  New games added to games.config.ts
 * without a custom `href` will resolve here automatically.
 */
export default async function PlayGamePage({ params }: Props) {
  const { gameId } = await params;

  // Look up the game in the in-memory registry
  const game = GAMES.find((g) => g.id === gameId);

  // 404 for unknown or inactive games
  if (!game || !game.active) {
    notFound();
  }

  // ── Resolve player name server-side ────────────────────────────────────────
  let playerName = 'Agent';

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        const fullName = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        playerName = fullName || profile.email || 'Agent';
      }
    }
  } catch {
    // Auth errors are handled by the middleware; fall back to 'Agent'
  }

  // Generate a session reference for this play (used by analytics)
  const sessionRef = crypto.randomUUID();

  // ── Render the appropriate game component ──────────────────────────────────

  if (game.type === 'iframe') {
    return <IframeGame game={game} playerName={playerName} sessionRef={sessionRef} />;
  }

  if (game.type === 'phaser') {
    return <PhaserGame game={game} playerName={playerName} />;
  }

  if (game.type === 'scorm') {
    return <ScormGame game={game} playerName={playerName} />;
  }

  // Should be unreachable given the type constraint, but guard anyway
  notFound();
}
