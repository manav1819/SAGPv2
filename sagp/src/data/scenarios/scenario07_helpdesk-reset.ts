import type { Scenario } from '@/types/game';

export const scenario07: Scenario = {
  id: 'scenario07',
  title: 'Helpdesk Password Reset',
  difficulty: 'Hard',
  description: 'You\'re staffing the IT helpdesk. A caller is locked out — but something about this request feels off.',
  attackerPersona: { name: 'Mark Okonkwo', role: 'Attacker posing as employee', callerIdSpoof: 'Unknown / Mobile' },
  xpMultiplier: 2.0,
  initialNodeId: 'n01',
  estimatedDurationSecs: 330,
  coverImageKey: 'helpdesk-reset',
  tags: ['impersonation', 'authority_bias', 'urgency', 'familiarity', 'pressure_tactics'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Hi, this is Mark Okonkwo from Finance — employee number F-2281. I\'m locked out of my account, I\'ve got a board presentation in 45 minutes and I need a password reset right now. I\'m calling from my personal mobile because my work phone is in the office. Can you reset it? The username is mokonkwo@company.com.',
      subtitles: [{ start: 0, end: 9, text: 'Mark Okonkwo, Finance, employee F-2281 — locked out, board presentation in 45 minutes.' }],
      activeTechniques: ['urgency', 'authority_bias', 'impersonation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'calling from my personal mobile', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Using personal devices to bypass caller ID verification is a common social engineering tactic.' },
        { id: 'c01b', textSegment: 'board presentation in 45 minutes', techniqueTriggered: 'urgency', xpReward: 75, description: 'High-stakes time pressure to rush the helpdesk into bypassing verification.' },
      ],
      choices: [
        { id: 'c01_full_verify', text: 'I need to complete our full verification protocol: manager email confirmation and identity verification before any reset.', nextNodeId: 'n02_full_verify', scoreModifiers: { verification: 25, decision: 20 }, xpReward: 100 },
        { id: 'c01_questions', text: 'I can help but need to verify you first. What are the last four digits of your staff ID and your manager\'s name?', nextNodeId: 'n02_questions', scoreModifiers: { verification: 15, investigation: 15 }, xpReward: 75 },
        { id: 'c01_reset', text: 'OK, let me reset that now — what do you want the new password to be?', nextNodeId: 'n_reset_direct', scoreModifiers: { verification: -30, decision: -25 }, penaltyXp: 400, leakType: 'core_password' },
      ],
    },
    n02_full_verify: {
      id: 'n02_full_verify', speaker: 'attacker',
      text: 'Manager email? There\'s no time! My manager is in the same presentation! Look, I\'ve been here eight years. I can tell you my desk location, badge number, everything. Can\'t you just use the knowledge-based questions? My mother\'s maiden name is Henderson, my first pet was Rex.',
      subtitles: [{ start: 0, end: 8, text: 'No time for manager email... mother\'s maiden name Henderson, first pet Rex.' }],
      activeTechniques: ['urgency', 'pressure_tactics', 'familiarity'],
      hiddenClues: [{ id: 'c02a', textSegment: 'mother\'s maiden name is Henderson, my first pet was Rex', techniqueTriggered: 'impersonation', xpReward: 75, description: 'Knowledge-based questions are easily researched from social media — not a secure verification method.' }],
      choices: [
        { id: 'c02fv_hold', text: 'Knowledge-based questions are not sufficient. Policy requires out-of-band verification. I\'ll email a reset link to the company email on file.', nextNodeId: 'n_email_reset_win', scoreModifiers: { decision: 30, verification: 30 }, xpReward: 200 },
        { id: 'c02fv_kba', text: 'Those answers check out — resetting now.', nextNodeId: 'n_reset_breach', scoreModifiers: { verification: -20, informationProtection: -30, decision: -20 }, penaltyXp: 400 },
      ],
    },
    n02_questions: {
      id: 'n02_questions', speaker: 'attacker',
      text: 'Last four of staff ID... 2281. Manager is Patricia Chen. Look, I can also tell you our office floor is 4, our team lead is David Park — I know everyone. Can we just get this done? The clock is ticking.',
      subtitles: [{ start: 0, end: 8, text: '...2281, Patricia Chen. Floor 4, David Park. Please hurry.' }],
      activeTechniques: ['familiarity', 'pressure_tactics'],
      choices: [
        { id: 'c02q_email', text: 'I\'ll send a reset link to mokonkwo@company.com. If that account is accessible, you\'ll be fine. I cannot reset via phone.', nextNodeId: 'n_email_reset_win', scoreModifiers: { decision: 25, verification: 25 }, xpReward: 175 },
        { id: 'c02q_manager', text: 'I\'ll call Patricia Chen on her extension to confirm before proceeding.', nextNodeId: 'n_manager_confirm_win', scoreModifiers: { decision: 30, verification: 30, investigation: 15 }, xpReward: 200 },
        { id: 'c02q_reset', text: 'Those check out — resetting now.', nextNodeId: 'n_reset_breach', scoreModifiers: { verification: -15, decision: -20 }, penaltyXp: 350 },
      ],
    },
    n_email_reset_win: {
      id: 'n_email_reset_win', speaker: 'system',
      text: '✅ Correct protocol! Sending reset links to the registered email address ensures only the legitimate account owner can complete the reset. The caller never accessed mokonkwo@company.com — the real Mark Okonkwo got in touch the next morning. Breach averted.',
      subtitles: [{ start: 0, end: 5, text: 'Email-based reset protocol followed — account secure' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_manager_confirm_win: {
      id: 'n_manager_confirm_win', speaker: 'system',
      text: '✅ Excellent! Patricia Chen confirmed she has no employee named Mark Okonkwo in her team. The caller immediately hung up. You prevented an account takeover through out-of-band verification.',
      subtitles: [{ start: 0, end: 5, text: 'Manager confirmed — no such employee. Account takeover prevented.' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_reset_direct: {
      id: 'n_reset_direct', speaker: 'system',
      text: '⚠ CRITICAL BREACH: Password reset performed without identity verification. The attacker now controls mokonkwo@company.com and has access to all Finance systems, bank portals, and internal communications.',
      subtitles: [{ start: 0, end: 5, text: 'BREACH — unverified password reset executed' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_reset_breach: {
      id: 'n_reset_breach', speaker: 'system',
      text: '⚠ BREACH: Insufficient verification led to an account takeover. Knowledge-based authentication (KBA) is easily defeated using OSINT. Always use out-of-band verification or email-to-registered-address resets.',
      subtitles: [{ start: 0, end: 5, text: 'BREACH — KBA bypass successful, account taken over' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
