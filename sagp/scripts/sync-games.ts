/**
 * scripts/sync-games.ts
 *
 * Upserts every game in src/config/games.config.ts into the `games` table.
 * Run via:
 *   npm run sync:games
 *
 * Requires .env.local at the project root with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { GAMES } from '../src/config/games.config';
import type { GameConfig } from '../src/config/games.config';

// ── Load .env.local ────────────────────────────────────────────────────────────

loadEnv({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\n[sync:games] ERROR — missing environment variables.\n' +
    'Make sure .env.local contains:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL\n' +
    '  SUPABASE_SERVICE_ROLE_KEY\n'
  );
  process.exit(1);
}

// ── Supabase service-role client (bypasses RLS for writes) ────────────────────

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Map GameConfig → DB row ────────────────────────────────────────────────────

function toDbRow(game: GameConfig) {
  return {
    id:                game.id,
    title:             game.title,
    description:       game.description,
    type:              game.type,
    thumbnail:         game.thumbnail   ?? null,
    category:          game.category,
    difficulty:        game.difficulty,
    max_score:         game.maxScore,
    estimated_minutes: game.estimatedMinutes,
    phaser_scene:      game.phaserScene ?? null,
    iframe_url:        game.iframeUrl   ?? null,
    scorm_path:        game.scormPath   ?? null,
    config:            {},
    active:            game.active,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function syncGames() {
  console.log(`\n[sync:games] Syncing ${GAMES.length} game(s)…\n`);

  let ok = 0;
  let fail = 0;

  for (const game of GAMES) {
    const row = toDbRow(game);
    const { error } = await supabase
      .from('games')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌  ${game.id.padEnd(24)} — ${error.message}`);
      fail++;
    } else {
      console.log(`  ✅  ${game.id.padEnd(24)} "${game.title}"`);
      ok++;
    }
  }

  console.log(`\n[sync:games] Done — ${ok} succeeded, ${fail} failed.\n`);

  if (fail > 0) process.exit(1);
}

syncGames();
