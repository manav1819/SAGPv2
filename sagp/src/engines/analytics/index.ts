import { createServiceRoleClient } from '@/lib/supabase/server';
import { computeRiskScore } from './risk-score';
import { classifyPersona } from './persona';

export async function processGameEvents(sessionId: string): Promise<void> {
  const client = await createServiceRoleClient();

  // Get session info
  const { data: session } = await client
    .from('game_sessions')
    .select('user_id, org_id')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  // Compute risk score
  await computeRiskScore(session.user_id, session.org_id);

  // Classify persona
  await classifyPersona(session.user_id, session.org_id);
}

export { computeRiskScore } from './risk-score';
export { classifyPersona } from './persona';
export { computeCompanyScore, getScoreHistory } from './company-score';
export { generateComplianceReport, getCompletionMatrix } from './compliance';
