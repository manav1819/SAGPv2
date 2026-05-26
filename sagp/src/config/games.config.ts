/**
 * games.config.ts — Central game registry
 *
 * Two-layer system:
 *  1. This file (config layer) — the source of truth for the application.
 *     Maps 1-to-1 with rows in the `games` DB table (kept in sync by
 *     `npm run sync:games`).
 *  2. Filesystem layer — game files live in:
 *       - public/games/<id>/          for iframe / SCORM games (self-contained)
 *       - src/games/<id>/index.ts     for native Phaser scenes (TS class)
 *         └ assets still in public/games/<id>/assets/
 *
 * See ADDING_GAMES.md for the full step-by-step guide.
 */

// ── Interface ──────────────────────────────────────────────────────────────────

export interface GameConfig {
  /** Unique URL-safe slug.  Must match the `id` column in the games table. */
  id: string;

  title: string;
  description: string;

  /**
   * Rendering strategy:
   *   'phaser'  — native Phaser 3 scene living in src/games/<id>/index.ts
   *   'iframe'  — self-contained HTML bundle served from public/games/<id>/
   *   'scorm'   — SCORM 1.2 / 2004 package served from public/games/<id>/
   */
  type: 'phaser' | 'iframe' | 'scorm';

  /** Path relative to the public root, e.g. /images/games/phishing.webp */
  thumbnail?: string;

  /** Display category shown in the game library card */
  category: string;

  /** 1 = Easy  |  2 = Medium  |  3 = Hard */
  difficulty: 1 | 2 | 3;

  /** Points available for a perfect run (used for display + DB sync) */
  maxScore: number;

  /** Rough play time shown in the card */
  estimatedMinutes: number;

  // ── Type-specific fields (only one should be set) ────────────────────────

  /**
   * type='phaser': import path for the Phaser scene, e.g.
   *   '@/games/password-defender/index'
   * The dynamic route will `await import(phaserScene)` and boot the game.
   */
  phaserScene?: string;

  /**
   * type='iframe': public URL of the game entry point, e.g.
   *   '/games/social-eng-sim/index.html'
   * playerName + sessionRef query params are appended automatically.
   */
  iframeUrl?: string;

  /**
   * type='scorm': path to the SCORM manifest relative to public/games/<id>/
   * Defaults to 'index.html' when omitted.
   */
  scormPath?: string;

  // ── Registry control ──────────────────────────────────────────────────────

  /** When false the game is hidden from the library and /play/<id> 404s */
  active: boolean;

  /**
   * Optional emoji icon shown on the library card.
   * Falls back to a generic 🎮 when omitted.
   */
  icon?: string;

  /**
   * Override the play URL used by the game library.
   * When omitted, defaults to /play/<id> (the generic dynamic route).
   *
   * Use this only for games that have a bespoke page with custom
   * result-saving or certificate logic (e.g. the phishing simulator).
   */
  href?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

/** Returns the play URL for a game — custom href or the generic /play/<id> route. */
export function gameHref(game: GameConfig): string {
  return game.href ?? `/play/${game.id}`;
}

// ── Registry ───────────────────────────────────────────────────────────────────
//
// Add new games here.  Run `npm run sync:games` afterwards to upsert them
// into the database.  See ADDING_GAMES.md for the full checklist.

export const GAMES: GameConfig[] = [
  {
    id: 'phishing',
    title: 'Phishing Simulator',
    description:
      'Can you spot the phishing emails? Test your instincts against 10 real-world email scenarios. Each correct identification keeps you in the game — one wrong move costs a life.',
    type: 'iframe',
    thumbnail: '/phishing-game/thumbnail.png',
    category: 'Security Awareness',
    difficulty: 2,
    maxScore: 500,
    estimatedMinutes: 5,
    iframeUrl: '/phishing-game/index.html',
    active: true,
    icon: '🎣',
    // Keep routing to the dedicated page — it handles result-saving and
    // the completion certificate.  Remove this override once the generic
    // IframeGame component is wired to /api/game/phishing/complete.
    href: '/game/phishing',
  },
  {
    id: 'vishing',
    title: 'Vishing Simulator',
    description:
      'Can you spot the vishing calls? Test your instincts against 10 real-world call scenarios. Each correct identification keeps you in the game — one wrong move costs a life.',
    type: 'iframe',
    thumbnail: '/vishing-game/thumbnail.png',
    category: 'Security Awareness',
    difficulty: 2,
    maxScore: 500,
    estimatedMinutes: 5,
    iframeUrl: '/Social-Engineering/social-engineering-gameV2.html',
    active: true,
    icon: '🎣',
    // Keep routing to the dedicated page — it handles result-saving and
    // the completion certificate.  Remove this override once the generic
    // IframeGame component is wired to /api/game/vishing/complete.
    href: '/game/vishing',
  },
  {
    id: '3d-office',
    title: 'CyberGuard: Office Security',
    description:
      'Navigate a 3D office environment and identify security threats in real time. Spot vulnerabilities, respond to incidents, and protect the organisation before the attackers do.',
    type: 'iframe',
    thumbnail: '/3dGame/thumbnail.png',
    category: 'Threat Detection',
    difficulty: 2,
    maxScore: 1000,
    estimatedMinutes: 10,
    iframeUrl: '/3dGame/index.html',
    active: true,
    icon: '🏢',
  },
  {
    id: 'social-engineering',
    title: "Don't Get Played",
    description:
      'Five branching real-world scenarios — vishing calls, spear-phishing emails, tailgating, USB drops, and help-desk pretexting. Make the call, see the consequence, and learn to spot the manipulator before it is too late.',
    type: 'iframe',
    category: 'Social Engineering',
    difficulty: 2,
    maxScore: 75,
    estimatedMinutes: 7,
    // NOTE: folder name contains spaces — encode the URL or rename the folder
    // to `social-engineering-game` for cleaner routing.
    iframeUrl: '/Social%20engineering%20game/social-engineering-gameV2.html',
    active: true,
    icon: '🎭',
  },
];
