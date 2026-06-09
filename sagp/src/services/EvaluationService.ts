import type { EvaluationRequest, EvaluationResult, InformationLeakType, SocialEngineeringTechnique } from '@/types/game';
import { getScenario } from '@/data/scenarios';

// ---------------------------------------------------------------------------
// Keyword Maps for deterministic fallback evaluation
// ---------------------------------------------------------------------------
const LEAK_KEYWORDS: Record<InformationLeakType, string[]> = {
  username: ['username', 'user name', 'login', 'email address', 'account name'],
  pii: ['date of birth', 'dob', 'national insurance', 'ni number', 'address', 'phone number', 'sort code', 'account number'],
  mfa_code: ['mfa', 'authenticator code', 'one time', 'otp', 'approve', 'verification code', 'push notification'],
  core_password: ['password', 'passphrase', 'pin', 'secret'],
  internal_system: ['internal ip', 'server name', 'vpn', 'active directory', 'domain', 'admin portal'],
  employee_info: ['employee number', 'staff id', 'manager name', 'department', 'badge number'],
  vendor_credentials: ['vendor account', 'supplier bank', 'payment details', 'sort code', 'invoice'],
};

const TECHNIQUE_KEYWORDS: Record<SocialEngineeringTechnique, string[]> = {
  authority_bias: ['ceo', 'director', 'board', 'microsoft', 'it department', 'government', 'police', 'official', 'authorised'],
  urgency: ['right now', 'immediately', 'urgent', 'deadline', 'expires', 'time sensitive', 'quickly', 'today only'],
  fear: ['locked out', 'breach', 'compromised', 'suspended', 'terminated', 'legal action', 'malware', 'virus'],
  scarcity: ['only you', 'one time', 'limited window', 'last chance', 'selected'],
  reciprocity: ['favour', 'help you', 'reward', 'bonus', 'cash back', 'reimburse'],
  trust_exploitation: ['long relationship', 'trusted partner', 'we go way back', 'you know me'],
  familiarity: ['colleague', 'same team', 'floor', 'office', 'we met', 'i know you'],
  curiosity: ['secret deal', 'confidential', 'surprise', 'special offer', 'you\'ve been selected'],
  pressure_tactics: ['your choice', 'your fault', 'don\'t you trust', 'refusing a direct order', 'no time'],
  impersonation: ['calling from it', 'i\'m the cfo', 'from microsoft', 'from the bank', 'from hr'],
};

// ---------------------------------------------------------------------------
// Deterministic rule-based evaluator
// ---------------------------------------------------------------------------
function ruleBasedEvaluate(req: EvaluationRequest): EvaluationResult {
  const scenario = getScenario(req.scenarioId);
  const node = scenario?.nodes[req.nodeId];
  const input = req.playerInput.toLowerCase();

  // If a preset choice was selected, use its data directly
  if (req.choiceId && node?.choices) {
    const choice = node.choices.find((c) => c.id === req.choiceId);
    if (choice) {
      const detectedLeaks: InformationLeakType[] = choice.leakType ? [choice.leakType] : [];
      return {
        matchedChoiceId: choice.id,
        confidence: 1.0,
        scoreModifiers: choice.scoreModifiers,
        xpDelta: choice.xpReward ?? choice.penaltyXp ?? 0,
        feedback: choice.penaltyXp ? 'That response compromised your security posture.' : 'Good decision.',
        detectedLeaks,
        detectedTechniques: [],
        nextNodeId: choice.nextNodeId,
      };
    }
  }

  // Free-text / voice matching — find best keyword match against available choices
  const detectedLeaks = (Object.keys(LEAK_KEYWORDS) as InformationLeakType[]).filter(
    (type) => LEAK_KEYWORDS[type].some((kw) => input.includes(kw)),
  );

  const detectedTechniques = (Object.keys(TECHNIQUE_KEYWORDS) as SocialEngineeringTechnique[]).filter(
    (tech) => TECHNIQUE_KEYWORDS[tech].some((kw) => input.includes(kw)),
  );

  // Try to match a choice by keyword
  if (node?.choices) {
    const ranked = node.choices
      .map((choice) => {
        const keywords = choice.matchKeywords ?? choice.text.toLowerCase().split(/\s+/);
        const score = keywords.filter((kw) => input.includes(kw)).length;
        return { choice, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 0) {
      const { choice } = ranked[0];
      return {
        matchedChoiceId: choice.id,
        confidence: Math.min(ranked[0].score / 3, 1),
        scoreModifiers: choice.scoreModifiers,
        xpDelta: choice.xpReward ?? choice.penaltyXp ?? 0,
        feedback: 'Response matched a known pattern.',
        detectedLeaks,
        detectedTechniques,
        nextNodeId: choice.nextNodeId,
      };
    }
  }

  // No match — neutral result, stay on same node
  return {
    matchedChoiceId: null,
    confidence: 0,
    scoreModifiers: {},
    xpDelta: 0,
    feedback: 'Could not match your response. Please choose from the options or try a clearer phrasing.',
    detectedLeaks,
    detectedTechniques,
    nextNodeId: req.nodeId,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function evaluateResponse(req: EvaluationRequest): Promise<EvaluationResult> {
  // In production, swap this for an LLM-backed route call:
  // const res = await fetch('/api/game/evaluate', { method: 'POST', body: JSON.stringify(req) });
  // return res.json();
  return ruleBasedEvaluate(req);
}
