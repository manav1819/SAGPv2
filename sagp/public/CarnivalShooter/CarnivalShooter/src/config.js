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

// ── TARGET PALETTE ────────────────────────────────────────────────────────────
// Each target: { id, label, subLabel, tip, isGood, points, health, weight,
//               primaryColor, accentColor, icon, movementType }
// movementType: 'slide' | 'popup' | 'zigzag' | 'pendulum' | 'flyby' | 'hover'

export const TARGET_TYPES = [

    // ══════════════════════════════════════════════
    //  BAD TARGETS — SHOOT THESE
    // ══════════════════════════════════════════════
    {
        id: 'weak_pw_1', label: 'Password123', subLabel: 'WEAK PASSWORD',
        tip: 'Predictable passwords are cracked in seconds.',
        isGood: false, points: 100, health: 1, weight: 12,
        primaryColor: 0xff2222, accentColor: 0xff6666,
        bgColor: 0x1a0000, icon: 'lock_broken', movementType: 'slide',
    },
    {
        id: 'weak_pw_2', label: 'Welcome1!', subLabel: 'WEAK PASSWORD',
        tip: 'Default credentials are hacker gold.',
        isGood: false, points: 100, health: 1, weight: 10,
        primaryColor: 0xff2222, accentColor: 0xff6666,
        bgColor: 0x1a0000, icon: 'lock_broken', movementType: 'pendulum',
    },
    {
        id: 'phishing_email', label: 'CLICK HERE!!!', subLabel: 'PHISHING EMAIL',
        tip: 'Urgency + link = phishing. Always verify the sender.',
        isGood: false, points: 150, health: 1, weight: 11,
        primaryColor: 0xff6600, accentColor: 0xffaa44,
        bgColor: 0x1a0800, icon: 'email_evil', movementType: 'flyby',
    },
    {
        id: 'malware_usb', label: 'FREE STUFF', subLabel: 'MYSTERY USB',
        tip: 'Found a USB? Report it — never plug it in!',
        isGood: false, points: 175, health: 1, weight: 9,
        primaryColor: 0xdd00dd, accentColor: 0xff44ff,
        bgColor: 0x1a001a, icon: 'usb_skull', movementType: 'popup',
    },
    {
        id: 'fake_popup', label: 'VERIFY NOW!!!', subLabel: 'FAKE POPUP',
        tip: 'Fake urgency is a social engineering tactic.',
        isGood: false, points: 125, health: 1, weight: 12,
        primaryColor: 0xff3300, accentColor: 0xff7744,
        bgColor: 0x200000, icon: 'popup', movementType: 'hover',
    },
    {
        id: 'invoice_exe', label: 'invoice.exe', subLabel: 'MALICIOUS FILE',
        tip: 'Executable attachments are almost always malware.',
        isGood: false, points: 200, health: 1, weight: 8,
        primaryColor: 0xcc0000, accentColor: 0xff4444,
        bgColor: 0x1a0000, icon: 'file_evil', movementType: 'zigzag',
    },
    {
        id: 'qr_scam', label: 'FREE ROBUX!', subLabel: 'QR SCAM',
        tip: 'QR codes can redirect to phishing sites.',
        isGood: false, points: 150, health: 1, weight: 10,
        primaryColor: 0xff9900, accentColor: 0xffcc44,
        bgColor: 0x1a0f00, icon: 'qr_evil', movementType: 'slide',
    },
    {
        id: 'crypto_scam', label: 'GET RICH FAST', subLabel: 'CRYPTO SCAM',
        tip: 'If it sounds too good to be true — it is.',
        isGood: false, points: 175, health: 1, weight: 8,
        primaryColor: 0xffcc00, accentColor: 0xffee66,
        bgColor: 0x1a1400, icon: 'money_skull', movementType: 'flyby',
    },
    {
        id: 'mfa_disabled', label: 'MFA: OFF', subLabel: 'NO 2FA!',
        tip: 'Accounts without MFA are 99% more likely to be compromised.',
        isGood: false, points: 200, health: 1, weight: 7,
        primaryColor: 0xff0000, accentColor: 0xff4444,
        bgColor: 0x1a0000, icon: 'shield_broken', movementType: 'pendulum',
    },
    {
        id: 'fake_support', label: 'CALL NOW!', subLabel: 'FAKE SUPPORT',
        tip: 'Microsoft/Apple will never cold-call you about viruses.',
        isGood: false, points: 150, health: 1, weight: 9,
        primaryColor: 0xff3300, accentColor: 0xff7700,
        bgColor: 0x1a0500, icon: 'phone_evil', movementType: 'popup',
    },
    {
        id: 'public_wifi', label: 'FREE WIFI!', subLabel: 'EVIL TWIN',
        tip: 'Unsecured public WiFi can expose all your traffic.',
        isGood: false, points: 125, health: 1, weight: 8,
        primaryColor: 0xff6600, accentColor: 0xffaa00,
        bgColor: 0x1a0800, icon: 'wifi_evil', movementType: 'hover',
    },
    {
        id: 'hacker_clown', label: 'H4X0R', subLabel: 'THREAT ACTOR',
        tip: 'Human error is the #1 attack vector.',
        isGood: false, points: 300, health: 2, weight: 4,
        primaryColor: 0xff0066, accentColor: 0xff44aa,
        bgColor: 0x1a0010, icon: 'clown', movementType: 'zigzag',
    },

    // ══════════════════════════════════════════════
    //  GOOD TARGETS — DO NOT SHOOT
    // ══════════════════════════════════════════════
    {
        id: 'mfa_enabled', label: 'MFA ON ✓', subLabel: 'PROTECTED',
        tip: 'MFA blocks 99.9% of automated attacks.',
        isGood: true, points: 0, health: 1, weight: 8,
        primaryColor: 0x00ff66, accentColor: 0x44ffaa,
        bgColor: 0x001a10, icon: 'shield_ok', movementType: 'slide',
    },
    {
        id: 'pwd_manager', label: 'PWD VAULT', subLabel: 'PASSWORD MGR',
        tip: 'Password managers generate strong unique passwords.',
        isGood: true, points: 0, health: 1, weight: 7,
        primaryColor: 0x00ccff, accentColor: 0x44eeff,
        bgColor: 0x00101a, icon: 'vault', movementType: 'pendulum',
    },
    {
        id: 'https_lock', label: 'HTTPS ✓', subLabel: 'SECURE SITE',
        tip: 'Always check for HTTPS before entering credentials.',
        isGood: true, points: 0, health: 1, weight: 8,
        primaryColor: 0x00ff88, accentColor: 0x44ffcc,
        bgColor: 0x001a10, icon: 'lock_ok', movementType: 'flyby',
    },
    {
        id: 'report_phish', label: 'REPORT IT!', subLabel: 'REPORT BTN',
        tip: 'Reporting phishing protects your entire organization.',
        isGood: true, points: 0, health: 1, weight: 6,
        primaryColor: 0x44ff44, accentColor: 0x88ff88,
        bgColor: 0x001a00, icon: 'flag', movementType: 'popup',
    },
    {
        id: 'software_update', label: 'UPDATED ✓', subLabel: 'PATCHED',
        tip: 'Most breaches exploit known, patchable vulnerabilities.',
        isGood: true, points: 0, health: 1, weight: 7,
        primaryColor: 0x0099ff, accentColor: 0x44bbff,
        bgColor: 0x000f1a, icon: 'update_shield', movementType: 'hover',
    },
    {
        id: 'zero_trust', label: 'ZERO TRUST', subLabel: 'POLICY',
        tip: 'Never trust, always verify — the zero trust model.',
        isGood: true, points: 0, health: 1, weight: 5,
        primaryColor: 0x00ccff, accentColor: 0x44eeff,
        bgColor: 0x00101a, icon: 'zero_trust', movementType: 'zigzag',
    },
    {
        id: 'security_team', label: 'SOC TEAM ✓', subLabel: 'DEFENDERS',
        tip: 'Your security team is on your side — work with them!',
        isGood: true, points: 0, health: 1, weight: 5,
        primaryColor: 0x00ffcc, accentColor: 0x44ffee,
        bgColor: 0x001a14, icon: 'team', movementType: 'slide',
    },
];

// ── BOSS TYPES ────────────────────────────────────────────────────────────────
export const BOSS_TYPES = [
    {
        id: 'ransomware_clown', label: 'RANSOMWARE', subLabel: 'BOSS',
        tip: 'Ransomware encrypts your data and demands payment.',
        health: 5, points: 1000,
        primaryColor: 0xff0000, accentColor: 0xff4444,
        size: 140,
    },
    {
        id: 'phishing_king', label: 'PHISH KING', subLabel: 'BOSS',
        tip: '91% of all cyberattacks start with a phishing email.',
        health: 4, points: 800,
        primaryColor: 0xff6600, accentColor: 0xff9900,
        size: 130,
    },
    {
        id: 'evil_ai', label: 'EVIL AI BOT', subLabel: 'BOSS',
        tip: 'AI-generated phishing is increasingly convincing.',
        health: 6, points: 1200,
        primaryColor: 0xff00ff, accentColor: 0xff44ff,
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
