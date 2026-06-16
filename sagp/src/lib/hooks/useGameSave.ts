'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SaveManager } from '@/lib/game-save/SaveManager';
import type { SaveEnvelope } from '@/lib/game-save/types';

export type ResumeDecision = 'pending' | 'continue' | 'new';

export interface UseGameSaveOptions<TState> {
  /** Matches games.id / games.config.ts (e.g. 'human-firewall', 'carnival-shooter'). */
  gameId: string;
  /** Bump when your serialized `state` shape changes. */
  schemaVersion: number;
  /** Apply a saved snapshot back into the game's runtime (called on "Continue"). */
  restoreState: (state: TState) => void;
  /** Snapshot the current runtime into a JSON-serialisable object (called on every autosave tick). */
  serializeState: () => TState;
  /** Optional denormalised summary surfaced on the resume prompt. */
  describe?: (state: TState) => { level?: string; score?: number; elapsedSeconds?: number };
  sessionRef?: string;
  /** Default 15s. */
  autosaveIntervalMs?: number;
  /** Set false to disable checking/saving entirely (e.g. on a results screen). */
  enabled?: boolean;
  /**
   * Skip the on-mount existing-save check and resume prompt, and start
   * autosaving immediately as if "Continue" had already been chosen.
   *
   * Use this on the actual gameplay screen when the resume decision was
   * already made one level up (e.g. the game's lobby/menu called
   * useGameSave() there, showed <ResumeGameDialog>, and restored state into
   * a store that persists across the client-side route change). Checking
   * again here would both re-prompt the player and race the lobby's restore.
   */
  skipInitialCheck?: boolean;
}

/**
 * useGameSave — the shared hook every game wires up to get save/resume for
 * free. Games only implement serializeState()/restoreState(); this hook
 * owns:
 *   - checking Supabase (+ localStorage cache) for an existing save on mount
 *   - exposing `promptResume` so the caller can render <ResumeGameDialog />
 *   - periodic autosave once the player has chosen Continue/Start New
 *   - best-effort save on tab-hide / page unload
 *
 * Call `saveNow()` yourself right after level transitions or other
 * significant progress events — the interval alone only covers "every few
 * seconds", not "the moment something important happened".
 */
export function useGameSave<TState>({
  gameId,
  schemaVersion,
  restoreState,
  serializeState,
  describe,
  sessionRef,
  autosaveIntervalMs = 15000,
  enabled = true,
  skipInitialCheck = false,
}: UseGameSaveOptions<TState>) {
  const [isChecking, setIsChecking] = useState(enabled && !skipInitialCheck);
  const [existingSave, setExistingSave] = useState<SaveEnvelope<TState> | null>(null);
  const [decision, setDecision] = useState<ResumeDecision>(skipInitialCheck ? 'continue' : 'pending');

  // Keep the latest serializeState/describe without re-subscribing effects.
  const serializeRef = useRef(serializeState);
  serializeRef.current = serializeState;
  const describeRef = useRef(describe);
  describeRef.current = describe;

  // 1. Check for an existing save on mount.
  useEffect(() => {
    if (!enabled || skipInitialCheck) {
      setIsChecking(false);
      return;
    }
    let cancelled = false;

    const local = SaveManager.peekLocal<TState>(gameId);
    if (local && !cancelled) setExistingSave(local);

    SaveManager.load<TState>(gameId).then((remote) => {
      if (cancelled) return;
      setExistingSave(remote);
      setIsChecking(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, enabled, skipInitialCheck]);

  const saveNow = useCallback(
    async (opts?: { beacon?: boolean }) => {
      if (!enabled) return;
      const state = serializeRef.current();
      const meta = describeRef.current?.(state);
      await SaveManager.save<TState>(
        {
          gameId,
          state,
          schemaVersion,
          sessionRef,
          level: meta?.level,
          score: meta?.score,
          elapsedSeconds: meta?.elapsedSeconds,
        },
        opts
      );
    },
    [gameId, schemaVersion, sessionRef, enabled]
  );

  const continueGame = useCallback(() => {
    if (existingSave) restoreState(existingSave.state);
    setDecision('continue');
  }, [existingSave, restoreState]);

  const startNewGame = useCallback(async () => {
    await SaveManager.clear(gameId);
    setExistingSave(null);
    setDecision('new');
  }, [gameId]);

  // 2. Periodic autosave — only once the player has made a resume decision,
  //    so we never clobber a real save with a game's default initial state
  //    while the prompt is still on screen.
  useEffect(() => {
    if (!enabled || decision === 'pending') return;
    const interval = setInterval(() => {
      void saveNow();
    }, autosaveIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, decision, autosaveIntervalMs, saveNow]);

  // 3. Best-effort save before the tab is hidden/closed.
  useEffect(() => {
    if (!enabled || decision === 'pending') return;

    const handleBeforeUnload = () => {
      void saveNow({ beacon: true });
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void saveNow({ beacon: true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, decision, saveNow]);

  const promptResume = enabled && !isChecking && decision === 'pending' && existingSave !== null;

  return {
    isChecking,
    existingSave,
    promptResume,
    decision,
    continueGame,
    startNewGame,
    /** Call after level changes / big score jumps for an immediate save. */
    saveNow,
  };
}
