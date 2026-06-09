import type { Scenario } from '@/types/game';

export const scenario06: Scenario = {
  id: 'scenario06',
  title: 'MFA Approval Scam',
  difficulty: 'Hard',
  description: 'You\'re getting MFA push notifications you didn\'t trigger. Now someone from "Microsoft Security" is calling. Is this an attack — or legitimate?',
  attackerPersona: { name: 'Alex Turner', role: 'Fake Microsoft Security Engineer', callerIdSpoof: '0800-111-MSFT' },
  xpMultiplier: 2.0,
  initialNodeId: 'n01',
  estimatedDurationSecs: 360,
  coverImageKey: 'mfa-approval',
  tags: ['authority_bias', 'urgency', 'fear', 'impersonation', 'pressure_tactics'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Hello, this is Alex Turner from Microsoft Security Operations. We\'ve detected an account takeover attempt against your Microsoft 365 account from an IP in Bucharest. As part of our automated response, we\'re sending you MFA push notifications to verify your identity. You should see them now on your phone. Please approve the notification to confirm it\'s you and we\'ll lock out the attacker.',
      subtitles: [{ start: 0, end: 10, text: 'Microsoft Security — account takeover from Bucharest. Approve the MFA push notification.' }],
      activeTechniques: ['authority_bias', 'urgency', 'fear', 'impersonation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'Bucharest', techniqueTriggered: 'fear', xpReward: 75, description: 'Foreign location creates panic — overrides rational thinking about why Microsoft would call you.' },
        { id: 'c01b', textSegment: 'approve the notification to confirm it\'s you', techniqueTriggered: 'impersonation', xpReward: 75, description: 'MFA fatigue attack — they\'ve already tried to log in and need your approval to complete it.' },
      ],
      choices: [
        { id: 'c01_refuse', text: 'I will NOT approve any MFA request I didn\'t initiate. If my account is at risk I\'ll change my password directly on the Microsoft website.', nextNodeId: 'n02_refuse', scoreModifiers: { verification: 20, informationProtection: 20, decision: 20 }, xpReward: 150 },
        { id: 'c01_verify', text: 'I need to verify this call. I\'ll hang up and call Microsoft support on the number on their official website.', nextNodeId: 'n02_verify_win', scoreModifiers: { verification: 30, decision: 25 }, xpReward: 175 },
        { id: 'c01_approve', text: 'OK, I can see the notification — approving now.', nextNodeId: 'n_mfa_approved', scoreModifiers: { informationProtection: -60, decision: -50 }, penaltyXp: 500, leakType: 'mfa_code' },
      ],
    },
    n02_refuse: {
      id: 'n02_refuse', speaker: 'attacker',
      text: 'I understand your caution, but if you don\'t approve this RIGHT NOW, the attacker will lock you out of your account in 30 seconds and we\'ll lose the window to help you. I\'m looking at the live attack telemetry. Just approve — it takes two seconds. Your account security depends on it.',
      subtitles: [{ start: 0, end: 9, text: 'Approve RIGHT NOW or you\'ll be locked out in 30 seconds...' }],
      activeTechniques: ['urgency', 'pressure_tactics', 'fear'],
      hiddenClues: [{ id: 'c02a', textSegment: 'live attack telemetry', techniqueTriggered: 'authority_bias', xpReward: 75, description: 'Technical jargon used to sound authoritative and create false urgency.' }],
      choices: [
        { id: 'c02r_firm', text: 'Microsoft does not call customers to approve MFA. This is a MFA fatigue attack. I\'m ending this call and reporting it.', nextNodeId: 'n_report_win', scoreModifiers: { decision: 30, threatDetection: 30, informationProtection: 20 }, xpReward: 200 },
        { id: 'c02r_stall', text: 'Can you give me your Microsoft employee ID first?', nextNodeId: 'n02_stall', scoreModifiers: { investigation: 15, verification: 10 }, xpReward: 50 },
        { id: 'c02r_approve', text: 'OK, approving...', nextNodeId: 'n_mfa_approved', scoreModifiers: { informationProtection: -60, decision: -50 }, penaltyXp: 500, leakType: 'mfa_code' },
      ],
    },
    n02_verify_win: {
      id: 'n02_verify_win', speaker: 'system',
      text: '✅ Perfect textbook response! Microsoft does NOT call users to approve MFA requests. You correctly identified this as an MFA fatigue / adversary-in-the-middle attack and verified independently. Account protected.',
      subtitles: [{ start: 0, end: 5, text: 'MFA fatigue attack thwarted — verified independently' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n02_stall: {
      id: 'n02_stall', speaker: 'attacker',
      text: 'My employee ID is MSFT-4872-SEC. Every second you waste questioning me is a second the attacker is in your account. I\'m showing your account is now at 80% compromise. APPROVE THE NOTIFICATION.',
      subtitles: [{ start: 0, end: 7, text: 'MSFT-4872-SEC... your account is 80% compromised. APPROVE NOW.' }],
      activeTechniques: ['urgency', 'fear', 'pressure_tactics'],
      choices: [
        { id: 'c02s_report', text: 'No. The harder you push, the more certain I am this is an attack. Ending call and reporting.', nextNodeId: 'n_report_win', scoreModifiers: { decision: 25, threatDetection: 25 }, xpReward: 175 },
        { id: 'c02s_approve', text: 'OK, approving!', nextNodeId: 'n_mfa_approved', scoreModifiers: { informationProtection: -60, decision: -50 }, penaltyXp: 500, leakType: 'mfa_code' },
      ],
    },
    n_report_win: {
      id: 'n_report_win', speaker: 'system',
      text: '✅ Outstanding! You identified an MFA fatigue attack (also called MFA bombing). The attacker had your password and was waiting for you to approve their authentication attempt. Your account — and your organisation\'s network — is safe.',
      subtitles: [{ start: 0, end: 5, text: 'MFA bombing attack identified and blocked' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_mfa_approved: {
      id: 'n_mfa_approved', speaker: 'system',
      text: '⚠ CRITICAL BREACH: MFA approval granted to attacker. They now have full access to your Microsoft 365 account — including email, SharePoint, Teams, and all connected applications. This is an adversary-in-the-middle (AiTM) attack.',
      subtitles: [{ start: 0, end: 5, text: 'CRITICAL BREACH — MFA approved, account compromised' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
