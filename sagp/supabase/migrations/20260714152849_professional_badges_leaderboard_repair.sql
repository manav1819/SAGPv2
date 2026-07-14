-- Professional badge assets use stable local keys instead of emoji/URLs.
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS icon_key TEXT;

UPDATE public.badges
SET icon_key = CASE name
  WHEN 'CyberGuard: Complete' THEN 'cyberguard-complete'
  WHEN 'Speed Demon' THEN 'speed-demon'
  WHEN 'Vishing Simulator: Complete' THEN 'vishing-simulator-complete'
  WHEN 'Phishing Simulator: Complete' THEN 'phishing-simulator-complete'
  WHEN 'Threat Hunt: Easy Cleared' THEN 'threat-hunt-easy-cleared'
  WHEN 'Knowledge Seeker' THEN 'knowledge-seeker'
  WHEN 'First Steps' THEN 'first-steps'
  WHEN 'Threat Hunt: Medium Cleared' THEN 'threat-hunt-medium-cleared'
  WHEN 'Month Master' THEN 'month-master'
  WHEN 'Phishing Expert' THEN 'phishing-expert'
  WHEN 'Week Warrior' THEN 'week-warrior'
  WHEN 'Perfect Score' THEN 'perfect-score'
  WHEN 'Phish Hunter' THEN 'phish-hunter'
  WHEN 'Security Champion' THEN 'security-champion'
  WHEN 'Human Firewall: Complete' THEN 'human-firewall-complete'
  WHEN 'CyberForge: Complete' THEN 'cyberforge-complete'
  WHEN 'Threat Hunt: Legendary Cleared' THEN 'threat-hunt-legendary-cleared'
  ELSE 'badge-default'
END
WHERE icon_key IS NULL OR btrim(icon_key) = '';

ALTER TABLE public.badges
  ALTER COLUMN icon_key SET DEFAULT 'badge-default',
  ALTER COLUMN icon_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_badges_icon_key ON public.badges (icon_key);

-- Keep display names on leaderboard rows so employee clients do not need broad
-- SELECT access to profile rows (which also contain email addresses).
ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.leaderboard AS leaderboard_row
SET display_name = COALESCE(
  NULLIF(btrim(profile.display_name), ''),
  NULLIF(btrim(concat_ws(' ', profile.first_name, profile.last_name)), ''),
  'Player'
)
FROM public.profiles AS profile
WHERE profile.id = leaderboard_row.user_id
  AND (leaderboard_row.display_name IS NULL OR btrim(leaderboard_row.display_name) = '');

UPDATE public.leaderboard
SET display_name = 'Player'
WHERE display_name IS NULL OR btrim(display_name) = '';

ALTER TABLE public.leaderboard
  ALTER COLUMN display_name SET DEFAULT 'Player',
  ALTER COLUMN display_name SET NOT NULL;

-- Retain the most recently refreshed copy before enforcing atomic upserts.
WITH duplicates AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY user_id, org_id, scope, department
      ORDER BY updated_at DESC NULLS LAST, id DESC
    ) AS duplicate_number
  FROM public.leaderboard
)
DELETE FROM public.leaderboard AS leaderboard_row
USING duplicates
WHERE leaderboard_row.id = duplicates.id
  AND duplicates.duplicate_number > 1;

ALTER TABLE public.leaderboard
  DROP CONSTRAINT IF EXISTS leaderboard_user_org_scope_department_key;

ALTER TABLE public.leaderboard
  ADD CONSTRAINT leaderboard_user_org_scope_department_key
  UNIQUE NULLS NOT DISTINCT (user_id, org_id, scope, department);

-- RLS remains the row-visibility boundary; grants expose only reads used by
-- authenticated browser clients under current Supabase Data API defaults.
GRANT SELECT ON TABLE public.badges TO authenticated;
GRANT SELECT ON TABLE public.leaderboard TO authenticated;
