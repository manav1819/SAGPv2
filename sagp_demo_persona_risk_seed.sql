-- ============================================================================
-- SAGP — Demo Persona & Risk Score Seed Script
-- ============================================================================
-- Populates every EXISTING employee (profiles + org_memberships already in
-- the database) with a believable security persona, a risk score, and every
-- related field the app's risk/persona engines and dashboards actually read:
--   - profiles.role_band / external_facing / recent_permission_elevation /
--     departing_window          (inputs to the Asset Risk Multiplier, see
--                                 src/engines/analytics/risk-score.ts)
--   - risk_scores                (append-only history; UNIQUE(user_id,org_id)
--                                 was dropped in 20260520000000_risk_engine_v2,
--                                 so this INSERTs — matching how the real
--                                 engine persists scores)
--   - security_personas           (append-only history; same reasoning)
--   - user_security_flags         (UX modifiers / IAM flag / escalation level
--                                  driven by the persona playbook — PK is
--                                  user_id, so this is an upsert: one row per
--                                  employee)
--
-- No employees are created. No schema is changed. profiles.role (RBAC) is
-- left untouched — only the risk-context columns added by the v2 migration
-- are updated.
--
-- Each employee gets a short history (4 risk_scores snapshots over ~3 weeks,
-- 3 security_personas snapshots over ~2 weeks) converging to a "current"
-- value, so trend charts on the dashboard have real shape instead of a
-- single flat point. Full explanation_json / signals are only attached to
-- the most recent (day-0) row of each, matching what the dashboard actually
-- reads (see src/lib/actions/dashboard.ts: `latest?.explanation_json`).
--
-- Safe to re-run: it only ever adds new history rows / updates context
-- columns, it never deletes anything.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Every existing, active employee + their primary org membership.
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _demo_employees ON COMMIT DROP AS
SELECT
  p.id      AS user_id,
  om.org_id AS org_id,
  random()  AS bucket_r
FROM profiles p
JOIN LATERAL (
  SELECT org_id
  FROM org_memberships om
  WHERE om.user_id = p.id
  ORDER BY joined_at ASC
  LIMIT 1
) om ON true
WHERE p.role <> 'superadmin'
  AND p.is_active IS NOT FALSE;

-- ----------------------------------------------------------------------------
-- 2. Assign a demo persona archetype (weighted, non-uniform distribution).
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _demo_archetype ON COMMIT DROP AS
SELECT
  user_id,
  org_id,
  CASE
    WHEN bucket_r < 0.15 THEN 'Security Champion'
    WHEN bucket_r < 0.35 THEN 'Cautious Employee'
    WHEN bucket_r < 0.55 THEN 'Busy Professional'
    WHEN bucket_r < 0.67 THEN 'Curious Explorer'
    WHEN bucket_r < 0.77 THEN 'Remote Worker'
    WHEN bucket_r < 0.85 THEN 'New Hire'
    WHEN bucket_r < 0.90 THEN 'Executive'
    WHEN bucket_r < 0.95 THEN 'IT Administrator'
    WHEN bucket_r < 0.98 THEN 'Overconfident Expert'
    ELSE 'Click-Happy User'
  END AS archetype
FROM _demo_employees;

-- ----------------------------------------------------------------------------
-- 3. Map each archetype to every field the app's real engines produce.
--    `persona` is restricted to the 6 taxonomy values the live persona
--    engine actually assigns and the dashboard actually renders labels for
--    (src/app/(employee)/dashboard/page.tsx#getPersonaDescription) — the 5
--    legacy enum values (careful_defender, speed_runner, clicker, guesser,
--    skeptic) predate the v2 engine and are intentionally not used here.
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _demo_final ON COMMIT DROP AS
SELECT
  a.user_id,
  a.org_id,
  a.archetype,

  (CASE a.archetype
    WHEN 'Security Champion'    THEN 'diligent_analyst'
    WHEN 'Cautious Employee'    THEN 'hesitant_worker'
    WHEN 'Busy Professional'    THEN 'fast_clicker'
    WHEN 'Curious Explorer'     THEN 'sentinel'
    WHEN 'Remote Worker'        THEN 'sentinel'
    WHEN 'New Hire'             THEN 'provisional'
    WHEN 'Executive'            THEN 'fast_clicker'
    WHEN 'IT Administrator'     THEN 'diligent_analyst'
    WHEN 'Overconfident Expert' THEN 'repeat_offender'
    WHEN 'Click-Happy User'     THEN 'fast_clicker'
  END)::security_persona AS persona,

  -- profiles risk-context columns
  (CASE a.archetype
    WHEN 'Executive'        THEN 'executive'
    WHEN 'IT Administrator' THEN 'privileged_admin'
    WHEN 'Overconfident Expert' THEN 'engineering_prod'
    ELSE 'standard'
  END) AS role_band,
  (CASE
    WHEN a.archetype IN ('Remote Worker', 'Executive') THEN true
    ELSE false
  END) AS external_facing,
  (CASE
    WHEN a.archetype = 'IT Administrator' AND random() < 0.3 THEN true
    ELSE false
  END) AS recent_permission_elevation,
  false AS departing_window,

  -- total_score (0-100), tuned to the requested ranges per archetype
  (round((CASE a.archetype
    WHEN 'Security Champion'    THEN 5  + random() * 15
    WHEN 'Cautious Employee'    THEN 15 + random() * 20
    WHEN 'Busy Professional'    THEN 40 + random() * 20
    WHEN 'Curious Explorer'     THEN 50 + random() * 20
    WHEN 'Remote Worker'        THEN 30 + random() * 25
    WHEN 'New Hire'             THEN 45 + random() * 20
    WHEN 'Executive'            THEN 40 + random() * 25
    WHEN 'IT Administrator'     THEN 5  + random() * 20
    WHEN 'Overconfident Expert' THEN 65 + random() * 20
    WHEN 'Click-Happy User'     THEN 75 + random() * 20
  END)::numeric, 0))::numeric(5,2) AS total_score,

  -- sub-scores (0-100), independently tuned so the data tells a coherent
  -- story (e.g. Overconfident Expert scores fine on quizzes but clicks
  -- phishing links anyway; New Hire is still learning across the board)
  round((CASE a.archetype
    WHEN 'Security Champion'    THEN 3  + random() * 12
    WHEN 'Cautious Employee'    THEN 12 + random() * 16
    WHEN 'Busy Professional'    THEN 38 + random() * 20
    WHEN 'Curious Explorer'     THEN 48 + random() * 20
    WHEN 'Remote Worker'        THEN 30 + random() * 22
    WHEN 'New Hire'             THEN 40 + random() * 18
    WHEN 'Executive'            THEN 42 + random() * 20
    WHEN 'IT Administrator'     THEN 2  + random() * 12
    WHEN 'Overconfident Expert' THEN 68 + random() * 20
    WHEN 'Click-Happy User'     THEN 78 + random() * 18
  END)::numeric)::numeric(5,2) AS phishing_susceptibility,

  round((CASE a.archetype
    WHEN 'Security Champion'    THEN 3  + random() * 12
    WHEN 'Cautious Employee'    THEN 15 + random() * 17
    WHEN 'Busy Professional'    THEN 32 + random() * 18
    WHEN 'Curious Explorer'     THEN 28 + random() * 17
    WHEN 'Remote Worker'        THEN 22 + random() * 18
    WHEN 'New Hire'             THEN 42 + random() * 18
    WHEN 'Executive'            THEN 20 + random() * 18
    WHEN 'IT Administrator'     THEN 3  + random() * 12
    WHEN 'Overconfident Expert' THEN 15 + random() * 15
    WHEN 'Click-Happy User'     THEN 45 + random() * 20
  END)::numeric)::numeric(5,2) AS incorrect_answer_rate,

  round((CASE a.archetype
    WHEN 'Security Champion'    THEN 3  + random() * 12
    WHEN 'Cautious Employee'    THEN 15 + random() * 15
    WHEN 'Busy Professional'    THEN 35 + random() * 20
    WHEN 'Curious Explorer'     THEN 40 + random() * 18
    WHEN 'Remote Worker'        THEN 25 + random() * 17
    WHEN 'New Hire'             THEN 35 + random() * 17
    WHEN 'Executive'            THEN 28 + random() * 17
    WHEN 'IT Administrator'     THEN 4  + random() * 12
    WHEN 'Overconfident Expert' THEN 20 + random() * 15
    WHEN 'Click-Happy User'     THEN 50 + random() * 20
  END)::numeric)::numeric(5,2) AS reaction_time_deviation,

  round((CASE a.archetype
    WHEN 'Security Champion'    THEN 0  + random() * 8
    WHEN 'Cautious Employee'    THEN 5  + random() * 13
    WHEN 'Busy Professional'    THEN 25 + random() * 20
    WHEN 'Curious Explorer'     THEN 15 + random() * 17
    WHEN 'Remote Worker'        THEN 15 + random() * 20
    WHEN 'New Hire'             THEN 30 + random() * 20
    WHEN 'Executive'            THEN 15 + random() * 17
    WHEN 'IT Administrator'     THEN 0  + random() * 6
    WHEN 'Overconfident Expert' THEN 35 + random() * 20
    WHEN 'Click-Happy User'     THEN 40 + random() * 20
  END)::numeric)::numeric(5,2) AS remediation_failure_rate,

  -- persona axes (velocity / vigilance ∈ [-1, 1]) consistent with the quadrant
  -- of the `persona` value chosen above
  round((CASE a.archetype
    WHEN 'Security Champion'    THEN -0.85 + random() * 0.50
    WHEN 'Cautious Employee'    THEN -0.75 + random() * 0.50
    WHEN 'Busy Professional'    THEN  0.25 + random() * 0.50
    WHEN 'Curious Explorer'     THEN  0.20 + random() * 0.50
    WHEN 'Remote Worker'        THEN  0.15 + random() * 0.40
    WHEN 'New Hire'             THEN -0.10 + random() * 0.20
    WHEN 'Executive'            THEN  0.20 + random() * 0.45
    WHEN 'IT Administrator'     THEN -0.85 + random() * 0.50
    WHEN 'Overconfident Expert' THEN  0.45 + random() * 0.45
    WHEN 'Click-Happy User'     THEN  0.55 + random() * 0.40
  END)::numeric, 2) AS velocity,

  round((CASE a.archetype
    WHEN 'Security Champion'    THEN  0.45 + random() * 0.45
    WHEN 'Cautious Employee'    THEN -0.55 + random() * 0.45
    WHEN 'Busy Professional'    THEN -0.65 + random() * 0.50
    WHEN 'Curious Explorer'     THEN  0.15 + random() * 0.50
    WHEN 'Remote Worker'        THEN  0.10 + random() * 0.45
    WHEN 'New Hire'             THEN -0.10 + random() * 0.20
    WHEN 'Executive'            THEN -0.55 + random() * 0.45
    WHEN 'IT Administrator'     THEN  0.45 + random() * 0.45
    WHEN 'Overconfident Expert' THEN -0.90 + random() * 0.45
    WHEN 'Click-Happy User'     THEN -0.85 + random() * 0.55
  END)::numeric, 2) AS vigilance,

  (CASE a.archetype
    WHEN 'Overconfident Expert' THEN floor(3 + random() * 4)
    WHEN 'Click-Happy User'     THEN floor(1 + random() * 3)
    WHEN 'Cautious Employee'    THEN floor(random() * 2)
    WHEN 'Busy Professional'    THEN floor(random() * 2)
    WHEN 'Executive'            THEN floor(random() * 2)
    ELSE 0
  END)::int AS failure_streak,

  (CASE a.archetype
    WHEN 'Security Champion'    THEN floor(45 + random() * 85)
    WHEN 'Cautious Employee'    THEN floor(20 + random() * 50)
    WHEN 'Busy Professional'    THEN floor(15 + random() * 40)
    WHEN 'Curious Explorer'     THEN floor(20 + random() * 55)
    WHEN 'Remote Worker'        THEN floor(15 + random() * 45)
    WHEN 'New Hire'             THEN floor(2  + random() * 7)
    WHEN 'Executive'            THEN floor(15 + random() * 35)
    WHEN 'IT Administrator'     THEN floor(50 + random() * 100)
    WHEN 'Overconfident Expert' THEN floor(15 + random() * 35)
    WHEN 'Click-Happy User'     THEN floor(10 + random() * 30)
  END)::int AS total_events,

  round((CASE a.archetype
    WHEN 'Security Champion'    THEN 0.70 + random() * 0.25
    WHEN 'Cautious Employee'    THEN 0.45 + random() * 0.30
    WHEN 'Busy Professional'    THEN 0.40 + random() * 0.30
    WHEN 'Curious Explorer'     THEN 0.45 + random() * 0.30
    WHEN 'Remote Worker'        THEN 0.40 + random() * 0.30
    WHEN 'New Hire'             THEN 0.10 + random() * 0.25
    WHEN 'Executive'            THEN 0.40 + random() * 0.30
    WHEN 'IT Administrator'     THEN 0.75 + random() * 0.22
    WHEN 'Overconfident Expert' THEN 0.65 + random() * 0.30
    WHEN 'Click-Happy User'     THEN 0.55 + random() * 0.30
  END)::numeric, 2) AS confidence,

  -- spike (recent phishing-fail penalty) — only the impulsive/high-risk
  -- archetypes carry a live spike; everyone else is 0
  (CASE a.archetype
    WHEN 'Overconfident Expert' THEN round((15 + random() * 10)::numeric, 2)
    WHEN 'Click-Happy User'     THEN round((15 + random() * 10)::numeric, 2)
    WHEN 'Busy Professional'    THEN round((random() * 8)::numeric, 2)
    ELSE 0::numeric(5,2)
  END) AS spike_value,
  (CASE a.archetype
    WHEN 'Overconfident Expert' THEN floor(2 + random() * 8)
    WHEN 'Click-Happy User'     THEN floor(2 + random() * 8)
    WHEN 'Busy Professional'    THEN floor(2 + random() * 8)
    ELSE NULL
  END)::int AS spike_days_ago,

  -- recovery credit — earned by consistently clean, vigilant archetypes
  (CASE a.archetype
    WHEN 'Security Champion'    THEN round((3 + random() * 6)::numeric, 2)
    WHEN 'IT Administrator'     THEN round((3 + random() * 7)::numeric, 2)
    WHEN 'Cautious Employee'    THEN round((random() * 3)::numeric, 2)
    ELSE 0::numeric(5,2)
  END) AS recovery_credit

FROM _demo_archetype a;

-- ----------------------------------------------------------------------------
-- 4. UPDATE existing profiles with risk-context columns only. Nothing else
--    on the row is touched.
-- ----------------------------------------------------------------------------
UPDATE profiles p
SET
  role_band                    = f.role_band,
  external_facing              = f.external_facing,
  recent_permission_elevation  = f.recent_permission_elevation,
  departing_window             = f.departing_window,
  updated_at                   = now()
FROM _demo_final f
WHERE p.id = f.user_id;

-- ----------------------------------------------------------------------------
-- 5. risk_scores — append-only, so INSERT. 4 snapshots per employee
--    (21d/14d/7d ago + now) converging to the target total_score. Full
--    explanation_json (matching RiskScoreExplanation) only on the "now" row,
--    since that's the only one the dashboard reads.
-- ----------------------------------------------------------------------------
INSERT INTO risk_scores (
  user_id, org_id, total_score, phishing_susceptibility, incorrect_answer_rate,
  reaction_time_deviation, remediation_failure_rate, risk_tier, computed_at,
  formula_version, explanation_json
)
SELECT
  f.user_id,
  f.org_id,
  snap_score,
  CASE WHEN snap.days_ago = 0 THEN f.phishing_susceptibility
       ELSE LEAST(100, GREATEST(0, round((f.phishing_susceptibility + (random()*16-8))::numeric,2))) END,
  CASE WHEN snap.days_ago = 0 THEN f.incorrect_answer_rate
       ELSE LEAST(100, GREATEST(0, round((f.incorrect_answer_rate + (random()*16-8))::numeric,2))) END,
  CASE WHEN snap.days_ago = 0 THEN f.reaction_time_deviation
       ELSE LEAST(100, GREATEST(0, round((f.reaction_time_deviation + (random()*16-8))::numeric,2))) END,
  CASE WHEN snap.days_ago = 0 THEN f.remediation_failure_rate
       ELSE LEAST(100, GREATEST(0, round((f.remediation_failure_rate + (random()*16-8))::numeric,2))) END,
  (CASE WHEN snap_score <= 25 THEN 'low'
        WHEN snap_score <= 55 THEN 'medium'
        WHEN snap_score <= 78 THEN 'high'
        ELSE 'critical' END)::risk_tier,
  now() - (snap.days_ago || ' days')::interval,
  '2.0.0',
  CASE WHEN snap.days_ago = 0 THEN
    jsonb_build_object(
      'formula_version', '2.0.0',
      'formula', 'clamp(0, 100, ARM · Σ wₖ·Sₖ + Spike − Recovery)',
      'total_score', f.total_score,
      'risk_tier', (CASE WHEN f.total_score <= 25 THEN 'low'
                         WHEN f.total_score <= 55 THEN 'medium'
                         WHEN f.total_score <= 78 THEN 'high'
                         ELSE 'critical' END),
      'arm', jsonb_build_object(
        'base', arm.base,
        'modifiers', arm.modifiers,
        'total', arm.total
      ),
      'pre_arm_subtotal', round((f.total_score / arm.total)::numeric, 2),
      'components', jsonb_build_array(
        jsonb_build_object('name','phishing','weight',0.4,'raw_subscore',f.phishing_susceptibility,'contribution',round((0.4*f.phishing_susceptibility)::numeric,2),'sample_size',f.total_events,'explanation','Severity-weighted, decayed phishing simulation history.'),
        jsonb_build_object('name','training','weight',0.2,'raw_subscore',f.incorrect_answer_rate,'contribution',round((0.2*f.incorrect_answer_rate)::numeric,2),'sample_size',f.total_events,'explanation','Decay-weighted incorrect answer rate + recklessness signal.'),
        jsonb_build_object('name','remediation','weight',0.2,'raw_subscore',f.remediation_failure_rate,'contribution',round((0.2*f.remediation_failure_rate)::numeric,2),'sample_size',GREATEST(1,floor(f.total_events::numeric/8)::int),'explanation','Fraction of remediation modules missed within SLA.'),
        jsonb_build_object('name','trend','weight',0.2,'raw_subscore',round((50+(random()*30-15))::numeric,2),'contribution',round((0.2*(50+(random()*30-15)))::numeric,2),'sample_size',6,'explanation','Trend slope over trailing weeks.')
      ),
      'spike', jsonb_build_object('value', f.spike_value, 'source_event_at', CASE WHEN f.spike_days_ago IS NULL THEN NULL ELSE (now() - (f.spike_days_ago || ' days')::interval) END, 'halflife_days', 7),
      'recovery_credit', f.recovery_credit,
      'confidence', f.confidence,
      'computed_at', now()
    )
  ELSE NULL END
FROM _demo_final f
CROSS JOIN LATERAL (VALUES (21), (14), (7), (0)) AS snap(days_ago)
CROSS JOIN LATERAL (
  SELECT
    (CASE f.role_band
       WHEN 'manager' THEN 1.15 WHEN 'finance' THEN 1.35 WHEN 'hr' THEN 1.35
       WHEN 'legal' THEN 1.35 WHEN 'engineering_prod' THEN 1.40
       WHEN 'privileged_admin' THEN 1.60 WHEN 'executive' THEN 1.70
       ELSE 1.00 END) AS base,
    (CASE f.role_band
       WHEN 'manager' THEN 1.15 WHEN 'finance' THEN 1.35 WHEN 'hr' THEN 1.35
       WHEN 'legal' THEN 1.35 WHEN 'engineering_prod' THEN 1.40
       WHEN 'privileged_admin' THEN 1.60 WHEN 'executive' THEN 1.70
       ELSE 1.00 END)
      + (CASE WHEN f.external_facing THEN 0.10 ELSE 0 END)
      + (CASE WHEN f.recent_permission_elevation THEN 0.10 ELSE 0 END)
      + (CASE WHEN f.departing_window THEN 0.20 ELSE 0 END) AS total,
    array_remove(ARRAY[
      CASE WHEN f.external_facing THEN 'external_facing +0.10' END,
      CASE WHEN f.recent_permission_elevation THEN 'recent_permission_elevation +0.10' END,
      CASE WHEN f.departing_window THEN 'departing_window +0.20' END
    ], NULL) AS modifiers
) arm
CROSS JOIN LATERAL (
  SELECT LEAST(100, GREATEST(0, round((
    f.total_score + CASE WHEN snap.days_ago = 0 THEN 0 ELSE (random()*2-1) * 16 * (snap.days_ago / 21.0) END
  )::numeric), 0))::numeric(5,2) AS snap_score
) score;

-- ----------------------------------------------------------------------------
-- 6. security_personas — append-only, so INSERT. 3 snapshots per employee
--    (14d/7d ago + now), same persona label throughout (a real behavioral
--    quadrant doesn't flip week to week), confidence and event volume
--    converging up to the "now" value.
-- ----------------------------------------------------------------------------
INSERT INTO security_personas (
  user_id, org_id, persona, confidence, signals, assigned_at
)
SELECT
  f.user_id,
  f.org_id,
  f.persona,
  LEAST(1, GREATEST(0, round((
    f.confidence - CASE WHEN snap.days_ago = 0 THEN 0 ELSE (0.05 + random()*0.15) * (snap.days_ago / 14.0) END
  )::numeric, 2))),
  jsonb_build_object(
    'velocity', f.velocity,
    'vigilance', f.vigilance,
    'failure_streak', CASE WHEN snap.days_ago = 0 THEN f.failure_streak ELSE GREATEST(0, f.failure_streak - floor(random()*2)::int) END,
    'total_events', GREATEST(1, round(f.total_events * (1 - 0.45 * (snap.days_ago / 14.0)))::int),
    'formula_version', '2.0.0',
    'axes', jsonb_build_object('velocity', f.velocity, 'vigilance', f.vigilance),
    'remediation', (CASE f.persona
      WHEN 'fast_clicker' THEN jsonb_build_object(
        'module_assignments', jsonb_build_array('micro-urgency-triggers','pause-before-you-click'),
        'ux_modifiers', jsonb_build_array('slow_mode','second_chance_dialog'),
        'manager_notification', false, 'escalation_level', 'none', 'iam_flag', 'none',
        'next_simulation', jsonb_build_object('difficulty','medium','theme','urgency','cadence_days',7))
      WHEN 'sentinel' THEN jsonb_build_object(
        'module_assignments', jsonb_build_array('advanced-threat-recognition'),
        'ux_modifiers', jsonb_build_array(),
        'manager_notification', false, 'escalation_level', 'none', 'iam_flag', 'none',
        'next_simulation', jsonb_build_object('difficulty','hard','theme','spear-phishing','cadence_days',30))
      WHEN 'hesitant_worker' THEN jsonb_build_object(
        'module_assignments', jsonb_build_array('decision-confidence-track','reporting-101'),
        'ux_modifiers', jsonb_build_array('just_in_time_tooltip'),
        'manager_notification', true, 'escalation_level', 'manager', 'iam_flag', 'none',
        'next_simulation', jsonb_build_object('difficulty','easy','cadence_days',14))
      WHEN 'diligent_analyst' THEN jsonb_build_object(
        'module_assignments', jsonb_build_array('red-team-scenarios'),
        'ux_modifiers', jsonb_build_array(),
        'manager_notification', false, 'escalation_level', 'none', 'iam_flag', 'none',
        'next_simulation', jsonb_build_object('difficulty','targeted','cadence_days',45))
      WHEN 'repeat_offender' THEN jsonb_build_object(
        'module_assignments', jsonb_build_array('mandatory-live-training','phishing-fundamentals'),
        'ux_modifiers', jsonb_build_array('slow_mode','second_chance_dialog','just_in_time_tooltip'),
        'manager_notification', true, 'escalation_level', 'security_team', 'iam_flag', 'mfa_step_up',
        'next_simulation', jsonb_build_object('difficulty','targeted','cadence_days',3))
      ELSE jsonb_build_object(
        'module_assignments', jsonb_build_array('security-fundamentals-baseline'),
        'ux_modifiers', jsonb_build_array(),
        'manager_notification', false, 'escalation_level', 'none', 'iam_flag', 'none',
        'next_simulation', jsonb_build_object('difficulty','easy','cadence_days',14))
    END),
    'explanation', 'Archetype: ' || f.archetype || ' — quadrant classification over trailing behavior window.',
    'drift_delta', NULL,
    'arm_multiplier', (CASE f.role_band
       WHEN 'manager' THEN 1.15 WHEN 'finance' THEN 1.35 WHEN 'hr' THEN 1.35
       WHEN 'legal' THEN 1.35 WHEN 'engineering_prod' THEN 1.40
       WHEN 'privileged_admin' THEN 1.60 WHEN 'executive' THEN 1.70
       ELSE 1.00 END)
  ),
  now() - (snap.days_ago || ' days')::interval
FROM _demo_final f
CROSS JOIN LATERAL (VALUES (14), (7), (0)) AS snap(days_ago);

-- ----------------------------------------------------------------------------
-- 7. user_security_flags — PK is user_id, exactly one row per employee.
--    Upsert with current (canonical persona) playbook values.
-- ----------------------------------------------------------------------------
INSERT INTO user_security_flags (user_id, org_id, ux_modifiers, iam_flag, escalation_level, updated_at)
SELECT
  f.user_id,
  f.org_id,
  (CASE f.persona
    WHEN 'fast_clicker'     THEN ARRAY['slow_mode','second_chance_dialog']
    WHEN 'hesitant_worker'  THEN ARRAY['just_in_time_tooltip']
    WHEN 'repeat_offender'  THEN ARRAY['slow_mode','second_chance_dialog','just_in_time_tooltip']
    ELSE ARRAY[]::text[]
  END),
  (CASE f.persona WHEN 'repeat_offender' THEN 'mfa_step_up' ELSE 'none' END),
  (CASE f.persona
    WHEN 'hesitant_worker' THEN 'manager'
    WHEN 'repeat_offender' THEN 'security_team'
    ELSE 'none'
  END),
  now()
FROM _demo_final f
ON CONFLICT (user_id) DO UPDATE SET
  org_id            = EXCLUDED.org_id,
  ux_modifiers      = EXCLUDED.ux_modifiers,
  iam_flag          = EXCLUDED.iam_flag,
  escalation_level  = EXCLUDED.escalation_level,
  updated_at        = now();

-- ----------------------------------------------------------------------------
-- 8. Sanity check — archetype distribution actually applied. Runs before
--    COMMIT since _demo_final (ON COMMIT DROP) only exists for this
--    transaction.
-- ----------------------------------------------------------------------------
SELECT archetype, persona, count(*) AS employees, round(avg(total_score),1) AS avg_risk_score
FROM _demo_final
GROUP BY archetype, persona
ORDER BY avg_risk_score;

COMMIT;
