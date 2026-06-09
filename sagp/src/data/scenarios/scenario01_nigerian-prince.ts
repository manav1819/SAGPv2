import type { Scenario } from '@/types/game';

export const scenario01: Scenario = {
  id: 'scenario01',
  title: 'The Nigerian Prince',
  difficulty: 'Easy',
  description: 'A "foreign dignitary" needs your help to transfer millions — and just needs your bank details to get started.',
  attackerPersona: { name: 'Prince Emmanuel Adeyemi', role: 'Foreign Dignitary / Lawyer', callerIdSpoof: '+234-801-555-0142' },
  xpMultiplier: 1.0,
  initialNodeId: 'n01',
  estimatedDurationSecs: 180,
  coverImageKey: 'nigerian-prince',
  tags: ['authority_bias', 'urgency', 'trust_exploitation', 'reciprocity'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Good afternoon! My name is Emmanuel Adeyemi. I am a lawyer representing the estate of the late Prince Kofi of Nigeria. He had $47 million in a dormant account and YOU have been selected as a beneficiary — but we need your banking details to transfer your 40% share before the government seizes it tomorrow.',
      subtitles: [{ start: 0, end: 8, text: 'Good afternoon! I am a lawyer representing Prince Kofi...' }],
      activeTechniques: ['urgency', 'authority_bias', 'trust_exploitation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'tomorrow', techniqueTriggered: 'urgency', xpReward: 75, description: 'Artificial urgency — "before the government seizes it tomorrow" is a classic pressure tactic.' },
        { id: 'c01b', textSegment: 'YOU have been selected', techniqueTriggered: 'trust_exploitation', xpReward: 75, description: '"Selected" implies a personal relationship that doesn\'t exist.' },
      ],
      choices: [
        { id: 'c01_verify', text: 'I\'ll need to verify your identity and contact your firm\'s switchboard directly.', nextNodeId: 'n02_verify', scoreModifiers: { verification: 15, decision: 10 }, xpReward: 100, securityHint: 'Always verify via independent channels.' },
        { id: 'c01_info', text: 'This sounds interesting — tell me more about this arrangement.', nextNodeId: 'n02_engage', scoreModifiers: { threatDetection: -10 }, penaltyXp: 50 },
        { id: 'c01_hang', text: '[End call immediately]', nextNodeId: 'n_end_success', scoreModifiers: { decision: 20, threatDetection: 15 }, xpReward: 150 },
      ],
    },
    n02_verify: {
      id: 'n02_verify', speaker: 'attacker',
      text: 'Verify? There is no time for that! The window closes in 24 hours. I have called 50 other people and only YOU are receiving this offer today. Don\'t you want your $18.8 million?',
      subtitles: [{ start: 0, end: 6, text: 'No time! The window closes in 24 hours...' }],
      activeTechniques: ['urgency', 'scarcity', 'pressure_tactics'],
      hiddenClues: [{ id: 'c02a', textSegment: 'called 50 other people', techniqueTriggered: 'scarcity', xpReward: 75, description: 'Scarcity tactic — creating competition to override rational thinking.' }],
      choices: [
        { id: 'c02v_report', text: 'This is a scam. I\'m reporting this call to our security team.', nextNodeId: 'n_report', scoreModifiers: { decision: 25, threatDetection: 20 }, xpReward: 200 },
        { id: 'c02v_hang', text: '[End call]', nextNodeId: 'n_end_success', scoreModifiers: { decision: 15 }, xpReward: 150 },
        { id: 'c02v_bank', text: 'Fine, let me get my account number...', nextNodeId: 'n_leak_bank', scoreModifiers: { informationProtection: -40, decision: -30 }, penaltyXp: 500, leakType: 'pii' },
      ],
    },
    n02_engage: {
      id: 'n02_engage', speaker: 'attacker',
      text: 'Wonderful! I just need your full name, bank account number, sort code, and a small processing fee of $500 to unlock the transfer. Once received, $18.8 million will be in your account within 72 hours!',
      subtitles: [{ start: 0, end: 7, text: 'I just need your bank account number and a processing fee...' }],
      activeTechniques: ['reciprocity', 'trust_exploitation'],
      choices: [
        { id: 'c02e_refuse', text: 'I\'m not providing any banking details or paying any fee. This is fraud.', nextNodeId: 'n_report', scoreModifiers: { decision: 20, threatDetection: 15 }, xpReward: 150 },
        { id: 'c02e_leak', text: 'OK, my account number is...', nextNodeId: 'n_leak_bank', scoreModifiers: { informationProtection: -50, decision: -40 }, penaltyXp: 750, leakType: 'pii' },
      ],
    },
    n_leak_bank: {
      id: 'n_leak_bank', speaker: 'system',
      text: '⚠ SECURITY BREACH: Banking information shared with an unverified external caller. This is a textbook advance-fee fraud. Your personal and financial data is now compromised.',
      subtitles: [{ start: 0, end: 4, text: 'SECURITY BREACH — banking details leaked' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end_fail', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_report: {
      id: 'n_report', speaker: 'system',
      text: '✅ Excellent instincts! You correctly identified this as an advance-fee fraud. The call has been logged and forwarded to the security team. Incident report filed.',
      subtitles: [{ start: 0, end: 4, text: 'Incident reported — advance-fee fraud identified' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end_success', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
