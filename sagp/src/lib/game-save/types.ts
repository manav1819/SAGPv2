/**
 * Shared types for the generic game save/resume system.
 * See src/lib/game-save/SaveManager.ts and src/lib/hooks/useGameSave.ts.
 */

/** Envelope stored both in localStorage and in the `game_saves` table. */
export interface SaveEnvelope<TState = Record<string, unknown>> {
  gameId: string;
  state: TState;
  /** Bump when a game's serialized shape changes; restoreState() should
   *  reject/migrate saves with an older schemaVersion instead of crashing. */
  schemaVersion: number;
  sessionRef?: string | null;
  /** Denormalised for the "Continue?" prompt — avoid parsing `state` there. */
  level?: string | null;
  score?: number | null;
  elapsedSeconds?: number;
  updatedAt: string;
}

/**
 * Contract a game provides to plug into the shared save system.
 *
 * For native (in-app) games this is implemented directly against a store
 * (see human-firewall's src/lib/game-save/human-firewall-adapter.ts).
 *
 * For iframe-hosted games the same shape is fulfilled indirectly: the
 * iframe's internal engine calls serializeState() on its own timers/events
 * and posts the result to the parent via postMessage
 * ({ type: 'SAGP_SAVE_STATE', payload }); IframeGame.tsx forwards it into
 * SaveManager. restoreState() is delivered back the same way
 * ({ type: 'SAGP_RESTORE_STATE', payload }) once the iframe signals it's
 * ready ({ type: 'SAGP_GAME_READY' }). See IframeGame.tsx for the bridge.
 */
export interface GameSaveAdapter<TState = Record<string, unknown>> {
  gameId: string;
  schemaVersion: number;
  /** Snapshot the current runtime state into a JSON-serialisable object. */
  serializeState: () => TState;
  /** Apply a previously saved snapshot back into the runtime. */
  restoreState: (state: TState) => void;
  /** Optional denormalised fields surfaced on the "Continue?" prompt. */
  describe?: (state: TState) => { level?: string; score?: number; elapsedSeconds?: number };
}
