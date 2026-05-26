export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.onChoice = null;
  }

  show(scenario, scoreManager, onChoice) {
    this.onChoice = onChoice;
    if (this.container) this.container.destroy();

    const W = 960, H = 640;
    const boxW = 700, boxH = 340;
    const bx = (W - boxW) / 2, by = H - boxH - 20;

    const c = this.scene.add.container(0, 0).setDepth(50);
    this.container = c;

    // Dim overlay
    const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
    c.add(overlay);

    // Panel background
    const panel = this.scene.add.rectangle(bx + boxW / 2, by + boxH / 2, boxW, boxH, 0x0d1b2a, 0.97)
      .setStrokeStyle(2, 0x00aaff);
    c.add(panel);

    // Top colour bar
    const bar = this.scene.add.rectangle(bx + boxW / 2, by + 24, boxW, 48, scenario.color, 0.85);
    c.add(bar);

    // Title
    const title = this.scene.add.text(bx + 20, by + 12, scenario.title, {
      fontSize: '20px', fontFamily: 'Courier New', color: '#ffffff', fontStyle: 'bold',
    });
    c.add(title);

    // Description
    const desc = this.scene.add.text(bx + 20, by + 58, scenario.description, {
      fontSize: '13px', fontFamily: 'Courier New', color: '#ccddff',
      wordWrap: { width: boxW - 40 }, lineSpacing: 5,
    });
    c.add(desc);

    // Prompt
    const prompt = this.scene.add.text(bx + 20, by + 175, scenario.prompt, {
      fontSize: '14px', fontFamily: 'Courier New', color: '#ffdd88', fontStyle: 'bold',
    });
    c.add(prompt);

    // Choice buttons
    scenario.choices.forEach((choice, i) => {
      const btnX = bx + 20;
      const btnY = by + 200 + i * 44;
      const btnW = boxW - 40;

      const bg = this.scene.add.rectangle(btnX + btnW / 2, btnY + 18, btnW, 38, 0x112233)
        .setStrokeStyle(1, 0x334455)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add.text(btnX + 12, btnY + 8, choice.text, {
        fontSize: '14px', fontFamily: 'Courier New', color: '#eeeeff',
      });

      bg.on('pointerover', () => {
        bg.setFillStyle(0x1a3355);
        bg.setStrokeStyle(2, 0x00aaff);
        label.setColor('#ffffff');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x112233);
        bg.setStrokeStyle(1, 0x334455);
        label.setColor('#eeeeff');
      });
      bg.on('pointerdown', () => this._handleChoice(choice, scoreManager));

      c.add(bg);
      c.add(label);
    });

    // Slide in
    c.setAlpha(0);
    this.scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
  }

  _handleChoice(choice, scoreManager) {
    if (!this.container) return;
    const { OUTCOME_SCORES } = window._gameData;
    const delta = OUTCOME_SCORES[choice.outcome];
    scoreManager.applyOutcome('', choice.outcome, delta);

    this._showFeedback(choice, scoreManager);
  }

  _showFeedback(choice, scoreManager) {
    if (this.container) this.container.destroy();

    const W = 960, H = 640;
    const boxW = 620, boxH = 220;
    const bx = (W - boxW) / 2, by = (H - boxH) / 2;

    const c = this.scene.add.container(0, 0).setDepth(51);
    this.container = c;

    const colorMap = { correct: 0x00aa44, risky: 0xaa0000, neutral: 0xaa7700 };
    const col = colorMap[choice.outcome];

    const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    c.add(overlay);

    const panel = this.scene.add.rectangle(bx + boxW / 2, by + boxH / 2, boxW, boxH, 0x0d1b2a)
      .setStrokeStyle(3, col);
    c.add(panel);

    const badgeMap = { correct: '✅ SECURE CHOICE', risky: '🚨 RISKY CHOICE', neutral: '⚠️ NEUTRAL CHOICE' };
    const badge = this.scene.add.text(bx + boxW / 2, by + 28, badgeMap[choice.outcome], {
      fontSize: '18px', fontFamily: 'Courier New', color: '#' + col.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add(badge);

    const fb = this.scene.add.text(bx + 24, by + 60, choice.feedback, {
      fontSize: '14px', fontFamily: 'Courier New', color: '#ccddff',
      wordWrap: { width: boxW - 48 }, lineSpacing: 6,
    });
    c.add(fb);

    const scoreText = this.scene.add.text(bx + 24, by + 148,
      `🛡 Security: ${scoreManager.securityScore}   ⚠ Risk: ${scoreManager.riskScore}`, {
      fontSize: '14px', fontFamily: 'Courier New', color: '#ffdd88',
    });
    c.add(scoreText);

    const cont = this.scene.add.text(bx + boxW / 2, by + 188, '[ Click or press SPACE to continue ]', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#888888',
    }).setOrigin(0.5);
    c.add(cont);

    this.scene.tweens.add({ targets: cont, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    const close = () => {
      this.scene.input.keyboard.off('keydown-SPACE', close);
      if (this.container) { this.container.destroy(); this.container = null; }
      if (this.onChoice) this.onChoice();
    };

    this.scene.input.once('pointerdown', close);
    this.scene.input.keyboard.once('keydown-SPACE', close);
  }

  isVisible() {
    return this.container !== null;
  }

  destroy() {
    if (this.container) { this.container.destroy(); this.container = null; }
  }
}
