import { useGameStore } from '@/lib/stores/useGameStore';
import type { ActiveCallState, GamePhase, ScoreState, TimelineEvent } from '@/types/game';

/**
 * serializeState()/restoreState() for Operation Human Firewall.
 *
 * This is the reference implementation of the GameSaveAdapter contract
 * (see src/lib/game-save/types.ts) for a native, in-app (Zustand-backed)
 * game. Other native games can follow this same pattern; iframe-hosted
 * games (phishing, vishing, 3d-office, cyberforge, carnival-shooter)
 * instead need to emit/consume postMessage events — see IframeGame.tsx.
 *
 * useGameStore.getState()/setState() are used directly (zustand exposes
 * these as static methods on the hook) rather than adding save-specific
 * actions to the store itself — keeps the store's public API focused on
 * gameplay, and the save concern fully contained in this adapter.
 */

export const HUMAN_FIREWALL_SCHEMA_VERSION = 1;

export interface HumanFirewallSaveState {
  sessionId: string;
  phase: GamePhase;
  call: ActiveCallState;
  score: ScoreState;
  timeline: TimelineEvent[];
}

export function serializeHumanFirewallState(): HumanFirewallSaveState {
  const { sessionId, phase, call, score, timeline } = useGameStore.getState();
  return { sessionId, phase, call, score, timeline };
}

export function restoreHumanFirewallState(state: HumanFirewallSaveState): void {
  useGameStore.setState({
    sessionId: state.sessionId,
    phase: state.phase,
    call: state.call,
    score: state.score,
    timeline: state.timeline,
  });
}

export function describeHumanFirewallState(state: HumanFirewallSaveState) {
  return {
    level: state.call.scenarioId ?? undefined,
    score: state.score.totalXP,
    elapsedSeconds: state.call.elapsedSeconds,
  };
}

/** A save is only meaningful mid-call — don't offer to resume a finished/idle session. */
export function isResumableHumanFirewallState(state: HumanFirewallSaveState): boolean {
  return (
    !!state.call.scenarioId &&
    state.call.status !== 'ended' &&
    state.phase !== 'results' &&
    state.phase !== 'lobby'
  );
}
