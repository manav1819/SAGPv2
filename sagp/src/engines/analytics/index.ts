import { createServiceRoleClient } from '@/lib/supabase/server';
import { computeRiskScore } from './risk-score';
import { classifyPersonaFromDb } from './persona';
import { pipelineLog } from '@/lib/logger';
import type { RiskScoreExplanation } from './risk-score';
import type { PersonaResult } from './persona';

export interface ProcessGameEventsResult {
  risk: { explanation: RiskScoreExplanation };
  persona: PersonaResult;
}

export async function processGameEvents(sessionId: string): Promise<ProcessGameEventsResult> {
  const client = await createServiceRoleClient();

  const { data: session, error } = await client
    .from('game_sessions')
    .select('user_id, org_id')
    .eq('id', sessionId)
    .single();

  if (error || !session) throw new Error(`processGameEvents: session not found (${sessionId})`);

  // Compute risk score — returns persisted row + full explanation
  const riskResult = await computeRiskScore(session.user_id, session.org_id);
  pipelineLog({
    stage: 'risk_recalculated',
    sessionId,
    userId: session.user_id,
    orgId: session.org_id,
    data: { total_score: riskResult.explanation.total_score, risk_tier: riskResult.explanation.risk_tier, confidence: riskResult.explanation.confidence },
    formulaVersion: riskResult.explanation.formula_version,
  });

  // Classify behavioral persona and fire auto-remediation hooks
  const personaResult = await classifyPersonaFromDb(session.user_id, session.org_id);
  pipelineLog({
    stage: 'persona_updated',
    sessionId,
    userId: session.user_id,
    orgId: session.org_id,
    data: { persona: personaResult.persona, confidence: personaResult.confidence, drift_delta: personaResult.drift_delta },
  });

  return { risk: { explanation: riskResult.explanation }, persona: personaResult };
}

export {
  computeRiskScore,
  scoreUser,
  classifyRiskTier,
  FORMULA_VERSION,
  WEIGHTS,
  HALF_LIFE_DAYS,
  PHISH_SEVERITY,
  ARM_BASE,
  ARM_MODIFIERS,
  type RiskScoreExplanation,
  type ScoreComponent,
  type RoleContext,
  type PhishingEvent,
  type TrainingEvent,
} from './risk-score';

export {
  classifyPersona,
  classifyPersonaFromDb,
  PERSONA_PLAYBOOK,
  PERSONA_FORMULA_VERSION,
  type PersonaResult,
  type PersonaSignals,
  type RemediationAction,
} from './persona';

export { computeCompanyScore, getScoreHistory } from './company-score';
export { generateComplianceReport, getCompletionMatrix } from './compliance';
