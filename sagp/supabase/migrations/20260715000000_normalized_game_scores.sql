-- ============================================================
--  Migration: 20260715000000_normalized_game_scores.sql
--
--  Purpose
--  -------
--  Every game currently writes its own raw point scale into
--  game_sessions.score (Phishing maxes ~1950, CyberForge 3000,
--  CyberCarnival 10000, Human Firewall effectively uncapped, etc).
--  leaderboard.total_points sums this raw score unweighted across every
--  game a user has played, so a single Human Firewall session can dwarf
--  a dozen Phishing Simulator sessions combined — the leaderboard ends
--  up mostly reflecting "did you play the high-scale games," not overall
--  security awareness. See the platform's scoring-standardization plan
--  (approved 2026-07-15) for the full audit and rationale.
--
--  This migration adds a `normalized_score` column (0-1000 scale) to
--  game_sessions and backfills existing completed sessions, WITHOUT
--  touching the existing `score` column (raw scores stay exactly as
--  recorded — no destructive rewrite, no silent overwrite of history).
--
--  IMPORTANT — why backfill reads game_state, not the `score` column
--  -------------------------------------------------------------------
--  src/engines/gamification/index.ts (processSessionCompletion) overwrites
--  game_sessions.score shortly after insert with a *different* computed
--  value from calculatePoints() (module.points_value x difficulty/speed/
--  streak multipliers) — so `score` on a completed row is NOT the raw
--  in-game result by the time you read it. The true raw score the game
--  itself reported is preserved untouched in
--  game_state->'rawResult'->>'score' (or ->>'securityScore' for the
--  3d-office game), written once at insert time by /api/game/result and
--  never modified afterward. Backfill uses that, not `score`, as the
--  numerator. This calculatePoints() overwrite is a pre-existing, separate
--  scoring quirk (affects progress.best_score / speed_run badges too) —
--  flagged for a follow-up decision, not changed by this migration.
--
--  Denominator choice for backfill
--  --------------------------------
--  Each game_sessions row's own game_state->>'maxScore' (the value the
--  *game itself* reported at play time via its GAME_COMPLETE payload) is
--  used as the denominator wherever present, NOT the current games.max_score
--  column — several games.config.ts maxScore values were themselves wrong
--  until 2026-07-15 (vishing 500→100, 3d-office 1000→200, phishing 500→1950),
--  so re-deriving history from the *now-corrected* config would silently
--  reinterpret old sessions under a scale that didn't exist when they were
--  played. Falls back to games.max_score, then a flat 100, only when a
--  session predates the game_state.maxScore field entirely.
--
--  Going forward, normalized_score is computed and written at session-insert
--  time by /api/game/result (route.ts), from the same rawResult payload,
--  BEFORE the gamification pipeline's calculatePoints() overwrite ever runs
--  — so new rows don't inherit this quirk and no further backfill is needed.
--
--  Consumers
--  ---------
--  - leaderboard.ts sums normalized_score instead of raw score for
--    total_points (see updateLeaderboard()).
--  - The risk engine (risk-score.ts) is explicitly NOT a consumer — it
--    scores users from game_events (correctness / reaction time), never
--    from game_sessions.score or .normalized_score. See the guard comment
--    added there in this same change set.
-- ============================================================

-- ── 1. Add the column ────────────────────────────────────────────────────────
-- Nullable: in-progress/abandoned sessions have no meaningful normalized
-- score, and we don't want to force a fabricated 0 onto rows that were
-- never completed.

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS normalized_score INTEGER;

COMMENT ON COLUMN game_sessions.normalized_score IS
  'Raw score (from game_state.rawResult, NOT the score column - see migration header) re-scaled to 0-1000 using the maxScore the game reported for that session. Used by leaderboard/badge aggregation across games with different point scales. Never consumed by the risk engine - see risk-score.ts.';

-- ── 2. Backfill existing completed sessions ─────────────────────────────────
--
-- raw_score prefers game_state.rawResult.score, falls back to
-- game_state.rawResult.securityScore (the 3d-office game's field name),
-- and only falls back to the (possibly overwritten) `score` column itself
-- for pre-existing rows that predate the rawResult payload being stored.

-- Pass 1: sessions whose game_state carries the maxScore reported at play time.

UPDATE game_sessions gs
SET normalized_score = LEAST(1000, GREATEST(0,
  ROUND(
    COALESCE(
      (gs.game_state->'rawResult'->>'score')::numeric,
      (gs.game_state->'rawResult'->>'securityScore')::numeric,
      gs.score::numeric,
      0
    )
    / NULLIF((gs.game_state->>'maxScore')::numeric, 0)
    * 1000
  )::int
))
WHERE gs.status = 'completed'
  AND gs.normalized_score IS NULL
  AND (gs.game_state->>'maxScore') IS NOT NULL
  AND (gs.game_state->>'maxScore')::numeric > 0;

-- Pass 2: remaining completed sessions with no usable game_state.maxScore —
-- fall back to the games table via game_state->>'gameId', then a flat 100.
--
-- Guarded: the `games` table (supabase/migrations/20260518000000_game_registry.sql)
-- is a separate, optional registry mirror of games.config.ts and may not exist
-- in every environment yet (npm run sync:games populates it) — this migration
-- must not hard-fail just because that table hasn't been created here. Skipped
-- entirely when absent; Pass 3 below still catches every remaining row with the
-- flat-100 fallback either way.

DO $$
BEGIN
  IF to_regclass('public.games') IS NOT NULL THEN
    UPDATE game_sessions gs
    SET normalized_score = LEAST(1000, GREATEST(0,
      ROUND(
        COALESCE(
          (gs.game_state->'rawResult'->>'score')::numeric,
          (gs.game_state->'rawResult'->>'securityScore')::numeric,
          gs.score::numeric,
          0
        )
        / NULLIF(COALESCE(g.max_score, 100)::numeric, 0)
        * 1000
      )::int
    ))
    FROM games g
    WHERE gs.status = 'completed'
      AND gs.normalized_score IS NULL
      AND gs.game_state->>'gameId' = g.id;
  END IF;
END $$;

-- Pass 3: anything left (no game_state at all / gameId not found in games) —
-- flat 100 denominator so no completed row is left un-normalized.

UPDATE game_sessions gs
SET normalized_score = LEAST(1000, GREATEST(0,
  ROUND(COALESCE(gs.score, 0)::numeric / 100 * 1000)::int
))
WHERE gs.status = 'completed'
  AND gs.normalized_score IS NULL;

-- ── 3. Guard the scale going forward ─────────────────────────────────────────

ALTER TABLE game_sessions
  ADD CONSTRAINT game_sessions_normalized_score_range
  CHECK (normalized_score IS NULL OR normalized_score BETWEEN 0 AND 1000);
