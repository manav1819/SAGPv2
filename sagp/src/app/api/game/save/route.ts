/**
 * /api/game/save
 *
 * Backs the generic save/resume system (src/lib/game-save/SaveManager.ts).
 * One row per (user, game) in `game_saves` — completely separate from
 * `game_sessions` (completed-attempt analytics, leaderboard, SCORM, risk
 * engine) so autosave traffic never touches those pipelines.
 *
 * RLS on `game_saves` already restricts rows to `auth.uid() = user_id`,
 * so these routes use the cookie-bound server client (not the service
 * role) — the database enforces ownership, the route just needs a user.
 *
 *   GET    ?gameId=xxx        → { save: GameSave | null }
 *   POST   { gameId, state, schemaVersion, sessionRef?, level?, score?, elapsedSeconds? }
 *                              → upsert, returns { save }
 *   DELETE ?gameId=xxx        → clears the save ("Start New Game")
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GAMES } from '@/config/games.config';
import type { GameSave } from '@/types/database';

async function getAuthedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user, error };
}

async function resolveOrgId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.org_id as string | undefined) ?? null;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { supabase, user, error: userError } = await getAuthedUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('game_saves')
    .select('*')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ save: (data as GameSave | null) ?? null });
}

// ── POST (upsert) ─────────────────────────────────────────────────────────────

interface SaveBody {
  gameId?: string;
  state?: Record<string, unknown>;
  schemaVersion?: number;
  sessionRef?: string | null;
  level?: string | null;
  score?: number | null;
  elapsedSeconds?: number;
}

export async function POST(req: NextRequest) {
  const { supabase, user, error: userError } = await getAuthedUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { gameId, state } = body;
  if (!gameId || typeof state !== 'object' || state === null) {
    return NextResponse.json(
      { error: 'Missing required fields: gameId, state' },
      { status: 400 }
    );
  }

  // Soft validation against the config (not a DB foreign key — see the
  // game_saves migration for why). Rejects typos/garbage early without
  // depending on the `games` table being in sync.
  if (!GAMES.some((g) => g.id === gameId)) {
    return NextResponse.json({ error: `Unknown game: ${gameId}` }, { status: 404 });
  }

  const orgId = await resolveOrgId(supabase, user.id);

  const { data, error } = await supabase
    .from('game_saves')
    .upsert(
      {
        user_id: user.id,
        org_id: orgId,
        game_id: gameId,
        state,
        schema_version: body.schemaVersion ?? 1,
        session_ref: body.sessionRef ?? null,
        level: body.level ?? null,
        score: body.score ?? null,
        elapsed_seconds: body.elapsedSeconds ?? 0,
      },
      { onConflict: 'user_id,game_id' }
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ save: data as GameSave });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { supabase, user, error: userError } = await getAuthedUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  }

  const { error } = await supabase
    .from('game_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('game_id', gameId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
