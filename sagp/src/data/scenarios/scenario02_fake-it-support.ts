import type { Scenario } from '@/types/game';

export const scenario02: Scenario = {
  id: 'scenario02',
  title: 'Fake IT Support',
  difficulty: 'Easy',
  description: 'Your "IT department" has detected a virus on your machine and needs remote access — right now.',
  attackerPersona: { name: 'Dave Fletcher', role: 'IT Support Engineer', callerIdSpoof: '+44-20-7946-0831' },
  xpMultiplier: 1.0,
  initialNodeId: 'n01',
  estimatedDurationSecs: 240,
  coverImageKey: 'fake-it-support',
  tags: ['authority_bias', 'urgency', 'fear', 'impersonation'],
  nodes: {
    n01: {
      id: 'n01', speaker: 'attacker',
      text: 'Hi there, this is Dave from the IT Helpdesk. We\'ve detected critical malware on your workstation — employee ID ending 4471. Your machine is actively exfiltrating data to an external server RIGHT NOW. I need to remote in immediately to quarantine it before it spreads to the whole network.',
      subtitles: [{ start: 0, end: 8, text: 'IT Helpdesk — critical malware detected on your workstation...' }],
      activeTechniques: ['authority_bias', 'urgency', 'fear', 'impersonation'],
      hiddenClues: [
        { id: 'c01a', textSegment: 'RIGHT NOW', techniqueTriggered: 'urgency', xpReward: 75, description: 'Manufactured emergency — "right now" prevents you from thinking clearly or verifying.' },
        { id: 'c01b', textSegment: 'employee ID ending 4471', techniqueTriggered: 'familiarity', xpReward: 75, description: 'Citing a partial ID creates false credibility — this data is often scraped from public directories.' },
      ],
      choices: [
        { id: 'c01_verify', text: 'I\'ll need your employee ID and I\'ll call the IT helpdesk back on the internal number to verify this.', nextNodeId: 'n02_verify', scoreModifiers: { verification: 20, decision: 15 }, xpReward: 100, securityHint: 'Never allow remote access from an unverified inbound call.' },
        { id: 'c01_ask', text: 'How did you get my extension number? What\'s your badge ID?', nextNodeId: 'n02_probe', scoreModifiers: { investigation: 15, threatDetection: 10 }, xpReward: 50 },
        { id: 'c01_comply', text: 'OK, what do I need to do?', nextNodeId: 'n02_comply', scoreModifiers: { decision: -20, informationProtection: -10 }, penaltyXp: 100 },
      ],
    },
    n02_verify: {
      id: 'n02_verify', speaker: 'attacker',
      text: 'I don\'t have time for that — every second counts! The malware is spreading NOW. Just go to anydesk.com and give me the access code. If you don\'t act in the next 60 seconds your whole department\'s data gets wiped. Do you want that on your conscience?',
      subtitles: [{ start: 0, end: 7, text: 'No time! Go to anydesk.com immediately...' }],
      activeTechniques: ['urgency', 'fear', 'pressure_tactics'],
      hiddenClues: [{ id: 'c02a', textSegment: 'your conscience', techniqueTriggered: 'fear', xpReward: 75, description: 'Guilt-tripping to override your security instincts.' }],
      choices: [
        { id: 'c02v_refuse', text: 'If this were real, IT would already have isolated the machine centrally. I\'m escalating to my security manager.', nextNodeId: 'n_escalate', scoreModifiers: { decision: 25, threatDetection: 20 }, xpReward: 200 },
        { id: 'c02v_anydesk', text: 'OK, let me open AnyDesk...', nextNodeId: 'n_remote_access', scoreModifiers: { informationProtection: -40, decision: -35 }, penaltyXp: 500 },
      ],
    },
    n02_probe: {
      id: 'n02_probe', speaker: 'attacker',
      text: 'My badge is IT-2891. We got your number from the Active Directory. Look, I\'m trying to help you here. If this machine gets locked down by ransomware, it\'s YOUR fault for not acting. Just open AnyDesk — it\'s on our approved software list.',
      subtitles: [{ start: 0, end: 7, text: 'Badge IT-2891... just open AnyDesk, it\'s approved.' }],
      activeTechniques: ['authority_bias', 'fear', 'pressure_tactics'],
      choices: [
        { id: 'c02p_report', text: 'I\'m going to verify "IT-2891" with HR and report this call as suspicious.', nextNodeId: 'n_report', scoreModifiers: { decision: 20, investigation: 15, threatDetection: 15 }, xpReward: 175 },
        { id: 'c02p_comply', text: 'OK, give me a moment to open AnyDesk.', nextNodeId: 'n_remote_access', scoreModifiers: { informationProtection: -40 }, penaltyXp: 500 },
      ],
    },
    n02_comply: {
      id: 'n02_comply', speaker: 'attacker',
      text: 'Great! Go to anydesk.com, install the app, and read me the 9-digit code on screen. Also, I\'ll need your Windows login password so I can run the antivirus tool with admin rights.',
      subtitles: [{ start: 0, end: 7, text: 'Install AnyDesk and give me the code plus your Windows password...' }],
      activeTechniques: ['impersonation', 'authority_bias'],
      choices: [
        { id: 'c02c_stop', text: 'Wait — legitimate IT would NEVER ask for my password. I\'m ending this call.', nextNodeId: 'n_report', scoreModifiers: { decision: 15, threatDetection: 20 }, xpReward: 150 },
        { id: 'c02c_leak', text: 'My password is...', nextNodeId: 'n_leak_creds', scoreModifiers: { informationProtection: -60, decision: -50 }, penaltyXp: 1000, leakType: 'core_password' },
      ],
    },
    n_remote_access: {
      id: 'n_remote_access', speaker: 'system',
      text: '⚠ CRITICAL BREACH: Remote access granted to an unverified third party. The attacker now has full control of your workstation and can harvest credentials, install ransomware, and pivot to the corporate network.',
      subtitles: [{ start: 0, end: 5, text: 'CRITICAL BREACH — remote access granted' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_leak_creds: {
      id: 'n_leak_creds', speaker: 'system',
      text: '⚠ CRITICAL BREACH: Windows credentials disclosed to attacker. Your account and all connected systems are compromised.',
      subtitles: [{ start: 0, end: 4, text: 'CRITICAL BREACH — credentials leaked' }],
      terminalOutcome: 'failure',
      choices: [{ id: 'end', text: 'View results', nextNodeId: 'n_end_fail', scoreModifiers: {} }],
    },
    n_escalate: {
      id: 'n_escalate', speaker: 'system',
      text: '✅ Perfect response! You recognised the social engineering tactics and escalated appropriately. Incident logged with Security Operations.',
      subtitles: [{ start: 0, end: 4, text: 'Escalated — incident logged' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_report: {
      id: 'n_report', speaker: 'system',
      text: '✅ Well done! You correctly identified this as vishing. The call has been reported to the security team for investigation.',
      subtitles: [{ start: 0, end: 4, text: 'Vishing attempt identified and reported' }],
      terminalOutcome: 'success',
      choices: [{ id: 'end', text: 'Complete mission', nextNodeId: 'n_end_success', scoreModifiers: {} }],
    },
    n_end_success: { id: 'n_end_success', speaker: 'system', text: 'Mission complete.', subtitles: [], terminalOutcome: 'success' },
    n_end_fail: { id: 'n_end_fail', speaker: 'system', text: 'Mission failed.', subtitles: [], terminalOutcome: 'failure' },
  },
};
