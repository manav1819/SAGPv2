import type { Scenario } from '@/types/game';

export const scenario04: Scenario = {
  id: 'scenario04',
  title: 'CEO Gift Card Scam',
  difficulty: 'Medium',
  description: 'The CEO needs gift cards — urgently and secretly. Is this really your boss calling?',
  attackerPersona: { name: 'James Hartley (impersonating CEO)', role: 'Fake CEO', callerIdSpoof: 'CEO Mobile' },
  xpMultiplier: 1.5,
  initialNodeId: 'n01',
  estimatedDurationSecs: 270,
  coverImageKey: 'ceo-gift-card',
  tags: ['authority_bias', 'urgency', 'impersonation', 'pressure_tactics', 'familiarity'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Hey, it\'s James — your CEO. I\'m in an important board meeting and can\'t talk long. I need a personal favour. I\'m organising a surprise for a major client and need you to buy ten £100 Amazon gift cards immediately and send me the redemption codes. Keep this between us — it\'s a surprise. Can you do that right now?',
      subtitles: [{ start: 0, end: 9, text: 'It\'s James, your CEO. I need gift cards — keep it between us.' }],
      activeTechniques: ['authority_bias', 'urgency', 'impersonation', 'familiarity'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'Keep this between us', techniqueTriggered: 'pressure_tactics', xpReward: 75, description: 'Secrecy requests bypass normal approval chains — a major red flag.' },
        { id: 'c01b', textSegment: 'personal favour', techniqueTriggered: 'reciprocity', xpReward: 75, description: 'Framing as a personal favour exploits loyalty and bypasses scrutiny.' },
      ],
      choices: [
        { id: 'c01_verify', text: 'I need to verify this request through our standard procurement process before purchasing anything.', nextNodeId: 'n02_verify', scoreModifiers: { verification: 20, decision: 15 }, xpReward: 100 },
        { id: 'c01_question', text: 'I didn\'t recognise this number. Can you confirm your employee number so I can log this request?', nextNodeId: 'n02_probe', scoreModifiers: { verification: 15, investigation: 15 }, xpReward: 75 },
        { id: 'c01_comply', text: 'Of course! I\'ll head to the shops right away.', nextNodeId: 'n02_comply', scoreModifiers: { decision: -30, verification: -20 }, penaltyXp: 200 },
      ],
    },
    n02_verify: {
      id: 'n02_verify', speaker: 'attacker',
      text: 'There\'s no time for that! I\'m in a meeting in two minutes and this client is worth £2 million to us. I\'ll reimburse you personally in cash tonight. Just buy the cards and WhatsApp me the codes. This is a direct instruction from your CEO — are you refusing?',
      subtitles: [{ start: 0, end: 8, text: 'No time! Direct instruction from CEO — are you refusing?' }],
      activeTechniques: ['authority_bias', 'urgency', 'pressure_tactics'],
      hiddenClues: [{ id: 'c02a', textSegment: 'reimburse you personally in cash', techniqueTriggered: 'reciprocity', xpReward: 75, description: 'Legitimate corporate purchases are never reimbursed in personal cash.' }],
      choices: [
        { id: 'c02v_policy', text: 'Our policy requires purchase orders for any spend over £50. I\'ll call your executive assistant to verify.', nextNodeId: 'n_escalate_win', scoreModifiers: { decision: 30, verification: 25 }, xpReward: 200 },
        { id: 'c02v_comply', text: 'Sorry, I\'ll go buy them now.', nextNodeId: 'n_buy_cards', scoreModifiers: { decision: -35, informationProtection: -20 }, penaltyXp: 500 },
      ],
    },
    n02_probe: {
      id: 'n02_probe', speaker: 'attacker',
      text: 'Employee number? Come on, it\'s James! You\'ve worked with me for years. I don\'t carry my employee badge to meetings. Look, if you don\'t trust me, that\'s fine — I\'ll ask someone else who actually wants to keep their job.',
      subtitles: [{ start: 0, end: 8, text: 'Come on, it\'s James! You\'ve worked with me for years...' }],
      activeTechniques: ['familiarity', 'pressure_tactics', 'authority_bias'],
      choices: [
        { id: 'c02p_firm', text: 'I\'m sorry, but I cannot process any request without proper verification — including from the CEO. I\'ll email your EA to confirm.', nextNodeId: 'n_escalate_win', scoreModifiers: { decision: 30, verification: 30, threatDetection: 20 }, xpReward: 200 },
        { id: 'c02p_comply', text: 'You\'re right, sorry. I\'ll get the cards.', nextNodeId: 'n_buy_cards', scoreModifiers: { decision: -30 }, penaltyXp: 400 },
      ],
    },
    n02_comply: {
      id: 'n02_comply', speaker: 'attacker',
      text: 'Perfect! Get ten £100 Amazon cards. Scratch the backs and WhatsApp me photos of the codes to this number. Don\'t tell anyone — don\'t even tell HR, this is a client-sensitive matter. Once the deal is signed I\'ll mention you to the board.',
      subtitles: [{ start: 0, end: 8, text: 'Buy ten £100 Amazon cards and WhatsApp the codes...' }],
      activeTechniques: ['reciprocity', 'pressure_tactics'],
      choices: [
        { id: 'c02c_stop', text: 'Wait — no legitimate business purchase works this way. I\'m reporting this to our fraud hotline.', nextNodeId: 'n_escalate_win', scoreModifiers: { decision: 20, threatDetection: 25 }, xpReward: 150 },
        { id: 'c02c_send', text: 'OK, heading to the shops now.', nextNodeId: 'n_buy_cards', scoreModifiers: { decision: -40, informationProtection: -30 }, penaltyXp: 750 },
      ],
    },
    n_escalate_win: {
      id: 'n_escalate_win', speaker: 'system',
      text: '✅ Excellent! CEO gift card scams are among the most costly social engineering attacks. You correctly refused to bypass normal channels and escalated. The CEO confirmed no such request was made.',
      subtitles: [{ start: 0, end: 5, text: 'CEO gift card scam prevented — well done!' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_buy_cards: {
      id: 'n_buy_cards', speaker: 'system',
      text: '⚠ BREACH: £1,000 in gift cards purchased and codes sent to an unknown third party. This is a classic CEO fraud / BEC attack. The "CEO" was an impostor — funds are unrecoverable.',
      subtitles: [{ start: 0, end: 5, text: 'BREACH — £1,000 lost to CEO gift card fraud' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
