import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { GAMES } from '@/config/games.config';

// ── Type helpers ───────────────────────────────────────────────────────────────

type ModuleCategory =
  | 'phishing'
  | 'passwords'
  | 'social_engineering'
  | 'malware'
  | 'insider_threat'
  | 'device_security'
  | 'data_handling';

type GameType = 'quiz' | 'phishing_sim' | 'scenario' | 'drag_drop';
type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'paused';
type TimeBucket = 'less' | 'medium' | 'more';

// Map game IDs → module metadata
const GAME_MODULE_META: Record<
  string,
  { category: ModuleCategory; gameType: GameType }
> = {
  phishing:   { category: 'phishing',            gameType: 'phishing_sim' },
  vishing:    { category: 'social_engineering',  gameType: 'scenario'     },
  '3d-office':{ category: 'device_security',     gameType: 'scenario'     },
};

/** Classify time taken into the DB enum */
function classifyTime(seconds: number): TimeBucket {
  if (seconds < 120) return 'less';
  if (seconds < 360) return 'medium';
  return 'more';
}

/** Normalise the heterogeneous GAME_COMPLETE payloads into a common shape */
function normaliseResult(result: Record<string, unknown>) {
  // Phishing / vishing games send: score, maxScore, accuracy, passed
  // 3d-office game sends: securityScore, riskScore, completed
  const score =
    typeof result.score === 'number'
      ? result.score
      : typeof result.securityScore === 'number'
      ? result.securityScore
      : 0;

  const maxScore =
    typeof result.maxScore === 'number'
      ? result.maxScore
      : typeof result.securityScore === 'number'
      ? 200   // 3d-office theoretical max
      : 100;

  const passed =
    typeof result.passed === 'boolean'
      ? result.passed
      : score / maxScore >= 0.5;

  return { score, maxScore, passed };
}

// ── POST /api/game/result ──────────────────────────────────────────────────────

/**
 * Receives a GAME_COMPLETE postMessage payload forwarded by IframeGame
 * and persists it as a completed game_session row.
 *
 * Body: { gameId: string; sessionRef: string; result: Record<string, unknown> }
 *
 * Because game_sessions.module_id is NOT NULL, we upsert a lightweight
 * platform-level module per (org_id, game_id) so every game has a stable
 * module anchor without requiring manual admin setup.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────
    let body: { gameId?: string; sessionRef?: string; result?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { gameId, sessionRef, result } = body;

    if (!gameId || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, result' },
        { status: 400 }
      );
    }

    // ── 2. Auth — anon client to verify session cookie ─────────────────────
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 3. Resolve org_id ──────────────────────────────────────────────────
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User has no organisation membership' },
        { status: 422 }
      );
    }

    const { org_id } = membership;

    // ── 4. Resolve game config ─────────────────────────────────────────────
    const gameConfig = GAMES.find((g) => g.id === gameId);
    if (!gameConfig) {
      return NextResponse.json(
        { error: `Unknown game: ${gameId}` },
        { status: 404 }
      );
    }

    const meta = GAME_MODULE_META[gameId] ?? {
      category: 'device_security' as ModuleCategory,
      gameType: 'scenario' as GameType,
    };

    // ── 5. Find-or-create the stub module for this game+org ────────────────
    //
    // We use service role here so the upsert bypasses RLS (only admins can
    // INSERT modules under normal policy, but we want this to be automatic).
    const service = await createServiceRoleClient();

    // Stable synthetic title so we can find it again
    const moduleTitle = `[Game] ${gameConfig.title}`;

    let moduleId: string;

    const { data: existingModule } = await service
      .from('modules')
      .select('id')
      .eq('org_id', org_id)
      .eq('title', moduleTitle)
      .maybeSingle();

    if (existingModule) {
      moduleId = existingModule.id as string;
    } else {
      const { data: newModule, error: moduleError } = await service
        .from('modules')
        .insert({
          org_id,
          title:          moduleTitle,
          description:    gameConfig.description,
          category:       meta.category,
          game_type:      meta.gameType,
          points_value:   gameConfig.maxScore,
          estimated_mins: gameConfig.estimatedMinutes,
          is_active:      true,
        })
        .select('id')
        .single();

      if (moduleError || !newModule) {
        console.error('[/api/game/result] module upsert error:', moduleError?.message);
        return NextResponse.json(
          { error: 'Failed to resolve module for game' },
          { status: 500 }
        );
      }

      moduleId = newModule.id as string;
    }

    // ── 6. Normalise result payload ────────────────────────────────────────
    const { score, maxScore, passed } = normaliseResult(result);

    // Derive attempt number for this user+module
    const { count } = await service
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('module_id', moduleId);

    const attemptNumber = (count ?? 0) + 1;

    // ── 7. Insert completed game session ───────────────────────────────────
    const { data: session, error: sessionError } = await service
      .from('game_sessions')
      .insert({
        user_id:          user.id,
        module_id:        moduleId,
        org_id,
        status:           'completed' as SessionStatus,
        score,
        passed,
        attempt_number:   attemptNumber,
        time_bucket:      classifyTime(gameConfig.estimatedMinutes * 60),
        game_state:       {
          sessionRef: sessionRef ?? null,
          gameId,
          maxScore,
          rawResult: result,
        },
        ended_at:         new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[/api/game/result] session insert error:', sessionError.message);
      return NextResponse.json(
        { error: 'Failed to save game session' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, sessionId: session.id, score, passed, attemptNumber },
      { status: 201 }
    );
  } catch (err) {
    console.error('[/api/game/result] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
