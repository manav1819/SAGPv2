/**
 * SAGP Pipeline Logger
 *
 * Structured JSON logger for the game → score → dashboard event chain.
 * Every stage in the pipeline emits a JSON line to stdout so a SIEM,
 * Datadog, or CloudWatch can ingest it without parsing.
 *
 * Usage:
 *   pipelineLog({ stage: 'game_completed', sessionId, userId, orgId });
 *   pipelineLog({ stage: 'error', sessionId, error: err.message, durationMs });
 */

export type PipelineStage =
  | 'game_completed'        // IframeGame sent GAME_COMPLETE postMessage
  | 'session_persisted'     // game_sessions row inserted
  | 'progress_updated'      // progress row upserted
  | 'gamification_started'  // processSessionCompletion invoked
  | 'points_calculated'
  | 'streak_updated'
  | 'badges_checked'
  | 'leaderboard_updated'
  | 'remediation_logged'
  | 'risk_engine_started'   // processGameEvents invoked
  | 'risk_recalculated'     // computeRiskScore completed
  | 'persona_updated'       // classifyPersonaFromDb completed
  | 'pipeline_complete'     // all stages finished
  | 'error';

export interface PipelineLogEntry {
  stage: PipelineStage;
  sessionId?: string;
  userId?: string;
  orgId?: string;
  gameId?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
  error?: string;
  formulaVersion?: string;
}

/** Emit a structured JSON log line to stdout. */
export function pipelineLog(entry: PipelineLogEntry): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: 'sagp',
    ...entry,
  });
  // Use console.error for errors so they surface in Vercel/Railway log streams
  if (entry.stage === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

/** Wrap an async fn with entry/exit logging and duration measurement. */
export async function withPipelineStage<T>(
  stage: PipelineStage,
  context: Omit<PipelineLogEntry, 'stage' | 'durationMs'>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    pipelineLog({ stage, ...context, durationMs: Date.now() - start });
    return result;
  } catch (err) {
    pipelineLog({
      stage: 'error',
      ...context,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      data: { failedStage: stage },
    });
    throw err;
  }
}
