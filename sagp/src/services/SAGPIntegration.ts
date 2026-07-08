/**
 * SAGP Integration Layer — Human Firewall result submission.
 *
 * submitFullPayload is the single entry-point called by the results page.
 * It converts the in-game metrics payload into the format expected by
 * POST /api/game/result, which runs the full engine pipeline:
 *
 *   game_sessions → progress → gamification (points, streak, badges,
 *   leaderboard) → risk score recalculation → persona classification
 *
 * The individual helpers below are kept for potential future use but are
 * no longer stubs — all persistence flows through the shared API route.
 */

import type { SAGPMetricsPayload } from '@/types/game';

/**
 * Submit a completed Human Firewall scenario to the shared game result API.
 * This is the only function that must be called at the end of every scenario.
 */
export async function submitFullPayload(payload: SAGPMetricsPayload): Promise<void> {
  const result = {
    score:    payload.totalXP,
    maxScore: 12000,
    passed:   payload.accuracyPercent >= 50,
    // Surface extra metrics in game_state for analytics engines
    accuracyPercent:     payload.accuracyPercent,
    durationSeconds:     payload.durationSeconds,
    threatIndicators:    payload.threatIndicators,
    achievementsUnlocked: payload.achievementsUnlocked,
    scenarioId:          payload.scenarioId,
  };

  const res = await fetch('/api/game/result', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameId:     'human-firewall',
      sessionRef: payload.sessionId,
      result,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `[SAGPIntegration] submitFullPayload failed: ${body.error ?? `HTTP ${res.status}`}`
    );
  }
}
