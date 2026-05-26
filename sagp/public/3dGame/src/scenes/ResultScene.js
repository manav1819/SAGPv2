export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  init(data) {
    this.securityScore = data.securityScore ?? 100;
    this.riskScore     = data.riskScore     ?? 0;
    this.completed     = data.completed     ?? [];
  }

  create() {
    const W = 960, H = 640;
    const cat = this._getRiskCategory();
    const isChamp = this.securityScore >= 130;
    const g = this.add.graphics();

    // ── Background ─────────────────────────────────────────────────────────
    g.fillStyle(0x060c12, 1);
    g.fillRect(0, 0, W, H);

    // Scanlines
    g.lineStyle(1, 0x001100, 0.25);
    for (let y = 0; y < H; y += 4) g.lineBetween(0, y, W, y);

    // Vertical light bars
    for (let x = 0; x < W; x += 80) {
      g.fillStyle(0x001122, 0.15);
      g.fillRect(x, 0, 2, H);
    }

    // Header glow
    const hCol = isChamp ? 0x00aa55 : cat.hexColor;
    g.fillStyle(hCol, 0.12);
    g.fillRect(0, 0, W, 170);
    g.lineStyle(2, hCol, 0.6);
    g.lineBetween(0, 170, W, 170);

    // ── Title ─────────────────────────────────────────────────────────────
    const titleStr = isChamp ? '🏆 SECURITY CHAMPION!' : `${cat.emoji} ${cat.label}`;
    this.add.text(W / 2, 52, titleStr, {
      fontSize: '40px', fontFamily: 'Courier New',
      color: isChamp ? '#00ff88' : cat.color,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W / 2, 112, 'CYBERGUARD  ·  TRAINING COMPLETE', {
      fontSize: '14px', fontFamily: 'Courier New',
      color: '#44668a', letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 140, 'AcmeCorp Security Awareness Programme', {
      fontSize: '10px', fontFamily: 'Courier New', color: '#2a3f55',
    }).setOrigin(0.5);

    // ── Score Panels ────────────────────────────────────────────────────────
    this._panel(g, W / 2 - 185, 220, 230, 90, '🛡 SECURITY SCORE', `${this.securityScore}`,
      '#44ffaa', 0x003322, 0x00aa55);
    this._panel(g, W / 2 + 185, 220, 230, 90, '⚠ RISK SCORE', `${this.riskScore}`,
      cat.color, cat.hexColor >> 1, cat.hexColor);

    // ── Security bar ─────────────────────────────────────────────────────
    const barW = 380;
    const barX = W / 2 - barW / 2;
    g.fillStyle(0x112233, 1);
    g.fillRoundedRect(barX, 282, barW, 10, 4);
    const fill = Math.min(this.securityScore / 200, 1);
    g.fillStyle(isChamp ? 0x00ff88 : 0x44aaff, 1);
    g.fillRoundedRect(barX, 282, barW * fill, 10, 4);
    this.add.text(W / 2, 302, `Security level: ${Math.round(fill * 100)}%`, {
      fontSize: '10px', fontFamily: 'Courier New', color: '#335577',
    }).setOrigin(0.5);

    // ── Decisions Breakdown ────────────────────────────────────────────────
    this.add.text(W / 2, 328, '── YOUR DECISIONS ──', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#3a6080', fontStyle: 'bold',
    }).setOrigin(0.5);

    const icons   = { correct: '✅', risky: '🚨', neutral: '⚠️' };
    const colors  = { correct: '#44ff88', risky: '#ff4444', neutral: '#ffaa44' };
    const bgCols  = { correct: 0x003322, risky: 0x330011, neutral: 0x332200 };
    const names   = {
      phishing_email: 'Suspicious Email', usb_drive: 'USB Drive',
      fake_it_support: 'Fake IT Support',  mfa_fatigue: 'MFA Fatigue',
      tailgating: 'Tailgating Door',
    };

    this.completed.forEach((item, i) => {
      const col = i < 3 ? 0 : 1;
      const row = i < 3 ? i : i - 3;
      const bx  = W / 2 - 270 + col * 300;
      const by  = 348 + row * 38;
      const nm  = names[item.scenarioId] || item.scenarioId;
      const ico = icons[item.outcome]  || '❓';
      const clr = colors[item.outcome] || '#ffffff';

      g.fillStyle(bgCols[item.outcome] || 0x112233, 1);
      g.fillRoundedRect(bx, by - 4, 280, 34, 5);
      g.lineStyle(1, parseInt(clr.replace('#',''), 16), 0.4);
      g.strokeRoundedRect(bx, by - 4, 280, 34, 5);

      this.add.text(bx + 10, by + 8, `${ico} ${nm}`, {
        fontSize: '13px', fontFamily: 'Courier New', color: clr,
      }).setOrigin(0, 0.5);
    });

    // ── Advice ─────────────────────────────────────────────────────────────
    g.fillStyle(0x0a1a2a, 1);
    g.fillRoundedRect(W / 2 - 360, 488, 720, 60, 8);
    g.lineStyle(1, 0x1a3a5a, 1);
    g.strokeRoundedRect(W / 2 - 360, 488, 720, 60, 8);

    this.add.text(W / 2, 518, this._getAdvice(), {
      fontSize: '12px', fontFamily: 'Courier New', color: '#7799bb',
      align: 'center', wordWrap: { width: 700 }, lineSpacing: 5,
    }).setOrigin(0.5);

    // ── Buttons ─────────────────────────────────────────────────────────────
    this._btn(W / 2 - 130, 590, '▶  PLAY AGAIN',  '#00ff88', 0x002211, () => {
      this.scene.start('GameScene', {});
    });
    this._btn(W / 2 + 130, 590, '🏠  MAIN MENU', '#44aaff', 0x001133, () => {
      this.scene.start('BootScene');
    });

    this.cameras.main.fadeIn(600);
  }

  _panel(g, cx, cy, pw, ph, label, value, textColor, bgCol, borderCol) {
    g.fillStyle(bgCol, 1);
    g.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 8);
    g.lineStyle(2, borderCol, 0.8);
    g.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 8);

    this.add.text(cx, cy - 24, label, {
      fontSize: '11px', fontFamily: 'Courier New', color: '#5588aa',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 14, value, {
      fontSize: '38px', fontFamily: 'Courier New',
      color: textColor, fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  _btn(cx, cy, text, textColor, bgColor, cb) {
    const btn = this.add.text(cx, cy, text, {
      fontSize: '15px', fontFamily: 'Courier New', color: textColor,
      backgroundColor: '#' + bgColor.toString(16).padStart(6, '0'),
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setScale(1.07));
    btn.on('pointerout',   () => btn.setScale(1));
    btn.on('pointerdown',  cb);
    return btn;
  }

  _getRiskCategory() {
    if (this.riskScore <= 25) return { label:'LOW RISK',    color:'#44ff88', hexColor:0x00aa44, emoji:'🛡️' };
    if (this.riskScore <= 60) return { label:'MEDIUM RISK', color:'#ffaa00', hexColor:0xaa7700, emoji:'⚠️' };
    return                          { label:'HIGH RISK',   color:'#ff4444', hexColor:0xaa0000, emoji:'🚨' };
  }

  _getAdvice() {
    if (this.securityScore >= 130) return '🏆 Outstanding! You demonstrate exemplary security awareness.\nYou are a true defender of AcmeCorp!';
    if (this.riskScore <= 25)      return '✅ Well done! Your choices were mostly secure.\nKeep reporting threats and verifying identities!';
    if (this.riskScore <= 60)      return '⚠️ You made some risky decisions. Review phishing,\nphysical security, and MFA best practices.';
    return '🚨 High risk profile. Several choices could cause a real breach.\nPlease complete full security awareness training immediately.';
  }
}
