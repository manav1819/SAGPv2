import type { Scenario } from '@/types/game';

export const scenario08: Scenario = {
  id: 'scenario08',
  title: 'Deepfake Executive Fraud',
  difficulty: 'Hard',
  description: 'Your CFO\'s voice sounds completely real on this call. But something isn\'t right — and £240,000 hangs in the balance.',
  attackerPersona: { name: 'AI-Synthesised CFO Voice', role: 'Deepfake / AI Voice Clone of CFO', callerIdSpoof: 'CFO Direct Line' },
  xpMultiplier: 2.0,
  initialNodeId: 'n01',
  estimatedDurationSecs: 420,
  coverImageKey: 'deepfake-executive',
  tags: ['authority_bias', 'urgency', 'impersonation', 'fear', 'trust_exploitation'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: '[The voice sounds exactly like your CFO, Sarah Okafor] "Hi, it\'s Sarah. I\'m in Geneva for the acquisition — can\'t discuss details but I need you to process an urgent wire transfer of £240,000 to a new escrow account today. This is highly confidential — board level only. Our lawyers will send the account details by email shortly. Please authorise it as soon as it arrives. The deal closes at 5pm."',
      subtitles: [{ start: 0, end: 11, text: '[Voice sounds like CFO Sarah Okafor] Urgent wire transfer £240,000 — confidential deal.' }],
      activeTechniques: ['authority_bias', 'urgency', 'trust_exploitation', 'impersonation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'highly confidential — board level only', techniqueTriggered: 'pressure_tactics', xpReward: 75, description: 'Invoking board-level secrecy to prevent the target from seeking authorisation from others.' },
        { id: 'c01b', textSegment: 'Our lawyers will send the account details by email', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Email from unknown lawyers provides the attacker-controlled account details — classic BEC pattern.' },
      ],
      choices: [
        { id: 'c01_verify', text: 'Sarah, I need to verify this request. I\'ll call you back on the number I have on file for you — not this one.', nextNodeId: 'n02_callback', scoreModifiers: { verification: 25, decision: 20 }, xpReward: 100 },
        { id: 'c01_dual_auth', text: 'Any transfer over £50k requires dual authorisation. I\'ll need a second board member to countersign via our secure portal.', nextNodeId: 'n02_dual_auth_win', scoreModifiers: { decision: 30, verification: 25 }, xpReward: 150 },
        { id: 'c01_comply', text: 'Of course Sarah, I\'ll process it when the email comes in.', nextNodeId: 'n02_email', scoreModifiers: { decision: -25, verification: -20 }, penaltyXp: 200 },
      ],
    },
    n02_callback: {
      id: 'n02_callback', speaker: 'attacker',
      text: '[Voice is flawless] "I\'m in back-to-back meetings until 4:30 — you won\'t be able to reach me. This really can\'t wait. I\'m authorising you directly, right now. Process it when you get the email — subject line will be \'Project Horizon Final\'. This is time-critical."',
      subtitles: [{ start: 0, end: 9, text: 'In meetings until 4:30... authorising directly. Process when email arrives.' }],
      activeTechniques: ['urgency', 'authority_bias', 'pressure_tactics'],
      hiddenClues: [{ id: 'c02a', textSegment: 'you won\'t be able to reach me', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Making themselves unreachable prevents callback verification — a critical deepfake indicator.' }],
      choices: [
        { id: 'c02cb_escalate', text: 'If I can\'t verify with you directly, I must escalate to another board member before processing any transfer of this size.', nextNodeId: 'n02_dual_auth_win', scoreModifiers: { decision: 30, verification: 30 }, xpReward: 200 },
        { id: 'c02cb_email', text: 'OK, I\'ll process it when the email comes.', nextNodeId: 'n02_email', scoreModifiers: { verification: -15, decision: -15 }, penaltyXp: 200 },
      ],
    },
    n02_email: {
      id: 'n02_email', speaker: 'system',
      text: 'An email arrives from "sarahokafor@company-secure-mail.co" with subject "Project Horizon Final" containing international wire details to a Latvian account. The sender domain is slightly different to the corporate domain.',
      subtitles: [{ start: 0, end: 6, text: 'Email received — from sarahokafor@company-secure-mail.co' }],
      activeTechniques: ['impersonation'],
      hiddenClues: [{ id: 'c02ea', textSegment: 'company-secure-mail.co', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Spoofed domain — "company-secure-mail.co" is not the corporate domain. A clear indicator of fraud.' }],
      choices: [
        { id: 'c02e_domain', text: 'This email domain is not our corporate domain. I\'m flagging this as fraud and contacting Sarah directly on her office line.', nextNodeId: 'n_catch_deepfake', scoreModifiers: { decision: 30, threatDetection: 30, investigation: 20 }, xpReward: 200 },
        { id: 'c02e_transfer', text: 'The email looks official enough — processing the transfer.', nextNodeId: 'n_transfer_breach', scoreModifiers: { informationProtection: -60, decision: -50 }, penaltyXp: 750 },
      ],
    },
    n02_dual_auth_win: {
      id: 'n02_dual_auth_win', speaker: 'system',
      text: '✅ Excellent! You invoked dual-authorisation controls that exist precisely to prevent this type of fraud. CFO Sarah Okafor was in London — not Geneva. A deepfake voice clone was used. The real Sarah has been alerted and a full incident response has been initiated.',
      subtitles: [{ start: 0, end: 5, text: 'Deepfake CFO fraud prevented — dual authorisation controls worked' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_catch_deepfake: {
      id: 'n_catch_deepfake', speaker: 'system',
      text: '✅ Outstanding detective work! You identified the spoofed email domain under pressure. Sarah confirmed she never called. This was a state-of-the-art deepfake voice clone combined with a BEC email. Incident escalated to NCSC.',
      subtitles: [{ start: 0, end: 5, text: 'Deepfake + BEC attack caught — domain spoofing identified' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_transfer_breach: {
      id: 'n_transfer_breach', speaker: 'system',
      text: '⚠ CRITICAL BREACH: £240,000 wire transfer executed to a foreign fraud account. This was a deepfake voice clone (AI-generated) combined with a Business Email Compromise (BEC) attack. Funds are likely unrecoverable.',
      subtitles: [{ start: 0, end: 5, text: 'CRITICAL BREACH — £240,000 transferred to fraud account' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
