/**
 * SAGP Integration Layer — mock implementations mapping to SAGP's metrics SDK.
 * Replace the console.log bodies with real Supabase/API calls in production.
 */

import type { SAGPMetricsPayload, AchievementId, SocialEngineeringTechnique, ScenarioResult } from '@/types/game';

export async function saveScenarioResult(result: ScenarioResult, userId: string): Promise<void> {
  console.log('[SAGP] saveScenarioResult', { userId, scenarioId: result.scenarioId, xp: result.totalXP });
  // TODO: await supabase.from('game_results').insert({ user_id: userId, ...result });
}

export async function saveVoiceTranscript(transcript: string, sessionId: string, nodeId: string): Promise<void> {
  console.log('[SAGP] saveVoiceTranscript', { sessionId, nodeId, length: transcript.length });
  // TODO: store transcript for compliance / review
}

export async function saveThreatIndicators(indicators: SocialEngineeringTechnique[], sessionId: string): Promise<void> {
  console.log('[SAGP] saveThreatIndicators', { sessionId, indicators });
}

export async function saveAccuracy(accuracyPercent: number, sessionId: string): Promise<void> {
  console.log('[SAGP] saveAccuracy', { sessionId, accuracyPercent });
}

export async function saveTimeSpent(durationSeconds: number, scenarioId: string, userId: string): Promise<void> {
  console.log('[SAGP] saveTimeSpent', { userId, scenarioId, durationSeconds });
}

export async function saveAchievements(achievements: AchievementId[], userId: string): Promise<void> {
  console.log('[SAGP] saveAchievements', { userId, achievements });
  // TODO: trigger achievement badge notifications on the platform
}

export async function saveXP(xp: number, userId: string, source: string): Promise<void> {
  console.log('[SAGP] saveXP', { userId, xp, source });
  // TODO: await supabase.rpc('award_xp', { p_user_id: userId, p_amount: xp, p_source: source });
}

export async function submitLeaderboardScore(score: number, userId: string, scenarioId: string): Promise<void> {
  console.log('[SAGP] submitLeaderboardScore', { userId, scenarioId, score });
  // TODO: upsert leaderboard entry
}

export async function submitFullPayload(payload: SAGPMetricsPayload): Promise<void> {
  await Promise.allSettled([
    saveAccuracy(payload.accuracyPercent, payload.sessionId),
    saveTimeSpent(payload.durationSeconds, payload.scenarioId, payload.userId),
    saveXP(payload.totalXP, payload.userId, `scenario:${payload.scenarioId}`),
    saveThreatIndicators(payload.threatIndicators, payload.sessionId),
    submitLeaderboardScore(payload.leaderboardScore, payload.userId, payload.scenarioId),
    payload.achievementsUnlocked.length > 0 && saveAchievements(payload.achievementsUnlocked, payload.userId),
  ]);
}
