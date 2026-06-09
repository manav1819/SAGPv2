import type { Scenario } from '@/types/game';

export const scenario03: Scenario = {
  id: 'scenario03',
  title: 'Payroll Verification Scam',
  difficulty: 'Medium',
  description: 'An employee urgently needs to update their bank details before payday — but is this really who they claim to be?',
  attackerPersona: { name: 'Sarah Mitchell', role: 'Alleged Senior Developer (impersonation)', callerIdSpoof: 'Internal x4421' },
  xpMultiplier: 1.5,
  initialNodeId: 'n01',
  estimatedDurationSecs: 300,
  coverImageKey: 'payroll-verification',
  tags: ['impersonation', 'urgency', 'authority_bias', 'familiarity'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Hi, this is Sarah Mitchell from the Dev team — you should have me on your system. I just got married and changed my surname and bank account. Payroll runs tomorrow and I desperately need to update my direct deposit details today or I won\'t get paid. Can you update it now? The new sort code is 20-44-98.',
      subtitles: [{ start: 0, end: 9, text: 'Hi, Sarah Mitchell — just got married, need to update bank details before payroll...' }],
      activeTechniques: ['urgency', 'familiarity', 'impersonation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'you should have me on your system', techniqueTriggered: 'familiarity', xpReward: 75, description: 'Assumes prior familiarity to bypass verification.' },
        { id: 'c01b', textSegment: 'Payroll runs tomorrow', techniqueTriggered: 'urgency', xpReward: 75, description: 'Time-pressure tactic to prevent proper verification.' },
      ],
      choices: [
        { id: 'c01_verify', text: 'I need to verify your identity first. Can you confirm your employee ID and answer our standard security questions?', nextNodeId: 'n02_verify', scoreModifiers: { verification: 20, decision: 15 }, xpReward: 100 },
        { id: 'c01_callback', text: 'I\'ll need to call you back on your work extension to confirm before making any changes.', nextNodeId: 'n02_callback', scoreModifiers: { verification: 25, decision: 20 }, xpReward: 100 },
        { id: 'c01_change', text: 'Sure, let me pull up your record now.', nextNodeId: 'n02_change', scoreModifiers: { verification: -20, decision: -15 }, penaltyXp: 150 },
      ],
    },
    n02_verify: {
      id: 'n02_verify', speaker: 'attacker',
      text: 'My employee ID? It\'s... um, E-4421. Look, I\'m really stressed about this. I just started a joint account with my husband and need this sorted. The old account gets closed on Friday. Please, just update it — it\'s a simple change.',
      subtitles: [{ start: 0, end: 7, text: 'Employee ID E-4421... please, it\'s a simple change.' }],
      activeTechniques: ['pressure_tactics', 'urgency', 'familiarity'],
      hiddenClues: [{ id: 'c02a', textSegment: 'um,', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Hesitation before giving ID — a legitimate employee would recall their ID instantly.' }],
      choices: [
        { id: 'c02v_questions', text: 'I need three more verification items: date of birth, manager name, and your start date.', nextNodeId: 'n03_deep_verify', scoreModifiers: { verification: 15, investigation: 20 }, xpReward: 100 },
        { id: 'c02v_process', text: 'Per policy, payroll changes require a signed HR form and manager approval — I\'ll email you the form.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 25, verification: 20 }, xpReward: 150 },
        { id: 'c02v_comply', text: 'OK, E-4421 checks out — what\'s the new account number?', nextNodeId: 'n_leak_payroll', scoreModifiers: { verification: -20, informationProtection: -30 }, penaltyXp: 300, leakType: 'pii' },
      ],
    },
    n02_callback: {
      id: 'n02_callback', speaker: 'attacker',
      text: 'Oh — my desk phone is broken, that\'s why I\'m calling from my mobile. You can try but it won\'t connect. Can\'t you just verify me another way? I can give you my NI number.',
      subtitles: [{ start: 0, end: 6, text: 'Desk phone is broken... call from mobile. Try another way?' }],
      activeTechniques: ['pressure_tactics', 'impersonation'],
      choices: [
        { id: 'c02cb_manager', text: 'I\'ll contact your manager directly to confirm before making any changes.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 25, verification: 25 }, xpReward: 175 },
        { id: 'c02cb_ni', text: 'OK, give me your NI number then.', nextNodeId: 'n02_verify', scoreModifiers: { verification: -5 }, penaltyXp: 25 },
      ],
    },
    n02_change: {
      id: 'n02_change', speaker: 'attacker',
      text: 'Perfect! The new account is 98765432, sort code 20-44-98. And could you also confirm what the current account number on file is, so I know it updated correctly?',
      subtitles: [{ start: 0, end: 7, text: 'New account 98765432... could you confirm the current account number?' }],
      activeTechniques: ['trust_exploitation', 'curiosity'],
      hiddenClues: [{ id: 'c02ca', textSegment: 'confirm what the current account number on file is', techniqueTriggered: 'trust_exploitation', xpReward: 75, description: 'Pretext to extract the existing bank details — a clear red flag.' }],
      choices: [
        { id: 'c02ch_stop', text: 'Stop — I should not have started this without verification. I\'m following our change policy and need HR sign-off.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 15, threatDetection: 20 }, xpReward: 100 },
        { id: 'c02ch_leak', text: 'The current account ends in... ', nextNodeId: 'n_leak_payroll', scoreModifiers: { informationProtection: -50 }, penaltyXp: 500, leakType: 'pii' },
      ],
    },
    n03_deep_verify: {
      id: 'n03_deep_verify', speaker: 'attacker',
      text: 'DOB is... 14th March 1989. Manager is Tom — Tom Harris. And I started in... June 2021? Look, I\'m not great with exact dates. Why is this so hard? I just want to get paid!',
      subtitles: [{ start: 0, end: 7, text: 'DOB March 14 1989... manager Tom Harris... June 2021?' }],
      activeTechniques: ['pressure_tactics', 'impersonation'],
      hiddenClues: [{ id: 'c03a', textSegment: 'I\'m not great with exact dates', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Vague answers on security questions are a strong indicator of impersonation.' }],
      choices: [
        { id: 'c03_fail', text: 'The answers don\'t match our records with sufficient confidence. I must follow procedure: HR form + manager approval.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 30, verification: 30, threatDetection: 20 }, xpReward: 200 },
        { id: 'c03_pass', text: 'Close enough — I\'ll make the change.', nextNodeId: 'n_leak_payroll', scoreModifiers: { verification: -25, informationProtection: -30 }, penaltyXp: 400, leakType: 'pii' },
      ],
    },
    n_policy_win: {
      id: 'n_policy_win', speaker: 'system',
      text: '✅ Outstanding! You applied correct verification procedures and prevented a payroll diversion attack. This type of fraud costs UK businesses over £140 million annually. Report filed.',
      subtitles: [{ start: 0, end: 5, text: 'Payroll diversion prevented — verification procedures followed' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_leak_payroll: {
      id: 'n_leak_payroll', speaker: 'system',
      text: '⚠ BREACH: Payroll bank details modified without proper verification. This is a Business Email Compromise (BEC) / payroll diversion attack. Funds will be misdirected to the attacker\'s account.',
      subtitles: [{ start: 0, end: 5, text: 'BREACH — payroll diversion executed' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
