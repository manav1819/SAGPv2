'use client';

import type { SaveEnvelope } from './types';

/**
 * SaveManager — the single place that knows how to persist/retrieve a
 * game's save state. Supabase (`game_saves` table, via /api/game/save) is
 * the source of truth; localStorage is a synchronous fallback cache so a
 * crashed tab / offline blip doesn't lose the last few seconds of progress.
 *
 * This class holds no per-game logic — games only need to hand it a
 * plain JSON-serialisable `state` object (see GameSaveAdapter in ./types).
 * Consume it via the useGameSave() hook rather than calling it directly
 * from components.
 */
const LOCAL_PREFIX = 'sagp:game-save:';

function localKey(gameId: string): string {
  return `${LOCAL_PREFIX}${gameId}`;
}

function readLocal<TState>(gameId: string): SaveEnvelope<TState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(localKey(gameId));
    return raw ? (JSON.parse(raw) as SaveEnvelope<TState>) : null;
  } catch {
    return null;
  }
}

function writeLocal<TState>(envelope: SaveEnvelope<TState>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(localKey(envelope.gameId), JSON.stringify(envelope));
  } catch {
    // Storage full/unavailable (private browsing) — Supabase remains authoritative.
  }
}

function clearLocal(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(localKey(gameId));
  } catch {
    // ignore
  }
}

async function fetchRemote<TState>(gameId: string): Promise<SaveEnvelope<TState> | null> {
  try {
    const res = await fetch(`/api/game/save?gameId=${encodeURIComponent(gameId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.save) return null;
    const row = body.save as {
      state: TState;
      schema_version: number;
      session_ref: string | null;
      level: string | null;
      score: number | null;
      elapsed_seconds: number;
      updated_at: string;
    };
    return {
      gameId,
      state: row.state,
      schemaVersion: row.schema_version,
      sessionRef: row.session_ref,
      level: row.level,
      score: row.score,
      elapsedSeconds: row.elapsed_seconds,
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

export const SaveManager = {
  /**
   * Resolve the current save for a game. Supabase is authoritative: if the
   * server says there's no save, any stale local cache is discarded (e.g.
   * an admin/support action cleared it, or the user continued on another
   * device and finished).
   */
  async load<TState>(gameId: string): Promise<SaveEnvelope<TState> | null> {
    const remote = await fetchRemote<TState>(gameId);
    if (remote) {
      writeLocal(remote);
      return remote;
    }
    clearLocal(gameId);
    return null;
  },

  /** Synchronous local-only read, for instant UI while the network check runs. */
  peekLocal<TState>(gameId: string): SaveEnvelope<TState> | null {
    return readLocal<TState>(gameId);
  },

  /**
   * Persist a snapshot. Always writes to localStorage first (instant,
   * survives a network blip), then pushes to Supabase.
   *
   * `beacon: true` uses navigator.sendBeacon for the unload-safe path —
   * required because a normal fetch can be cancelled mid-flight when the
   * page is torn down.
   */
  async save<TState>(
    envelope: Omit<SaveEnvelope<TState>, 'updatedAt'>,
    opts?: { beacon?: boolean }
  ): Promise<void> {
    const full: SaveEnvelope<TState> = { ...envelope, updatedAt: new Date().toISOString() };
    writeLocal(full);

    const payload = JSON.stringify({
      gameId: full.gameId,
      state: full.state,
      schemaVersion: full.schemaVersion,
      sessionRef: full.sessionRef ?? null,
      level: full.level ?? null,
      score: full.score ?? null,
      elapsedSeconds: full.elapsedSeconds ?? 0,
    });

    if (opts?.beacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/game/save', blob);
      return;
    }

    try {
      await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: opts?.beacon,
      });
    } catch {
      // Offline — localStorage already has the latest snapshot; the next
      // successful autosave tick will reconcile Supabase.
    }
  },

  /** "Start New Game" — clears both the server row and the local cache. */
  async clear(gameId: string): Promise<void> {
    clearLocal(gameId);
    try {
      await fetch(`/api/game/save?gameId=${encodeURIComponent(gameId)}`, { method: 'DELETE' });
    } catch {
      // Best-effort; if this fails the next successful save() will
      // overwrite the stale row anyway (it's keyed by user+game, not id).
    }
  },
};
