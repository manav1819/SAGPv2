// =============================================================================
// CYBER CARNIVAL: THREAT HUNT — Game Configuration
// SAGP (Security Awareness Gamification Platform)
// =============================================================================

export const GAME_W = 1280;
export const GAME_H = 720;
export const ROUND_DURATION = 90;       // seconds
export const AMMO_MAX = 12;
export const RELOAD_TIME = 1800;        // ms
export const COMBO_DECAY = 5000;        // ms without hit before combo resets
export const FOCUS_COMBO = 10;          // combo count to trigger Focus Mode
export const FOCUS_DURATION = 6000;     // ms
export const BOSS_INTERVAL = 35000;     // ms between boss spawns
export const EVENT_INTERVAL = 20000;    // ms between random events

// ── SCORING ──────────────────────────────────────────────────────────────────
export const SCORE_HIT_BAD       = 100;  // base points for threat hit
export const SCORE_HEADSHOT      = 250;  // headshot bonus (top 20% of target)
export const SCORE_MISS_PENALTY  = -25;  // missed shot
export const SCORE_FRIENDLY_FIRE = -300; // shot a good target
export const SCORE_TIMEOUT       = -50;  // bad target escaped

// ── GRADES ───────────────────────────────────────────────────────────────────
export const GRADES = [
    { label: 'S', minAcc: 90, minScore: 8000, color: '#ff00ff' },
    { label: 'A', minAcc: 75, minScore: 5000, color: '#00ffff' },
    { label: 'B', minAcc: 60, minScore: 3000, color: '#44ff44' },
    { label: 'C', minAcc: 45, minScore: 1500, color: '#ffff00' },
    { label: 'D', minAcc:  0, minScore:    0, color: '#ff6600' },
];

// ── CARNIVAL PALETTE ─────────────────────────────────────────────────────────
// ALL targets (good and bad) share the same visual palette.
// Players must read and interpret content — not colour-match.
const CP = {
    brass:      0xC8941A,   // tarnished brass (borders, icons)
    brassLight: 0xE8C050,   // light gold (accent)
    wood:       0x2A1500,   // dark mahogany (panel bg)
    stripeRed:  0x8B1A0A,   // carnival booth red (top stripe — decorative only)
};

// ── TARGET TYPES ─────────────────────────────────────────────────────────────
// Every target uses the same carnival palette.
// isGood determines game logic ONLY — NOT visuals.
// label / subLabel are the ONLY identifiers the player should rely on.

export const TARGET_TYPES = [

    // ══════════════════════════════════════════════
    //  BAD TARGETS — SHOOT THESE
    // ══════════════════════════════════════════════
    {
        id: 'weak_pw_1', label: 'Password123', subLabel: 'WEAK PASSWORD',
        tip: 'Predictable passwords are cracked in seconds. Use a password manager.',
        isGood: false, points: 100, health: 1, weight: 12,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'lock_broken', movementType: 'slide',
    },
    {
        id: 'weak_pw_2', label: 'Welcome1!', subLabel: 'WEAK PASSWORD',
        tip: 'Default credentials are hacker gold. Change every default password.',
        isGood: false, points: 100, health: 1, weight: 10,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'lock_broken', movementType: 'pendulum',
    },
    {
        id: 'phishing_email', label: 'CLICK HERE!!!', subLabel: 'PHISHING EMAIL',
        tip: 'Urgency + link = phishing. Always verify the sender before clicking.',
        isGood: false, points: 150, health: 1, weight: 11,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'email_evil', movementType: 'flyby',
    },
    {
        id: 'malware_usb', label: 'FREE STUFF USB', subLabel: 'MYSTERY USB',
        tip: 'Found a USB drive? Report it — never plug it in!',
        isGood: false, points: 175, health: 1, weight: 9,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'usb_skull', movementType: 'popup',
    },
    {
        id: 'fake_popup', label: 'URGENT: VERIFY NOW', subLabel: 'FAKE POPUP',
        tip: 'Fake urgency is a social engineering tactic. Pause before acting.',
        isGood: false, points: 125, health: 1, weight: 12,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'popup', movementType: 'hover',
    },
    {
        id: 'invoice_exe', label: 'invoice.exe', subLabel: 'MALICIOUS FILE',
        tip: 'Executable email attachments are almost always malware. Never open them.',
        isGood: false, points: 200, health: 1, weight: 8,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'file_evil', movementType: 'zigzag',
    },
    {
        id: 'qr_scam', label: 'FREE ROBUX!', subLabel: 'QR SCAM',
        tip: 'Malicious QR codes redirect to phishing sites. Verify before scanning.',
        isGood: false, points: 150, health: 1, weight: 10,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'qr_evil', movementType: 'slide',
    },
    {
        id: 'crypto_scam', label: 'GET RICH FAST!', subLabel: 'CRYPTO SCAM',
        tip: 'If it sounds too good to be true — it is. Scammers exploit greed.',
        isGood: false, points: 175, health: 1, weight: 8,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'money_skull', movementType: 'flyby',
    },
    {
        id: 'mfa_disabled', label: 'MFA Disabled', subLabel: 'NO 2FA ACTIVE',
        tip: 'Accounts without MFA are 99% more likely to be compromised.',
        isGood: false, points: 200, health: 1, weight: 7,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'shield_broken', movementType: 'pendulum',
    },
    {
        id: 'fake_support', label: 'CALL NOW! VIRUS!', subLabel: 'FAKE SUPPORT',
        tip: 'Microsoft and Apple will never cold-call you about viruses.',
        isGood: false, points: 150, health: 1, weight: 9,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'phone_evil', movementType: 'popup',
    },
    {
        id: 'public_wifi', label: 'FREE WIFI! JOIN', subLabel: 'EVIL TWIN AP',
        tip: 'Unsecured public WiFi can expose all your traffic to attackers.',
        isGood: false, points: 125, health: 1, weight: 8,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'wifi_evil', movementType: 'hover',
    },
    {
        id: 'hacker_clown', label: 'H4X0R', subLabel: 'THREAT ACTOR',
        tip: 'Human error is the #1 attack vector — stay vigilant.',
        isGood: false, points: 300, health: 2, weight: 4,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'clown', movementType: 'zigzag',
    },

    // ══════════════════════════════════════════════
    //  GOOD TARGETS — DO NOT SHOOT
    // ══════════════════════════════════════════════
    {
        id: 'mfa_enabled', label: 'MFA Enabled ✓', subLabel: 'ACTIVE 2FA',
        tip: 'MFA blocks 99.9% of automated attacks. Enable it everywhere.',
        isGood: true, points: 0, health: 1, weight: 8,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'shield_ok', movementType: 'slide',
    },
    {
        id: 'pwd_manager', label: 'Password Manager', subLabel: 'SECURE VAULT',
        tip: 'Password managers generate and store strong, unique passwords.',
        isGood: true, points: 0, health: 1, weight: 7,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'vault', movementType: 'pendulum',
    },
    {
        id: 'https_lock', label: 'HTTPS Secured ✓', subLabel: 'VERIFIED SITE',
        tip: 'Always check for HTTPS before entering credentials.',
        isGood: true, points: 0, health: 1, weight: 8,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'lock_ok', movementType: 'flyby',
    },
    {
        id: 'report_phish', label: 'Report Phishing', subLabel: 'SECURITY ACTION',
        tip: 'Reporting phishing protects your entire organization. Always report.',
        isGood: true, points: 0, health: 1, weight: 6,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'flag', movementType: 'popup',
    },
    {
        id: 'software_update', label: 'System Updated ✓', subLabel: 'PATCHES APPLIED',
        tip: 'Most breaches exploit known, patchable vulnerabilities. Update often.',
        isGood: true, points: 0, health: 1, weight: 7,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'update_shield', movementType: 'hover',
    },
    {
        id: 'zero_trust', label: 'Zero Trust Policy', subLabel: 'ACCESS CONTROL',
        tip: 'Never trust, always verify — the zero-trust security model.',
        isGood: true, points: 0, health: 1, weight: 5,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'zero_trust', movementType: 'zigzag',
    },
    {
        id: 'security_team', label: 'Security Team ✓', subLabel: 'SOC DEFENDERS',
        tip: 'Your security team is on your side — report incidents immediately.',
        isGood: true, points: 0, health: 1, weight: 5,
        primaryColor: CP.brass, accentColor: CP.brassLight,
        bgColor: CP.wood, icon: 'team', movementType: 'slide',
    },
];

// ── BOSS TYPES ────────────────────────────────────────────────────────────────
// Bosses are always threats and are distinguished by their size and BOSS label,
// not colour alone — but we keep a more dramatic palette for these special encounters.
export const BOSS_TYPES = [
    {
        id: 'ransomware_clown', label: 'RANSOMWARE', subLabel: 'BOSS',
        tip: 'Ransomware encrypts your data and demands payment. Backups are critical.',
        health: 5, points: 1000,
        primaryColor: 0xC8941A, accentColor: 0xE8C050,
        size: 140,
    },
    {
        id: 'phishing_king', label: 'PHISH KING', subLabel: 'BOSS',
        tip: '91% of all cyberattacks start with a phishing email.',
        health: 4, points: 800,
        primaryColor: 0xC8941A, accentColor: 0xE8C050,
        size: 130,
    },
    {
        id: 'evil_ai', label: 'EVIL AI BOT', subLabel: 'BOSS',
        tip: 'AI-generated phishing is increasingly convincing. Stay sceptical.',
        health: 6, points: 1200,
        primaryColor: 0xC8941A, accentColor: 0xE8C050,
        size: 150,
    },
];

// ── RANDOM EVENTS ─────────────────────────────────────────────────────────────
export const RANDOM_EVENTS = [
    { id: 'usb_rain',       label: '☠ USB RAIN!',       duration: 6000 },
    { id: 'popup_invasion', label: '⚠ POPUP INVASION!',  duration: 5000 },
    { id: 'ddos_mode',      label: '💥 DDoS WAVE!',       duration: 7000 },
    { id: 'lights_flicker', label: '⚡ POWER SURGE!',     duration: 3000 },
    { id: 'phish_storm',    label: '🎣 PHISHING STORM!',  duration: 6000 },
];

// ── COLORS ────────────────────────────────────────────────────────────────────
export const COLORS = {
    neonPink:   0xff00ff,
    neonCyan:   0x00ffff,
    neonGreen:  0x00ff88,
    neonOrange: 0xff6600,
    neonYellow: 0xffff00,
    darkBg:     0x050510,
    panelBg:    0x0a0520,
    threatRed:  0xff2222,
    safeGreen:  0x00ff66,
};
