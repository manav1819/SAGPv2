-- ===========================================================================
-- Risk Engine v2 — schema migration
-- ===========================================================================
-- Reconciles the v2 scoring + persona engine with the existing schema.
-- All changes are additive or constraint-relaxing; nothing is dropped.
--
-- Apply order: this whole file in one transaction EXCEPT the ALTER TYPE
-- ADD VALUE statements (Postgres requires those outside a tx). Supabase's
-- migration runner handles that automatically when each ADD VALUE is its
-- own statement.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend phishing_event_type enum so the v2 severity table is meaningful.
--    (Each ADD VALUE must be its own statement.)
-- ---------------------------------------------------------------------------
ALTER TYPE phishing_event_type ADD VALUE IF NOT EXISTS 'attachment_opened';
ALTER TYPE phishing_event_type ADD VALUE IF NOT EXISTS 'report_after_click';
ALTER TYPE phishing_event_type ADD VALUE IF NOT EXISTS 'ignored';

-- ---------------------------------------------------------------------------
-- 2. Extend security_persona enum with the v2 taxonomy.
--    The legacy values stay in place so existing rows remain valid.
-- ---------------------------------------------------------------------------
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'fast_clicker';
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'sentinel';
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'hesitant_worker';
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'diligent_analyst';
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'repeat_offender';
ALTER TYPE security_persona ADD VALUE IF NOT EXISTS 'provisional';

-- ---------------------------------------------------------------------------
-- 3. Role / Asset-Risk-Multiplier context on profiles.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_band TEXT
    NOT NULL DEFAULT 'standard'
    CHECK (role_band IN (
      'standard','manager','finance','hr','legal',
      'engineering_prod','privileged_admin','executive'
    )),
  ADD COLUMN IF NOT EXISTS external_facing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recent_permission_elevation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS departing_window BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 4. Risk scores: append-only audit trail with formula versioning.
--    Drop the UNIQUE constraint that blocked history; current score becomes
--    "most recent row" via the view defined below.
-- ---------------------------------------------------------------------------
ALTER TABLE risk_scores DROP CONSTRAINT IF EXISTS risk_scores_user_id_org_id_key;

ALTER TABLE risk_scores
  ADD COLUMN IF NOT EXISTS formula_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS explanation_json JSONB;

CREATE INDEX IF NOT EXISTS idx_risk_scores_user_recent
  ON risk_scores (user_id, computed_at DESC);

CREATE OR REPLACE VIEW risk_scores_current AS
  SELECT DISTINCT ON (user_id, org_id) *
  FROM risk_scores
  ORDER BY user_id, org_id, computed_at DESC;

-- ---------------------------------------------------------------------------
-- 5. remediation_log: extend to support persona-driven enrollments (no
--    session) and SLA tracking. session_id becomes nullable so the persona
--    engine can write enrollment rows that aren't tied to a quiz session.
-- ---------------------------------------------------------------------------
ALTER TABLE remediation_log
  ALTER COLUMN session_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS module_slug TEXT,
  ADD COLUMN IF NOT EXISTS trigger_reason TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill assigned_at / due_at for legacy rows.
UPDATE remediation_log
   SET assigned_at = COALESCE(assigned_at, created_at),
       due_at      = COALESCE(due_at, created_at + INTERVAL '7 days')
 WHERE assigned_at IS NULL OR due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_remediation_log_user_due
  ON remediation_log (user_id, due_at);

-- ---------------------------------------------------------------------------
-- 6. Time-to-Click on phishing_events. Stored as a real column for indexing;
--    a generated column pulls from existing metadata JSONB so historical
--    rows are picked up automatically.
-- ---------------------------------------------------------------------------
ALTER TABLE phishing_events
  ADD COLUMN IF NOT EXISTS time_to_click_seconds INTEGER
    GENERATED ALWAYS AS (
      NULLIF((metadata->>'time_to_click_seconds')::INTEGER, 0)
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_phishing_events_user_created
  ON phishing_events (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 7. UX modifiers / IAM flags driven by persona auto-remediation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_security_flags (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  ux_modifiers TEXT[] NOT NULL DEFAULT '{}',
  iam_flag TEXT NOT NULL DEFAULT 'none'
    CHECK (iam_flag IN ('none','mfa_step_up','access_review')),
  escalation_level TEXT NOT NULL DEFAULT 'none'
    CHECK (escalation_level IN ('none','manager','security_team','hr')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_security_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own flags" ON user_security_flags
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. Next-simulation scheduler — consumed by the phishing dispatcher.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phishing_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','targeted')),
  theme TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phishing_schedule_pending
  ON phishing_schedule (scheduled_for) WHERE fired_at IS NULL;

ALTER TABLE phishing_schedule ENABLE ROW LEVEL SECURITY;
