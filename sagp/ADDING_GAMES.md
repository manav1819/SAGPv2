# Adding Games to SAGP

This document explains how to register, deploy, and verify a new game in the
Security Awareness Gamification Platform.

---

## Overview — Two-Layer System

SAGP uses a two-layer game registry:

**Layer 1 — Database (`games` table)**
The authoritative source for the admin dashboard, analytics, and any server-side
game discovery. Kept in sync by running `npm run sync:games`.

**Layer 2 — Source code (`src/config/games.config.ts`)**
The in-memory registry that the application reads at runtime. Every game must
have an entry here. The DB is derived from this file, not the other way around.

```
games.config.ts  ──(npm run sync:games)──▶  DB games table
     │
     └──(Next.js build)──▶  /games library page
                         ──▶  /play/[gameId] dynamic route
```

When you add a game, you touch the config file **first**, drop the game files
into the right folder, then sync to the DB.

---

## Folder Conventions

### Type: `'iframe'` — Self-contained HTML / Phaser-in-iframe

The entire game bundle lives inside `public/` so Next.js serves it as a static
asset. The generic `/play/[gameId]` route embeds it in a full-screen iframe.

```
public/games/<game-id>/
├── index.html          ← entry point loaded by the iframe
├── phaser.js           ← if Phaser is bundled locally
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── data.json
└── src/
    └── scenes/
        └── MyScene.js
```

The game communicates completion by posting a message to the parent window:

```javascript
window.parent.postMessage(
  {
    type: 'GAME_COMPLETE',
    won: true,
    sessionData: { finalScore: 420, /* ... */ }
  },
  window.location.origin   // same-origin required
);
```

### Type: `'phaser'` — Native Phaser 3 Scene (TypeScript)

The scene lives inside the Next.js source tree so it can call SAGP APIs
directly. Assets are still served from `public/`.

```
src/games/<game-id>/
└── index.ts             ← default export is a Phaser.Scene subclass

public/games/<game-id>/
└── assets/              ← sprites, audio, tilemaps (served statically)
```

The scene receives context via the Phaser registry (set before `preBoot`):

```typescript
// Inside your scene:
const playerName = this.registry.get('playerName') as string;
const gameId     = this.registry.get('gameId')     as string;
```

### Type: `'scorm'` — SCORM 1.2 / 2004 Package

Drop the entire SCORM package into `public/games/<game-id>/`. Point
`scormPath` at the manifest entry point (defaults to `index.html`).

```
public/games/<game-id>/
├── index.html           ← or whatever scormPath points to
├── imsmanifest.xml
└── content/
    └── ...
```

---

## Step-by-Step: Adding a New Game

### For `'iframe'` games

- [ ] Add an entry to the `GAMES` array in `src/config/games.config.ts`:

```typescript
{
  id:               'password-defender',
  title:            'Password Defender',
  description:      'Build the strongest password before the hackers break through.',
  type:             'iframe',
  thumbnail:        '/images/games/password-defender.webp',
  category:         'Passwords',
  difficulty:       1,
  maxScore:         300,
  estimatedMinutes: 8,
  iframeUrl:        '/games/password-defender/index.html',
  active:           true,
  icon:             '🔐',
},
```

- [ ] Drop the game bundle into `public/games/password-defender/` (see folder convention above).
- [ ] Run `npm run sync:games` to upsert the entry into the database.
- [ ] Add a thumbnail at `public/images/games/password-defender.webp` (recommended: 16:9, ≥640 px wide).
- [ ] Visit `/play/password-defender` to verify the iframe loads correctly.

### For `'phaser'` games

- [ ] Add an entry to `GAMES` with `type: 'phaser'` and `phaserScene`:

```typescript
{
  id:               'malware-maze',
  title:            'Malware Maze',
  description:      'Navigate the network and quarantine threats before they spread.',
  type:             'phaser',
  thumbnail:        '/images/games/malware-maze.webp',
  category:         'Malware',
  difficulty:       3,
  maxScore:         1000,
  estimatedMinutes: 15,
  phaserScene:      '@/games/malware-maze/index',
  active:           true,
  icon:             '🦠',
},
```

- [ ] Create `src/games/malware-maze/index.ts` — export a default `Phaser.Scene` subclass.
- [ ] Drop assets into `public/games/malware-maze/assets/`.
- [ ] Run `npm run sync:games`.
- [ ] Add a thumbnail at `public/images/games/malware-maze.webp`.
- [ ] Test at `/play/malware-maze`.

### For `'scorm'` games

- [ ] Add an entry to `GAMES` with `type: 'scorm'`:

```typescript
{
  id:               'insider-threat-101',
  title:            'Insider Threat 101',
  description:      'Identify insider threat indicators in realistic workplace scenarios.',
  type:             'scorm',
  thumbnail:        '/images/games/insider-threat-101.webp',
  category:         'Insider Threat',
  difficulty:       2,
  maxScore:         200,
  estimatedMinutes: 20,
  scormPath:        'index.html',   // relative to public/games/insider-threat-101/
  active:           true,
  icon:             '🕵️',
},
```

- [ ] Drop the SCORM package into `public/games/insider-threat-101/`.
- [ ] Run `npm run sync:games`.
- [ ] Add a thumbnail at `public/images/games/insider-threat-101.webp`.
- [ ] Test at `/play/insider-threat-101`.

---

## `GameConfig` Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique URL slug. Must match the DB row id. No spaces, lowercase-kebab. |
| `title` | `string` | ✅ | Display name shown in the library card. |
| `description` | `string` | ✅ | Short description (1–2 sentences) for the library card. |
| `type` | `'phaser'│'iframe'│'scorm'` | ✅ | Determines which component renders at `/play/[id]`. |
| `thumbnail` | `string` | — | Public path to the card image, e.g. `/images/games/<id>.webp`. |
| `category` | `string` | ✅ | Display category, e.g. `'Security Awareness'`. |
| `difficulty` | `1│2│3` | ✅ | 1 = Easy, 2 = Medium, 3 = Hard. |
| `maxScore` | `number` | ✅ | Points for a perfect run. Shown on the card and stored in the DB. |
| `estimatedMinutes` | `number` | ✅ | Rough play time in minutes, shown on the card. |
| `phaserScene` | `string` | type='phaser' | Module import path for the Phaser scene, e.g. `'@/games/<id>/index'`. |
| `iframeUrl` | `string` | type='iframe' | Public URL of the iframe entry point, e.g. `'/games/<id>/index.html'`. |
| `scormPath` | `string` | type='scorm' | Relative path from `public/games/<id>/` to the SCORM entry. Defaults to `index.html`. |
| `active` | `boolean` | ✅ | `false` hides the game from the library and makes `/play/<id>` return 404. |
| `icon` | `string` | — | Emoji shown on the library card. Falls back to 🎮 when omitted. |
| `href` | `string` | — | Override the play URL. Use only for games with bespoke result pages. Defaults to `/play/<id>`. |

---

## Pre-Launch Checklist

Before flipping `active: true`, verify:

- [ ] **Config entry** — `id`, `title`, `type`, `difficulty`, `maxScore`, and `estimatedMinutes` are all set correctly.
- [ ] **Files in place** — game bundle exists at the correct public or src path (see folder conventions above).
- [ ] **DB in sync** — `npm run sync:games` ran without errors after the last config change.
- [ ] **Thumbnail exists** — `public/images/games/<id>.webp` is present; the card falls back gracefully if it's missing.
- [ ] **Play route loads** — navigating to `/play/<id>` renders the game without console errors.
- [ ] **GAME_COMPLETE fires** — complete (or lose) the game and confirm the API call to `/api/game/result` succeeds in the network tab.
- [ ] **Library card correct** — visit `/games`, confirm the card shows the right difficulty badge, points, and estimated time.
- [ ] **Auth gate enforced** — opening `/play/<id>` while logged out redirects to login (middleware handles this automatically).

---

## Troubleshooting

### Game doesn't appear in the library
- Check `active: true` is set in `games.config.ts`.
- Confirm there are no TypeScript errors in the config file (`npm run build`).

### `/play/<id>` returns 404
- Confirm the `id` in config exactly matches the URL slug.
- Confirm `active: true`.
- If you added a custom `href`, `/play/<id>` won't be reached — that's intentional.

### Iframe shows a blank page
- Open DevTools → Console. Check for mixed-content or CSP errors.
- Confirm `iframeUrl` starts with `/` (relative to public root) and the file exists in `public/`.
- Verify the game's `index.html` loads correctly when visited directly (e.g. `http://localhost:3000/games/<id>/index.html`).

### Iframe game CORS / postMessage not received
- The iframe must be **same-origin** for `postMessage` to be accepted by `IframeGame.tsx` (it filters `event.origin !== window.location.origin`).
- If the game is hosted on a different domain, you'll need a dedicated page with a relaxed origin check and CORS headers configured in `next.config.ts`.

### DB sync fails with "relation games does not exist"
- The migration `supabase/migrations/20260518000000_game_registry.sql` hasn't been applied yet. Run it via the Supabase dashboard SQL editor or the Supabase CLI (`supabase db push`).

### Phaser scene not loading
- Confirm `src/games/<id>/index.ts` exists and has a `default` export of a `Phaser.Scene` subclass.
- Check the browser console for the dynamic import error — the path must resolve correctly.
- `PhaserGame.tsx` reads `window.Phaser` by default. If Phaser is installed as an npm package, switch to the `await import('phaser')` approach (commented in the component).

### `npm run sync:games` exits with "missing environment variables"
- Make sure `.env.local` exists at the project root and contains:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```
- `.env.local` is gitignored — never commit secrets to version control.

### The wrong game data shows after updating config
- The config is imported at build time by `games/page.tsx`.
  In development, hot-reload picks it up automatically.
  In production, you must redeploy and re-run `npm run sync:games`.
