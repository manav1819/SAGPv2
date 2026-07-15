-- ============================================================
--  Migration: 20260712000000_carnival_difficulty_badges.sql
--
--  Seeds badge rows for:
--    1. CyberCarnival: Threat Hunt — one completion badge per
--       difficulty level (Easy / Medium / Legendary).
--    2. Every other active game — a single generic completion
--       badge each (Phishing, Vishing, CyberGuard, CyberForge,
--       Human Firewall).
--
--  No schema changes. The `badges` / `user_badges` tables and
--  their RLS policies already support this (see schema.sql —
--  badges are readable by all authenticated users, user_badges
--  readable only by the owning user, writes go through the
--  service-role client in the gamification engine which bypasses
--  RLS). The badge_type 'completion' already exists in the
--  badge_type enum, so no ALTER TYPE is needed either.
--
--  This script is idempotent — safe to run more than once. Each
--  badge is matched by its `criteria->>'game_id'` value, since
--  `badges.name` has no unique constraint.
--
--  Run this manually in the Supabase SQL Editor against your
--  project (or via `supabase db push` / the CLI migration
--  pipeline — either works, it's a plain seed script).
--
--  Companion application code changes (shipped alongside this):
--    - src/engines/gamification/badges.ts
--        · titleToId map extended with carnival-shooter-easy /
--          -medium / -legendary and human-firewall
--        · fixed a pre-existing bug where the module-title lookup
--          never matched because stored module titles are prefixed
--          with "[Game] " and the lookup map keys were not
--    - src/app/api/game/result/route.ts
--        · appends a level suffix ("— Easy" / "— Medium" /
--          "— Legendary") to the module title for carnival-shooter
--          sessions so each level tracks as its own module/session
--          history, which is what the badge criteria below key off.
-- ============================================================

DO $$
BEGIN

  -- ── CyberCarnival: Threat Hunt — per-level completion badges ────────────

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'carnival-shooter-easy') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Threat Hunt: Easy Cleared',
      'Completed CyberCarnival: Threat Hunt on Easy difficulty.',
      '🥉',
      'completion',
      '{"type": "game_completed", "game_id": "carnival-shooter-easy"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'carnival-shooter-medium') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Threat Hunt: Medium Cleared',
      'Completed CyberCarnival: Threat Hunt on Medium difficulty.',
      '🥈',
      'completion',
      '{"type": "game_completed", "game_id": "carnival-shooter-medium"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'carnival-shooter-legendary') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Threat Hunt: Legendary Cleared',
      'Completed CyberCarnival: Threat Hunt on Legendary difficulty — the highest threat density and speed in the carnival.',
      '👑',
      'completion',
      '{"type": "game_completed", "game_id": "carnival-shooter-legendary"}'
    );
  END IF;

  -- ── Single completion badge per remaining active game ────────────────────

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'phishing') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Phishing Simulator: Complete',
      'Completed the Phishing Simulator.',
      '🐟',
      'completion',
      '{"type": "game_completed", "game_id": "phishing"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'vishing') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Vishing Simulator: Complete',
      'Completed the Vishing Simulator.',
      '📞',
      'completion',
      '{"type": "game_completed", "game_id": "vishing"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = '3d-office') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'CyberGuard: Complete',
      'Completed CyberGuard: Office Security.',
      '🏢',
      'completion',
      '{"type": "game_completed", "game_id": "3d-office"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'cyberforge') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'CyberForge: Complete',
      'Completed CyberForge.',
      '⚗️',
      'completion',
      '{"type": "game_completed", "game_id": "cyberforge"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE criteria->>'game_id' = 'human-firewall') THEN
    INSERT INTO badges (name, description, icon_url, badge_type, criteria)
    VALUES (
      'Human Firewall: Complete',
      'Completed Operation Human Firewall.',
      '🧱',
      'completion',
      '{"type": "game_completed", "game_id": "human-firewall"}'
    );
  END IF;

END $$;
