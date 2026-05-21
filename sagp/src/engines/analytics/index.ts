import { createServiceRoleClient } from '@/lib/supabase/server';
import { computeRiskScore } from './risk-score';
import { classifyPersonaFromDb } from './persona';

export async function processGameEvents(sessionId: string): Promise<void> {
  const client = await createServiceRoleClient();

  // Get session info
  const { data: session } = await client
    .from('game_sessions')
    .select('user_id, org_id')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  // Compute risk score (v2 engine — produces RiskScoreExplanation for audit)
  await computeRiskScore(session.user_id, session.org_id);

  // Classify behavioral persona and fire auto-remediation hooks
  await classifyPersonaFromDb(session.user_id, session.org_id);
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
