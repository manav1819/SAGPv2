/**
 * POST /api/game/result
 *
 * Receives a GAME_COMPLETE postMessage payload forwarded by IframeGame,
 * persists it as a completed game_session, then fires both engine pipelines:
 *
 *   1. Gamification pipeline  → points, progress, streak, badges, leaderboard, remediation
 *   2. Analytics pipeline     → risk score recalculation, persona classification
 *
 * Both pipelines are awaited so the response carries the updated risk score
 * and persona — the frontend can display these immediately without a reload.
 *
 * If either engine fails, the failure is logged but the session result is
 * still returned (the session row is already committed). Both engines are
 * idempotent and can be re-triggered on the next session.
 *
 * Pipeline trace (structured JSON logs):
 *   game_completed → session_persisted → progress_updated → gamification_*
 *   → risk_recalculated → persona_updated → pipeline_complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { GAMES } from '@/config/games.config';
import { pipelineLog, withPipelineStage } from '@/lib/logger';
import { processSessionCompletion } from '@/engines/gamification';
import { processGameEvents } from '@/engines/analytics';

// ── Type helpers ─────────────────────────────────────────────────────────────

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

const GAME_MODULE_META: Record<string, { category: ModuleCategory; gameType: GameType }> = {
  phishing:           { category: 'phishing',           gameType: 'phishing_sim' },
  vishing:            { category: 'social_engineering', gameType: 'scenario'     },
  '3d-office':        { category: 'device_security',    gameType: 'scenario'     },
  'carnival-shooter': { category: 'phishing',           gameType: 'phishing_sim' },
};

function classifyTime(seconds: number): TimeBucket {
  if (seconds < 120) return 'less';
  if (seconds < 360) return 'medium';
  return 'more';
}

function normaliseResult(result: Record<string, unknown>) {
  const score =
    typeof result.score === 'number' ? result.score :
    typeof result.securityScore === 'number' ? result.securityScore : 0;
  const maxScore =
    typeof result.maxScore === 'number' ? result.maxScore :
    typeof result.securityScore === 'number' ? 200 : 100;
  const passed =
    typeof result.passed === 'boolean' ? result.passed : score / maxScore >= 0.5;
  return { score, maxScore, passed };
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const pipelineStart = Date.now();

  try {
    // ── 1. Parse body ─────────────────────────────────────────────────────
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

    pipelineLog({ stage: 'game_completed', gameId, data: { sessionRef } });

    // ── 2. Auth ───────────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 3. Resolve org_id ─────────────────────────────────────────────────
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
    const service = await createServiceRoleClient();

    // ── 4. Resolve game config and stub module ────────────────────────────
    const gameConfig = GAMES.find((g) => g.id === gameId);
    if (!gameConfig) {
      return NextResponse.json({ error: `Unknown game: ${gameId}` }, { status: 404 });
    }

    const meta = GAME_MODULE_META[gameId] ?? {
      category: 'device_security' as ModuleCategory,
      gameType: 'scenario' as GameType,
    };

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
          title: moduleTitle,
          description: gameConfig.description,
          category: meta.category,
          game_type: meta.gameType,
          points_value: gameConfig.maxScore,
          estimated_mins: gameConfig.estimatedMinutes,
          is_active: true,
        })
        .select('id')
        .single();

      if (moduleError || !newModule) {
        pipelineLog({ stage: 'error', gameId, userId: user.id, orgId: org_id, error: moduleError?.message ?? 'module upsert failed' });
        return NextResponse.json({ error: 'Failed to resolve module for game' }, { status: 500 });
      }
      moduleId = newModule.id as string;
    }

    // ── 5. Normalise result, compute attempt number ───────────────────────
    const { score, maxScore, passed } = normaliseResult(result);

    const { count } = await service
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('module_id', moduleId);

    const attemptNumber = (count ?? 0) + 1;

    // ── 6. Insert completed game session ──────────────────────────────────
    const { data: session } = await withPipelineStage(
      'session_persisted',
      { gameId, userId: user.id, orgId: org_id },
      async () => {
        const { data, error } = await service
          .from('game_sessions')
          .insert({
            user_id: user.id,
            module_id: moduleId,
            org_id,
            status: 'completed' as SessionStatus,
            score,
            passed,
            attempt_number: attemptNumber,
            time_bucket: classifyTime(gameConfig.estimatedMinutes * 60),
            game_state: { sessionRef: sessionRef ?? null, gameId, maxScore, rawResult: result },
            ended_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) throw error;
        return { data, error: null };
      }
    );

    if (!session) {
      // withPipelineStage re-throws Supabase errors, so if we reach here the
      // insert returned no row — should not happen but guard it anyway.
      pipelineLog({ stage: 'error', gameId, userId: user.id, orgId: org_id, error: 'session insert returned no row' });
      return NextResponse.json({ error: 'Failed to save game session' }, { status: 500 });
    }

    const sessionId = (session as { id: string }).id;

    // ── 7. Run both engine pipelines concurrently ─────────────────────────
    //
    // Both are run to completion before responding so the client receives
    // the updated risk score and persona immediately.
    // If either engine fails we log the error but still return the session result.
    //
    // Pipeline chain:
    //   session_persisted → [gamification_* | risk_recalculated + persona_updated]
    //                                      ↓
    //                             pipeline_complete

    let riskResult: { total_score: number; risk_tier: string; confidence: number } | null = null;
    let personaResult: { persona: string; confidence: number; drift_delta: number | null } | null = null;
    let pointsEarned = 0;
    let newStreak = 0;

    const [gamificationOutcome, analyticsOutcome] = await Promise.allSettled([
      // Gamification pipeline
      withPipelineStage(
        'gamification_started',
        { sessionId, userId: user.id, orgId: org_id, gameId },
        () => processSessionCompletion(sessionId)
      ),
      // Analytics pipeline
      withPipelineStage(
        'risk_engine_started',
        { sessionId, userId: user.id, orgId: org_id, gameId },
        async () => {
          const result = await processGameEvents(sessionId);
          return result;
        }
      ),
    ]);

    if (gamificationOutcome.status === 'rejected') {
      pipelineLog({ stage: 'error', sessionId, userId: user.id, orgId: org_id, error: String(gamificationOutcome.reason), data: { failedStage: 'gamification_started' } });
    }

    if (analyticsOutcome.status === 'rejected') {
      pipelineLog({ stage: 'error', sessionId, userId: user.id, orgId: org_id, error: String(analyticsOutcome.reason), data: { failedStage: 'risk_engine_started' } });
    }

    // ── 8. Collect enriched data for the response ─────────────────────────
    // Fetch latest risk score and gamification data for the response payload
    const [latestRiskRes, latestPersonaRes, latestStatsRes] = await Promise.allSettled([
      service
        .from('risk_scores')
        .select('total_score, risk_tier, formula_version')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single(),
      service
        .from('security_personas')
        .select('persona, confidence, signals')
        .eq('user_id', user.id)
        .eq('org_id', org_id)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single(),
      service
        .from('leaderboard')
        .select('total_points, streak_days')
        .eq('user_id', user.id)
        .eq('org_id', org_id)
        .eq('scope', 'org')
        .single(),
    ]);

    if (latestRiskRes.status === 'fulfilled' && latestRiskRes.value.data) {
      riskResult = {
        total_score: latestRiskRes.value.data.total_score,
        risk_tier: latestRiskRes.value.data.risk_tier,
        confidence: 0,
      };
    }

    if (latestPersonaRes.status === 'fulfilled' && latestPersonaRes.value.data) {
      const signals = latestPersonaRes.value.data.signals as Record<string, unknown> | null;
      personaResult = {
        persona: latestPersonaRes.value.data.persona,
        confidence: latestPersonaRes.value.data.confidence,
        drift_delta: (signals?.drift_delta as number | null) ?? null,
      };
    }

    if (latestStatsRes.status === 'fulfilled' && latestStatsRes.value.data) {
      pointsEarned = latestStatsRes.value.data.total_points ?? 0;
      newStreak = latestStatsRes.value.data.streak_days ?? 0;
    }

    pipelineLog({
      stage: 'pipeline_complete',
      sessionId,
      userId: user.id,
      orgId: org_id,
      gameId,
      durationMs: Date.now() - pipelineStart,
      data: {
        score,
        passed,
        risk_tier: riskResult?.risk_tier ?? null,
        persona: personaResult?.persona ?? null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        sessionId,
        score,
        passed,
        attemptNumber,
        risk: riskResult,
        persona: personaResult,
        gamification: {
          points_total: pointsEarned,
          streak_days: newStreak,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    pipelineLog({ stage: 'error', error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - pipelineStart });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
