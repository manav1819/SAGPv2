// Cybersecurity training scenarios
export const SCENARIOS = [
  {
    id: 'phishing_email',
    title: '📧 Suspicious Email',
    npcLabel: 'EMAIL\nTERMINAL',
    color: 0x00aaff,
    description: 'You open your email and see:\n\n"URGENT: Your account will be\nsuspended! Click here NOW to\nverify: http://c0mpany-secure.ru"',
    prompt: 'What do you do?',
    choices: [
      {
        text: '🚨 Report as phishing',
        outcome: 'correct',
        feedback: 'Excellent! You reported the phishing\nemail to IT Security. The link was\na credential harvesting attack!',
      },
      {
        text: '🔗 Click the link',
        outcome: 'risky',
        feedback: 'Dangerous! That was a phishing link.\nYour credentials may be compromised.\nAlways verify sender addresses!',
      },
      {
        text: '🙈 Ignore it',
        outcome: 'neutral',
        feedback: 'Better than clicking, but reporting\nhelps protect your whole organisation.\nAlways report suspicious emails!',
      },
    ],
  },
  {
    id: 'usb_drive',
    title: '💾 USB Drive Found',
    npcLabel: 'USB\nDRIVE',
    color: 0xffaa00,
    description: 'You find a USB drive on the\nfloor near the printer.\nIt\'s labelled "PAYROLL Q4".',
    prompt: 'What do you do?',
    choices: [
      {
        text: '🔌 Plug it into your PC',
        outcome: 'risky',
        feedback: 'Big mistake! Unknown USB drives\ncan contain malware that auto-runs\nand infects your machine instantly!',
      },
      {
        text: '📞 Report it to IT',
        outcome: 'correct',
        feedback: 'Perfect! IT Security will safely\nanalyse the drive. It contained\na keylogger trojan. Nice catch!',
      },
      {
        text: '🎒 Keep it for later',
        outcome: 'neutral',
        feedback: 'Keeping it is still risky — you\nmight forget and plug it in later.\nAlways report found devices to IT!',
      },
    ],
  },
  {
    id: 'fake_it_support',
    title: '🎭 Fake IT Support',
    npcLabel: 'IT\nSUPPORT\nNPC',
    color: 0xff4444,
    description: '"Hi! I\'m from IT Support.\nWe\'re doing an urgent audit\nand need your password to\nfix a critical system error."',
    prompt: 'What do you do?',
    choices: [
      {
        text: '🔑 Share your password',
        outcome: 'risky',
        feedback: 'Never share passwords — EVER!\nReal IT staff never need your\npassword to do their job!',
      },
      {
        text: '✋ Refuse and verify ID',
        outcome: 'correct',
        feedback: 'Smart move! You asked for\nemployee ID and called IT directly.\nIt was a social engineering attack!',
      },
      {
        text: '🤷 Ask a coworker',
        outcome: 'neutral',
        feedback: 'Asking a coworker adds delay but\ndoesn\'t resolve the threat. Always\nverify with IT directly — not peers.',
      },
    ],
  },
  {
    id: 'mfa_fatigue',
    title: '📱 MFA Fatigue Attack',
    npcLabel: 'MFA\nPROMPT',
    color: 0xaa44ff,
    description: 'You\'ve received 12 push\nauthentication requests in\nthe last 5 minutes.\nYou didn\'t trigger any logins.',
    prompt: 'What do you do?',
    choices: [
      {
        text: '✅ Approve to stop alerts',
        outcome: 'risky',
        feedback: 'Approving unexpected MFA requests\ngives attackers full account access!\nThis is an MFA fatigue/bombing attack.',
      },
      {
        text: '❌ Deny and report it',
        outcome: 'correct',
        feedback: 'Excellent! Someone is trying to\ngain access via MFA bombing.\nIT Security is now investigating!',
      },
      {
        text: '😴 Ignore the prompts',
        outcome: 'neutral',
        feedback: 'Ignoring stops immediate access\nbut doesn\'t alert IT to the attack.\nAlways report unexpected MFA activity!',
      },
    ],
  },
  {
    id: 'tailgating',
    title: '🚪 Tailgating Attempt',
    npcLabel: 'SECURE\nDOOR',
    color: 0x44ff88,
    description: 'You badge into the secure\nserver room. A person in\na delivery uniform rushes\nbehind you before the door closes.',
    prompt: 'What do you do?',
    choices: [
      {
        text: '🚪 Hold the door open',
        outcome: 'risky',
        feedback: 'Tailgating is a major physical\nsecurity risk! Unauthorized people\ncould access sensitive systems!',
      },
      {
        text: '🪪 Ask them to badge in',
        outcome: 'correct',
        feedback: 'Great security awareness! Every\nperson must badge in individually.\nThe delivery person had no clearance!',
      },
      {
        text: '🏃 Walk away quickly',
        outcome: 'neutral',
        feedback: 'Walking away avoids confrontation\nbut the person may still get in\nbehind you. Politely challenge them!',
      },
    ],
  },
];

export const OUTCOME_SCORES = {
  correct: { security: 10, risk: -5 },
  risky:   { security: -15, risk: 20 },
  neutral: { security: -5, risk: 5 },
};
