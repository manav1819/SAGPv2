-- ============================================================
--  Migration: 20260518000000_game_registry.sql
--  Creates the games registry table.
--
--  Purpose
--  -------
--  The `modules` table tracks training assignments, game sessions,
--  and completion data per user.  The `games` table is the
--  platform-level registry of every playable game — its type,
--  display metadata, and filesystem location.
--
--  The sync script (npm run sync:games) upserts rows here from
--  src/config/games.config.ts so the DB always matches the code.
--
--  DO NOT RUN MANUALLY — apply via the Supabase migration pipeline.
-- ============================================================

CREATE TABLE IF NOT EXISTS games (
  -- Stable URL slug used as the route parameter in /play/[gameId]
  id                TEXT        PRIMARY KEY,

  title             TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',

  -- Rendering strategy: determines which component mounts at /play/[id]
  type              TEXT        NOT NULL
                    CHECK (type IN ('phaser', 'iframe', 'scorm')),

  -- Relative public path to the thumbnail image
  thumbnail         TEXT,

  -- Display category (free-text, e.g. 'Security Awareness')
  category          TEXT,

  -- 1 = Easy, 2 = Medium, 3 = Hard
  difficulty        INTEGER     CHECK (difficulty IN (1, 2, 3)),

  max_score         INTEGER     NOT NULL DEFAULT 100,
  estimated_minutes INTEGER     NOT NULL DEFAULT 10,

  -- Type-specific routing fields (only one should be non-null)
  phaser_scene      TEXT,   -- e.g. '@/games/password-defender/index'
  iframe_url        TEXT,   -- e.g. '/games/social-eng-sim/index.html'
  scorm_path        TEXT,   -- relative to public/games/<id>/; defaults to index.html

  -- Arbitrary extra configuration (feature flags, difficulty params, etc.)
  config            JSONB       NOT NULL DEFAULT '{}',

  active            BOOLEAN     NOT NULL DEFAULT true,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_games_active   ON games (active);
CREATE INDEX IF NOT EXISTS idx_games_type     ON games (type);
CREATE INDEX IF NOT EXISTS idx_games_category ON games (category);

-- ── updated_at trigger ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_set_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION public.set_games_updated_at();

-- ── Row-Level Security ─────────────────────────────────────────────────────────

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may read active games
CREATE POLICY "Authenticated users can view active games"
  ON games FOR SELECT
  USING (active = true);

-- Org admins and superadmins may manage all rows (including inactive)
CREATE POLICY "Admins can manage games"
  ON games FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM org_memberships
      WHERE user_id   = auth.uid()
        AND org_role IN ('org_admin', 'superadmin')
    )
  );
