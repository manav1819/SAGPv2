-- ============================================================
--  Migration: 20260321000000_phishing_sim_module.sql
--  Creates the built-in Phishing Simulator module row.
--
--  This is a platform-level module (org_id = NULL) available
--  to all organisations.  The API route at
--  /api/game/phishing/complete auto-inserts this if missing,
--  but running the migration ensures it exists from day one
--  and prevents duplicate rows.
-- ============================================================

INSERT INTO modules (
  title,
  description,
  category,
  difficulty,
  game_type,
  points_value,
  estimated_mins,
  is_active
)
SELECT
  'Phishing Simulator',
  'Test your ability to identify phishing emails. 10 emails, 3 lives — spot the threats before they catch you.',
  'phishing',
  'medium',
  'phishing_sim',
  500,
  5,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM modules
  WHERE game_type = 'phishing_sim'
    AND title     = 'Phishing Simulator'
);
