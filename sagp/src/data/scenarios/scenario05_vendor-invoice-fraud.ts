import type { Scenario } from '@/types/game';

export const scenario05: Scenario = {
  id: 'scenario05',
  title: 'Vendor Invoice Fraud',
  difficulty: 'Medium',
  description: 'Your long-standing supplier has new banking details. A routine change — or the start of a £50,000 fraud?',
  attackerPersona: { name: 'Claire Webb', role: 'Fake Accounts Manager at TechSupply Ltd', callerIdSpoof: '+44-161-555-0920' },
  xpMultiplier: 1.5,
  initialNodeId: 'n01',
  estimatedDurationSecs: 300,
  coverImageKey: 'vendor-invoice',
  tags: ['impersonation', 'trust_exploitation', 'familiarity', 'urgency'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Good morning! This is Claire Webb, accounts manager at TechSupply Ltd — we\'ve been your supplier for, what, three years now? We\'re migrating to a new banking provider and all outstanding and future invoices need to go to our new account from Monday. Invoice 4471 for £18,500 is due Friday — can I update the bank details on your system today?',
      subtitles: [{ start: 0, end: 9, text: 'Claire Webb, TechSupply Ltd — new banking details for your supplier account.' }],
      activeTechniques: ['familiarity', 'trust_exploitation', 'urgency'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'three years now', techniqueTriggered: 'familiarity', xpReward: 75, description: 'Citing a long relationship to build trust before making a suspicious request.' },
        { id: 'c01b', textSegment: 'Invoice 4471 for £18,500 is due Friday', techniqueTriggered: 'urgency', xpReward: 75, description: 'Attaches a real-sounding urgent payment to pressure a quick update.' },
      ],
      choices: [
        { id: 'c01_callback', text: 'I can only update banking details after calling back on the main TechSupply number from our records — not this one.', nextNodeId: 'n02_callback', scoreModifiers: { verification: 25, decision: 20 }, xpReward: 100 },
        { id: 'c01_process', text: 'Our policy requires this in writing via email from your registered domain, plus manager countersignature.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 30, verification: 25 }, xpReward: 150 },
        { id: 'c01_update', text: 'Of course, what are the new details?', nextNodeId: 'n02_update', scoreModifiers: { verification: -20, decision: -15 }, penaltyXp: 200 },
      ],
    },
    n02_callback: {
      id: 'n02_callback', speaker: 'attacker',
      text: 'Oh — we\'ve changed all our phone numbers as part of the migration too. The old number won\'t work after today. I can give you the new switchboard. Also, I should mention — if this isn\'t updated in time, your invoice will bounce and you\'ll be charged a late payment fee.',
      subtitles: [{ start: 0, end: 8, text: 'Phone numbers changed too... late payment fee if not done today.' }],
      activeTechniques: ['urgency', 'pressure_tactics', 'impersonation'],
      hiddenClues: [{ id: 'c02a', textSegment: 'I can give you the new switchboard', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Providing attacker-controlled contact information to intercept your verification call.' }],
      choices: [
        { id: 'c02cb_verify', text: 'I\'ll look up TechSupply Ltd on Companies House and call their registered number independently.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 30, verification: 30, investigation: 20 }, xpReward: 200 },
        { id: 'c02cb_newnum', text: 'OK, give me the new number.', nextNodeId: 'n02_attacker_number', scoreModifiers: { verification: -15 }, penaltyXp: 100 },
      ],
    },
    n02_attacker_number: {
      id: 'n02_attacker_number', speaker: 'attacker',
      text: 'The new number is 0161-555-8823. And if you call, just ask for me — Claire Webb, ref code TL-9941. I\'ll be expecting your call. Can we also do the update now so there\'s no delay?',
      subtitles: [{ start: 0, end: 7, text: 'New number 0161-555-8823, ask for Claire Webb...' }],
      activeTechniques: ['pressure_tactics'],
      choices: [
        { id: 'c02an_stop', text: 'I won\'t use a number you\'ve given me. I\'ll verify independently via Companies House.', nextNodeId: 'n_policy_win', scoreModifiers: { decision: 25, verification: 20, threatDetection: 20 }, xpReward: 150 },
        { id: 'c02an_call', text: 'OK, I\'ll call that number now and update if confirmed.', nextNodeId: 'n02_update', scoreModifiers: { verification: -20, decision: -20 }, penaltyXp: 300 },
      ],
    },
    n02_update: {
      id: 'n02_update', speaker: 'attacker',
      text: 'Thank you! New sort code 40-47-84, account number 71920384. Name on account is "TS Payments Ltd". Also — could you just confirm the last four digits of the old account number so I can flag it as closed on our end?',
      subtitles: [{ start: 0, end: 8, text: 'New sort code 40-47-84... could you confirm the old account last four digits?' }],
      activeTechniques: ['trust_exploitation', 'curiosity'],
      hiddenClues: [{ id: 'c02ua', textSegment: '"TS Payments Ltd"', techniqueTriggered: 'impersonation', xpReward: 75, description: 'The account name doesn\'t match the supplier name — a significant red flag.' }],
      choices: [
        { id: 'c02u_stop', text: 'Wait — the account name doesn\'t match TechSupply Ltd. I\'m halting this and escalating to finance.', nextNodeId: 'n_catch_fraud', scoreModifiers: { threatDetection: 30, decision: 25 }, xpReward: 175 },
        { id: 'c02u_confirm', text: 'Old account ends in... sure, it\'s 3847.', nextNodeId: 'n_fraud_complete', scoreModifiers: { informationProtection: -40, decision: -30 }, penaltyXp: 500, leakType: 'vendor_credentials' },
      ],
    },
    n_catch_fraud: {
      id: 'n_catch_fraud', speaker: 'system',
      text: '✅ Sharp eye! You caught the account name mismatch — a classic Authorised Push Payment (APP) fraud pattern. Finance confirmed TechSupply Ltd never requested a change. Report filed with Action Fraud.',
      subtitles: [{ start: 0, end: 5, text: 'APP fraud attempt caught — account name mismatch identified' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_policy_win: {
      id: 'n_policy_win', speaker: 'system',
      text: '✅ Excellent! You followed correct vendor change management procedures. The real TechSupply Ltd confirmed no change was requested — you prevented a £18,500+ APP fraud.',
      subtitles: [{ start: 0, end: 5, text: 'Vendor fraud prevented — correct procedures followed' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_fraud_complete: {
      id: 'n_fraud_complete', speaker: 'system',
      text: '⚠ BREACH: Vendor payment details modified and existing account details disclosed. Invoice payment of £18,500 will be transferred to a fraud account. This is an Authorised Push Payment (APP) fraud.',
      subtitles: [{ start: 0, end: 5, text: 'BREACH — APP fraud executed, £18,500 at risk' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
