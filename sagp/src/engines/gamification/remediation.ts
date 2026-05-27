import { createServiceRoleClient } from '@/lib/supabase/server';
import type { TimeBucket, QuizResult, RemediationLog } from '@/types/database';

interface SessionClassification {
  timeBucket: TimeBucket;
  quizResult: QuizResult;
}

export function classifySession(
  timeTaken: number,
  estimatedMins: number,
  passed: boolean
): SessionClassification {
  const estimatedSeconds = estimatedMins * 60;
  const threshold60Pct = estimatedSeconds * 0.6;
  const threshold100Pct = estimatedSeconds;

  let timeBucket: TimeBucket;
  if (timeTaken < threshold60Pct) {
    timeBucket = 'less';
  } else if (timeTaken < threshold100Pct) {
    timeBucket = 'medium';
  } else {
    timeBucket = 'more';
  }

  const quizResult: QuizResult = passed ? 'pass' : 'fail';

  return { timeBucket, quizResult };
}

// Remediation Matrix: defines actions based on time bucket and quiz result
interface RemediationMatrix {
  [key: string]: {
    [key: string]: (attemptNumber: number) => string;
  };
}

const remediationMatrix: RemediationMatrix = {
  less: {
    pass: (attempt) => {
      if (attempt === 1) return 'no_action';
      return 'no_action';
    },
    fail: (attempt) => {
      if (attempt === 1) return 'assign_full_module';
      if (attempt === 2) return 'assign_detailed_module';
      return 'assign_interactive_module';
    },
  },
  medium: {
    pass: (attempt) => {
      if (attempt === 1) return 'no_action';
      return 'no_action';
    },
    fail: (attempt) => {
      if (attempt === 1) return 'assign_full_module';
      if (attempt === 2) return 'assign_review_module';
      return 'assign_reinforcement';
    },
  },
  more: {
    pass: (attempt) => {
      if (attempt === 1) return 'assign_optimization_tips';
      return 'no_action';
    },
    fail: (attempt) => {
      if (attempt === 1) return 'assign_foundational_module';
      if (attempt === 2) return 'assign_step_by_step_module';
      return 'escalate_to_manager';
    },
  },
};

export function getRemediationAction(
  timeBucket: TimeBucket,
  quizResult: QuizResult,
  attemptNumber: number
): string {
  const actions = remediationMatrix[timeBucket];
  if (!actions) return 'no_action';

  const actionFn = actions[quizResult];
  if (!actionFn) return 'no_action';

  return actionFn(attemptNumber);
}

export async function logRemediation(
  sessionId: string,
  action: string
): Promise<RemediationLog> {
  const client = await createServiceRoleClient();

  // Get session info
  const { data: session } = await client
    .from('game_sessions')
    .select('user_id, org_id, attempt_number, time_bucket, passed')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  const quizResult = session.passed ? 'pass' : 'fail';

  // Get remediation module if needed
  let remediationModuleId = null;
  if (action !== 'no_action' && action !== 'escalate_to_manager') {
    // Find a remediation module based on action
    const { data: remediationModules } = await client
      .from('modules')
      .select('id')
      .eq('org_id', session.org_id)
      .ilike('title', `%${action}%`)
      .limit(1);

    if (remediationModules && remediationModules.length > 0) {
      remediationModuleId = remediationModules[0].id;
    }
  }

  // FIX: table is 'remediation_log' (singular). Previous name 'remediation_logs'
  // caused all remediation inserts to silently fail with a 404-equivalent from PostgREST.
  const { data: log, error } = await client
    .from('remediation_log')
    .insert({
      session_id: sessionId,
      user_id: session.user_id,
      org_id: session.org_id,
      time_bucket: session.time_bucket || 'medium',
      quiz_result: quizResult,
      action_taken: action,
      remediation_module_id: remediationModuleId,
      attempt_number: session.attempt_number || 1,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return log;
}
