-- ===========================================================================
-- Integration Fixes Migration — 2026-05-27
-- ===========================================================================
-- Resolves all schema gaps identified during the runtime integration audit.
-- All statements are additive / idempotent (IF NOT EXISTS / IF EXISTS guards).
--
-- Apply after: 20260520000000_risk_engine_v2.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Enable Supabase Realtime on tables that the frontend subscribes to.
--    Without this, postgres_changes events are never broadcast.
--    Supabase requires tables to be in the publication for realtime to work.
-- ---------------------------------------------------------------------------

-- Add risk_scores to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE risk_scores;

-- Add security_personas to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE security_personas;

-- Add leaderboard to the realtime publication (for streak + points updates)
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- Add user_security_flags to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_security_flags;

-- ---------------------------------------------------------------------------
-- 2. RLS policies for risk_scores — employees can read their own scores.
--    Admins can read all scores for their org.
-- ---------------------------------------------------------------------------

ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

-- Employees: read own scores
CREATE POLICY "Employees read own risk scores"
  ON risk_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Admins: read all scores for their org
CREATE POLICY "Admins read org risk scores"
  ON risk_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid()
        AND org_id = risk_scores.org_id
        AND org_role IN ('org_admin', 'manager')
    )
  );

-- Service role (used by engine): unrestricted via service_role key bypass

-- ---------------------------------------------------------------------------
-- 3. RLS policies for security_personas
-- ---------------------------------------------------------------------------

ALTER TABLE security_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read own persona"
  ON security_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read org personas"
  ON security_personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid()
        AND org_id = security_personas.org_id
        AND org_role IN ('org_admin', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. RLS policy for leaderboard — needed for realtime subscription filter.
-- ---------------------------------------------------------------------------

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read leaderboard for their org"
  ON leaderboard FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid()
        AND org_id = leaderboard.org_id
    )
  );

-- ---------------------------------------------------------------------------
-- 5. progress table — enable RLS so employees can read/write their own rows.
-- ---------------------------------------------------------------------------

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users write own progress"
  ON progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role writes progress during session completion (bypasses RLS).

-- ---------------------------------------------------------------------------
-- 6. risk_scores: ensure formula_version + explanation_json columns exist.
--    (Defined in risk_engine_v2 migration, repeated here as a safety net
--    in case that migration was applied before these columns were added.)
-- ---------------------------------------------------------------------------

ALTER TABLE risk_scores
  ADD COLUMN IF NOT EXISTS formula_version TEXT NOT NULL DEFAULT '2.0.0',
  ADD COLUMN IF NOT EXISTS explanation_json JSONB;

-- ---------------------------------------------------------------------------
-- 7. remediation_log: update formula_version default to reflect v2 engine.
-- ---------------------------------------------------------------------------

-- No schema change needed — formula_version lives on risk_scores.
-- Reminder: table name is 'remediation_log' (singular). Any code using
-- 'remediation_logs' (plural) is writing to a non-existent table.

-- ---------------------------------------------------------------------------
-- 8. Indexes supporting the realtime query patterns.
-- ---------------------------------------------------------------------------

-- Latest persona per user (used by classifyPersonaFromDb drift fetch)
CREATE INDEX IF NOT EXISTS idx_security_personas_user_recent
  ON security_personas (user_id, assigned_at DESC);

-- Latest leaderboard row per user+org+scope (used by dashboard queries)
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_org_scope
  ON leaderboard (user_id, org_id, scope);

-- Progress lookup by user+module (used by gamification progress upsert)
CREATE INDEX IF NOT EXISTS idx_progress_user_module
  ON progress (user_id, module_id, org_id);

-- ---------------------------------------------------------------------------
-- 9. Backfill formula_version for existing risk_score rows written before
--    the v2 engine was deployed (they will have the default '1.0.0').
--    Update to '2.0.0' only if explanation_json is populated (v2 rows).
-- ---------------------------------------------------------------------------

UPDATE risk_scores
   SET formula_version = '2.0.0'
 WHERE explanation_json IS NOT NULL
   AND formula_version = '1.0.0';
