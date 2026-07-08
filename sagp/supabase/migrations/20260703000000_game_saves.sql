-- ============================================================
--  Migration: 20260703000000_game_saves.sql
--  Creates the generic game save/resume table.
--
--  Purpose
--  -------
--  `game_saves` holds a single "in-progress" snapshot per (user, game),
--  independent of `game_sessions` (which records completed attempts for
--  analytics/leaderboard/risk-engine purposes — see api/game/result).
--  Keeping these separate means autosave writes here never touch attempt
--  counting, scoring pipelines, or SCORM/analytics tables.
--
--  One row per user per game: a new save overwrites the previous one
--  (UPSERT on user_id+game_id). "Start New Game" deletes the row.
--
--  Written/read by:
--    - src/lib/game-save/SaveManager.ts (client)
--    - src/app/api/game/save/route.ts   (server — enforces auth + ownership)
-- ============================================================

CREATE TABLE IF NOT EXISTS game_saves (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id            UUID        REFERENCES organizations(id) ON DELETE CASCADE,

  -- Matches games.id (the slug used in /play/[id] and games.config.ts).
  -- Deliberately NOT a foreign key to games(id): games.config.ts is the
  -- source of truth and is only mirrored into `games` by `npm run
  -- sync:games`. A hard FK here would make autosave fail outright for any
  -- game added to the config but not yet synced. The API route is the
  -- place to validate gameId against GAMES if stricter enforcement is
  -- wanted later.
  game_id           TEXT        NOT NULL,

  -- Correlates with the sessionRef used by IframeGame / /api/game/result,
  -- so a resumed run can be tied back to the same session lineage.
  session_ref       TEXT,

  -- Arbitrary game-specific payload. Shape is owned by each game's
  -- serializeState()/restoreState() — the platform never inspects it.
  state             JSONB       NOT NULL DEFAULT '{}',

  -- Bump this in a game's serializer when the shape of `state` changes,
  -- so restoreState() can detect and discard incompatible old saves.
  schema_version    INTEGER     NOT NULL DEFAULT 1,

  -- Denormalised summary fields for quick display on the "Continue?"
  -- prompt without needing to parse `state` client-side.
  level             TEXT,
  score             INTEGER,
  elapsed_seconds   INTEGER     NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, game_id)
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_game_saves_user     ON game_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_game_saves_game     ON game_saves (game_id);
CREATE INDEX IF NOT EXISTS idx_game_saves_org      ON game_saves (org_id);

-- ── updated_at trigger ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_game_saves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_saves_set_updated_at ON game_saves;
CREATE TRIGGER game_saves_set_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW EXECUTE FUNCTION public.set_game_saves_updated_at();

-- ── Row-Level Security ─────────────────────────────────────────────────────────

ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Users can fully manage (read/write/delete) only their own save.
CREATE POLICY "Users manage own game saves"
  ON game_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Org admins/managers/superadmins may read (not write) saves for their org,
-- useful for support ("why is this employee stuck") without granting write
-- access that could let an admin tamper with a save.
CREATE POLICY "Admins read org game saves"
  ON game_saves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid()
        AND org_id = game_saves.org_id
        AND org_role IN ('org_admin', 'manager', 'superadmin')
    )
  );

-- Service role (used by API routes for privileged upserts) bypasses RLS.
