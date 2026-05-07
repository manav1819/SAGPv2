// ============================================================
//  src/scenes/InboxScene.js  –  Phishing Simulator Game
//  Security Awareness Training Game  |  Phaser 3
//
//  Gameplay:
//    - Player is shown 10 emails (5 phishing, 5 legit)
//    - Click LEGITIMATE or PHISHING for each email
//    - Wrong answer = lose 1 life (3 lives total)
//    - All 3 lives lost = game over (death)
//    - Score system: 100 base + speed bonus + streak bonus
//    - Response time silently recorded per email
//    - Session data sent to GameOverScene for report
// ============================================================

export default class InboxScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InboxScene' });
  }

  // ----------------------------------------------------------
  //  INIT  – receives playerName from Start.js
  // ----------------------------------------------------------
  init(data) {
    this.playerName = data.playerName || 'Agent';

    // Session record — will be passed to GameOverScene
    this.sessionData = {
      playerName:       this.playerName,
      sessionId:        Date.now().toString(),
      sessionDate:      new Date().toISOString(),
      emails:           [],   // filled per answer
      finalScore:       0,
      livesUsed:        0,
      livesRemaining:   3,
      accuracy:         0,
      avgResponseTimeMs: 0,
    };
  }

  // ----------------------------------------------------------
  //  PRELOAD  – audio & sprites (JSON already cached by Start)
  // ----------------------------------------------------------
  preload() {
    // All audio was loaded in Start.js — nothing extra needed here
    // (Phaser caches by key; re-loading the same key is a no-op)
  }

  // ----------------------------------------------------------
  //  CREATE
  // ----------------------------------------------------------
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBackground(W, H);
    this.scrollSpeeds = { far: 0.08, mid: 0.18, fg: 0.42 };

    // ── Game state ─────────────────────────────────────────
    this.score        = 0;
    this.lives        = 3;
    this.streak       = 0;
    this.currentIndex = 0;
    this.isAnswering  = false;
    this.emailStartTime = 0;
    this.emailCard    = null;

    // ── Select 10 emails (balanced) ────────────────────────
    const allEmails = this.cache.json.get('emails');
    this.gameEmails = this._selectEmails(allEmails, 10);

    // ── Character (bottom-center) ──────────────────────────
    this.character = this.add.sprite(W * 0.5, H - 28, 'character')
      .setScale(2.5)
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.character.play('idle');

    this.character.on('animationcomplete', (anim) => {
      if (['attack', 'attack_heavy', 'cast', 'hurt'].includes(anim.key)) {
        this.character.play('idle');
      }
    });

    // ── Advisor NPC (bottom-left) ──────────────────────────
    this.advisorIndex = Phaser.Math.Between(1, 4);
    this.advisorSprite = this.add.image(72, H - 58, `sprite${this.advisorIndex}happy`)
      .setScale(0.75)
      .setDepth(14);

    // Advisor label
    this.add.text(72, H - 14, 'Advisor', {
      fontSize: '10px', color: '#7ab3cc',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5, 1).setDepth(14);

    // ── HUD ────────────────────────────────────────────────
    this._buildHUD(W, H);

    // ── Start background music ─────────────────────────────
    this.bgMusic = this.sound.add('gameMusic', { loop: true, volume: 0.38 });
    this.bgMusic.play();

    // ── Fade in then show first email ─────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.time.delayedCall(700, () => this._showNextEmail());
  }

  // ----------------------------------------------------------
  //  UPDATE – parallax scroll
  // ----------------------------------------------------------
  update() {
    this.cloudsFar.tilePositionX -= this.scrollSpeeds.far;
    this.cloudsMid.tilePositionX -= this.scrollSpeeds.mid;
    this.cloudsFg.tilePositionX  -= this.scrollSpeeds.fg;
  }

  // ==========================================================
  //  EMAIL SELECTION
  // ==========================================================

  _selectEmails(allEmails, count) {
    // Filter out garbled/encoding-broken subjects and adult content
    const SKIP = ['penis', 'pecker', 'dick', 'enlarg', 'playboy', 'sex is', 'bed!',
                  '?m?', '?????', 'yl vivian', 'centrefold'];

    const clean = allEmails.filter(e => {
      if (!e.subject || !e.body || !e.sender) return false;
      if (e.subject.length > 120) return false;
      const haystack = (e.subject + ' ' + e.body).toLowerCase();
      return !SKIP.some(kw => haystack.includes(kw));
    });

    // Separate by label
    const phishing = Phaser.Utils.Array.Shuffle(clean.filter(e => e.label === 1));
    const legit    = Phaser.Utils.Array.Shuffle(clean.filter(e => e.label === 0));

    const numPhish = Math.ceil(count / 2);  // 5
    const numLegit = Math.floor(count / 2); // 5

    const selection = [
      ...phishing.slice(0, numPhish),
      ...legit.slice(0, numLegit),
    ];

    return Phaser.Utils.Array.Shuffle(selection);
  }

  // ==========================================================
  //  EMAIL CARD
  // ==========================================================

  _showNextEmail() {
    if (this.currentIndex >= this.gameEmails.length) {
      // Completed all emails — WIN!
      this._endGame(true);
      return;
    }

    const email = this.gameEmails[this.currentIndex];
    this.emailStartTime = Date.now();

    this._buildEmailCard(email);
    this._updateEmailCountHUD();

    this.sound.play('sfxEmailOpen', { volume: 0.55 });
  }

  _buildEmailCard(email) {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const cy = H / 2 - 18;

    // Destroy any existing card
    if (this.emailCard) {
      this.emailCard.destroy();
      this.emailCard = null;
    }

    // ── Layout constants ───────────────────────────────────
    const CW = 570;  // card width
    const CH = 380;  // card height (expanded to show full body)
    const hx = -CW / 2;
    const hy = -CH / 2;

    // ── Parse sender ───────────────────────────────────────
    const senderRaw  = email.sender || '';
    const nameMatch  = senderRaw.match(/^"?([^"<]+)"?\s*</);
    const emailMatch = senderRaw.match(/<(.+?)>/);
    const senderName  = (nameMatch  ? nameMatch[1].trim()  : '').substring(0, 42);
    const senderEmail = (emailMatch ? emailMatch[1].trim() : senderRaw).substring(0, 50);

    // ── Full body text ─────────────────────────────────────
    const rawBody = email.body
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const bodyText = rawBody.length > 800 ? rawBody.substring(0, 800) + '…' : rawBody;

    // ── Graphics: card body ────────────────────────────────
    const cardBg = this.add.graphics();
    // Outer shadow
    cardBg.fillStyle(0x000000, 0.45);
    cardBg.fillRoundedRect(hx + 4, hy + 4, CW, CH, 14);
    // Card background
    cardBg.fillStyle(0x0c1e35, 0.98);
    cardBg.fillRoundedRect(hx, hy, CW, CH, 14);
    // Card border
    cardBg.lineStyle(1.5, 0x26476a, 1);
    cardBg.strokeRoundedRect(hx, hy, CW, CH, 14);

    // ── Header bar ─────────────────────────────────────────
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x102845, 1);
    headerBg.fillRoundedRect(hx, hy, CW, 58, { tl: 14, tr: 14, bl: 0, br: 0 });

    // INBOX icon + label
    const inboxTxt = this.add.text(hx + 14, hy + 9, '📧  INBOX', {
      fontSize: '12px', color: '#6aabcc',
      fontFamily: '"Segoe UI", Arial, sans-serif', fontStyle: 'bold',
    });

    // From name
    const fromNameTxt = this.add.text(hx + 14, hy + 26, senderName || senderEmail, {
      fontSize: '13px', color: '#c8e0f0',
      fontFamily: '"Segoe UI", Arial, sans-serif', fontStyle: 'bold',
    });

    // From email (dimmer)
    const fromEmailTxt = this.add.text(hx + 14, hy + 42, `<${senderEmail}>`, {
      fontSize: '11px', color: '#4d7a9a',
      fontFamily: 'monospace',
    });

    // ── Divider under header ───────────────────────────────
    const div1 = this.add.graphics();
    div1.lineStyle(1, 0x1e3f5e, 1);
    div1.lineBetween(hx, hy + 58, hx + CW, hy + 58);

    // ── Subject ────────────────────────────────────────────
    const subjectTxt = this.add.text(hx + 14, hy + 66, email.subject || '(No Subject)', {
      fontSize: '14px', color: '#e8f4ff',
      fontFamily: '"Segoe UI", Arial, sans-serif', fontStyle: 'bold',
      wordWrap: { width: CW - 28 },
    });

    // ── Divider under subject ──────────────────────────────
    const div2 = this.add.graphics();
    div2.lineStyle(1, 0x1e3f5e, 1);
    div2.lineBetween(hx + 14, hy + 94, hx + CW - 14, hy + 94);

    // ── Body preview ───────────────────────────────────────
    const bodyTxt = this.add.text(hx + 14, hy + 102, bodyText, {
      fontSize: '11.5px', color: '#9ab8cc',
      fontFamily: 'monospace',
      wordWrap: { width: CW - 28 },
      lineSpacing: 3,
    });

    // ── Buttons ────────────────────────────────────────────
    const btnY   = CH / 2 - 30;
    const legitBtn = this._makeButton(-130, btnY, '✓  LEGITIMATE', 0x0d3d1e, 0x15a84a, 0x22ee77, () => {
      this._onAnswer(email, false);
    });
    const phishBtn = this._makeButton(130, btnY, '⚠  PHISHING',  0x3d0d0d, 0xa81515, 0xee3333, () => {
      this._onAnswer(email, true);
    });

    // ── Assemble container ─────────────────────────────────
    this.emailCard = this.add.container(cx, cy, [
      cardBg, headerBg,
      inboxTxt, fromNameTxt, fromEmailTxt,
      div1, subjectTxt, div2, bodyTxt,
      legitBtn, phishBtn,
    ]);
    this.emailCard.setDepth(20);

    // Slide-in animation
    this.emailCard.setAlpha(0);
    this.emailCard.y = cy + 22;
    this.tweens.add({
      targets: this.emailCard,
      alpha: 1,
      y: cy,
      duration: 320,
      ease: 'Power2',
    });
  }

  _makeButton(x, y, label, bgDark, bgBright, hoverColor, cb) {
    const BW = 165;
    const BH = 42;

    const bg = this.add.graphics();
    bg.fillStyle(bgDark, 1);
    bg.fillRoundedRect(-BW / 2, -BH / 2, BW, BH, 8);
    bg.lineStyle(1.5, bgBright, 0.8);
    bg.strokeRoundedRect(-BW / 2, -BH / 2, BW, BH, 8);

    const txt = this.add.text(0, 0, label, {
      fontSize: '13px', color: '#ffffff',
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(0, 0, BW, BH).setInteractive({ useHandCursor: true });

    // We need a reference to the container to tween scale on hover
    const inner = this.add.container(x, y, [bg, txt, zone]);

    zone.on('pointerover', () => {
      if (this.isAnswering) return;
      bg.clear();
      bg.fillStyle(hoverColor, 1);
      bg.fillRoundedRect(-BW / 2, -BH / 2, BW, BH, 8);
      this.tweens.add({ targets: inner, scale: 1.06, duration: 90, ease: 'Power1' });
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgDark, 1);
      bg.fillRoundedRect(-BW / 2, -BH / 2, BW, BH, 8);
      bg.lineStyle(1.5, bgBright, 0.8);
      bg.strokeRoundedRect(-BW / 2, -BH / 2, BW, BH, 8);
      this.tweens.add({ targets: inner, scale: 1.0, duration: 90, ease: 'Power1' });
    });
    zone.on('pointerdown', () => {
      if (!this.isAnswering) cb();
    });

    return inner;
  }

  // ==========================================================
  //  ANSWER HANDLING
  // ==========================================================

  _onAnswer(email, guessedPhishing) {
    if (this.isAnswering) return;
    this.isAnswering = true;

    const timeTakenMs = Date.now() - this.emailStartTime;
    const correct     = (email.label === 1) === guessedPhishing;
    const trueType    = email.label === 1 ? 'PHISHING' : 'LEGITIMATE';
    const userGuess   = guessedPhishing   ? 'PHISHING' : 'LEGITIMATE';

    // ── Record this email's data ───────────────────────────
    this.sessionData.emails.push({
      emailNum:    this.currentIndex + 1,
      sender:      (email.sender || '').substring(0, 60),
      subject:     email.subject || '',
      trueLabel:   email.label,
      trueType:    trueType,
      userGuess:   userGuess,
      correct:     correct,
      timeTakenMs: timeTakenMs,
    });

    // ── Score / lives calculation ──────────────────────────
    let points    = 0;
    let bonusMsg  = '';

    if (correct) {
      // Base + speed bonus
      if      (timeTakenMs <  5000) { points = 175; bonusMsg = '⚡ Speed Bonus  +75!'; }
      else if (timeTakenMs < 10000) { points = 140; bonusMsg = '🚀 Quick Answer  +40!'; }
      else if (timeTakenMs < 20000) { points = 120; bonusMsg = '👍 Steady  +20!'; }
      else                          { points = 100; }

      // Streak bonus (3+ consecutive correct)
      this.streak++;
      if (this.streak >= 3) {
        points  += 25;
        bonusMsg = (bonusMsg ? bonusMsg + '  ·  ' : '') + '🔥 Streak  +25!';
      }

      this.score += points;
      this._updateScoreHUD();

      // Character: spell on streak, normal attack otherwise
      this.character.play(this.streak >= 3 ? 'spell' : 'attack');

      this.sound.play('sfxCorrect', { volume: 0.72 });
      this.advisorSprite.setTexture(`sprite${this.advisorIndex}happy`);
    } else {
      this.streak = 0;
      this.lives--;
      this.sessionData.livesUsed++;
      this._updateLivesHUD();

      this.character.play('hurt');
      this.sound.play('sfxWrong',  { volume: 0.75 });
      this.sound.play('sfxHurt',   { volume: 0.50 });
      this.cameras.main.shake(280, 0.012);

      this.advisorSprite.setTexture(`sprite${this.advisorIndex}sad`);
    }

    // ── Visual feedback overlay ────────────────────────────
    this._showFeedback(correct, points, bonusMsg, trueType, userGuess);

    // ── Route: death? next email? win? ─────────────────────
    if (!correct && this.lives <= 0) {
      // Game over — die after feedback
      this.time.delayedCall(1000, () => {
        this.character.play('death');
        this.sound.play('sfxDeath', { volume: 0.85 });
        this.sound.play('sfxAlarm', { volume: 0.40 });
        this.time.delayedCall(2600, () => this._endGame(false));
      });
      return;
    }

    // Slide card away and load next
    this.time.delayedCall(1850, () => {
      if (!this.emailCard) return;
      const slideX = correct ? -220 : 220;
      this.tweens.add({
        targets:  this.emailCard,
        alpha:    0,
        x:        this.emailCard.x + slideX,
        duration: 300,
        ease:     'Power2',
        onComplete: () => {
          if (this.emailCard) { this.emailCard.destroy(); this.emailCard = null; }
          this.currentIndex++;
          this.isAnswering = false;
          this._showNextEmail();
        },
      });
    });
  }

  // ==========================================================
  //  FEEDBACK OVERLAY
  // ==========================================================

  _showFeedback(correct, points, bonusMsg, trueType, userGuess) {
    const W = this.scale.width;
    const H = this.scale.height;

    // Flash overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H,
      correct ? 0x00ff66 : 0xff2200, 0.20).setDepth(55);
    this.tweens.add({
      targets: overlay, alpha: 0, duration: 750,
      onComplete: () => overlay.destroy(),
    });

    // Main result text
    const mainTxt = this.add.text(W / 2, H / 2 - 55,
      correct ? '✓ CORRECT!' : '✗ WRONG!', {
        fontSize:        '42px',
        color:           correct ? '#00ff88' : '#ff4444',
        fontFamily:      '"Segoe UI", Arial, sans-serif',
        fontStyle:       'bold',
        stroke:          '#000000',
        strokeThickness: 7,
      }).setOrigin(0.5).setDepth(65).setScale(0.4);

    this.tweens.add({ targets: mainTxt, scale: 1, duration: 220, ease: 'Back.Out' });

    // Sub-message
    const subMsg = correct
      ? `+${points} points`
      : `It was ${trueType}!  You guessed: ${userGuess}`;

    const subTxt = this.add.text(W / 2, H / 2 + 2, subMsg, {
      fontSize:   '17px',
      color:      correct ? '#ccffdd' : '#ffcccc',
      fontFamily: '"Segoe UI", Arial, sans-serif',
      stroke:     '#000000', strokeThickness: 4,
      align:      'center',
    }).setOrigin(0.5).setDepth(65);

    // Bonus message (correct only)
    if (bonusMsg && correct) {
      const bonusTxt = this.add.text(W / 2, H / 2 + 42, bonusMsg, {
        fontSize:   '15px',
        color:      '#ffdd44',
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontStyle:  'bold',
        stroke:     '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(65);

      this.tweens.add({
        targets: bonusTxt, y: H / 2 + 32, alpha: 0,
        duration: 1400, delay: 550,
        onComplete: () => bonusTxt.destroy(),
      });
    }

    // Fade out main + sub
    this.tweens.add({
      targets:  [mainTxt, subTxt],
      alpha:    0,
      y:        `-=30`,
      duration: 600,
      delay:    1250,
      onComplete: () => { mainTxt.destroy(); subTxt.destroy(); },
    });
  }

  // ==========================================================
  //  END GAME
  // ==========================================================

  _endGame(won) {
    this.isAnswering = true; // lock input

    // Finalise session data
    const answered = this.sessionData.emails;
    const correct  = answered.filter(e => e.correct).length;

    this.sessionData.finalScore       = this.score;
    this.sessionData.livesRemaining   = this.lives;
    this.sessionData.accuracy         = answered.length
      ? +(correct / answered.length).toFixed(3) : 0;
    this.sessionData.avgResponseTimeMs = answered.length
      ? Math.round(answered.reduce((s, e) => s + e.timeTakenMs, 0) / answered.length) : 0;

    if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene', {
        sessionData: this.sessionData,
        won:         won,
        playerName:  this.playerName,
      });
    });
  }

  // ==========================================================
  //  HUD
  // ==========================================================

  _buildHUD(W, H) {
    const BASE = {
      fontFamily:      '"Segoe UI", Arial, sans-serif',
      fontStyle:       'bold',
      color:           '#ffffff',
      stroke:          '#0a1628',
      strokeThickness: 4,
    };

    // Score — top left
    this.scoreTxt = this.add.text(16, 12, 'Score: 0', {
      ...BASE, fontSize: '16px',
    }).setDepth(30);

    // Lives — top right
    this.livesTxt = this.add.text(W - 16, 12, '❤️  ❤️  ❤️', {
      ...BASE, fontSize: '18px',
    }).setOrigin(1, 0).setDepth(30);

    // Email counter — top center
    this.emailCountTxt = this.add.text(W / 2, 12, '📧  1 / 10', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '13px', color: '#aaddff',
      stroke: '#071020', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(30);

    // Streak display
    this.streakTxt = this.add.text(W / 2, 32, '', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '11px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(30);

    // Player name — bottom left (above advisor)
    this.add.text(130, H - 8, `👤 ${this.playerName}`, {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '11px', color: '#7aabbb',
      stroke: '#0a1628', strokeThickness: 2,
    }).setOrigin(0, 1).setDepth(30);

    // Tip — bottom right
    this.add.text(W - 12, H - 8, 'Read carefully!  •  1 wrong = 1 life', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '10px', color: '#445566',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 1).setDepth(30);
  }

  _updateScoreHUD() {
    this.scoreTxt.setText(`Score: ${this.score.toLocaleString()}`);
    this.tweens.add({ targets: this.scoreTxt, scale: 1.25, duration: 140, yoyo: true });
  }

  _updateLivesHUD() {
    const hearts = [0, 1, 2].map(i => (i < this.lives ? '❤️ ' : '🖤 ')).join('');
    this.livesTxt.setText(hearts);
    // Shake right-anchor text
    const origX = this.scale.width - 16;
    this.tweens.add({
      targets: this.livesTxt,
      x: origX + 6,
      duration: 45,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.livesTxt.setX(origX),
    });
  }

  _updateEmailCountHUD() {
    this.emailCountTxt.setText(`📧  ${this.currentIndex + 1} / ${this.gameEmails.length}`);
    if (this.streak >= 3) {
      this.streakTxt.setText(`🔥 Streak ×${this.streak}`);
    } else {
      this.streakTxt.setText('');
    }
  }

  // ==========================================================
  //  BACKGROUND (reuses cached cloud sprites from Start.js)
  // ==========================================================

  _buildBackground(W, H) {
    this.add.tileSprite(0, 0, W, H, 'sky')
      .setOrigin(0, 0).setScrollFactor(0);

    this.add.tileSprite(0, 0, W, H, 'bg_dark')
      .setOrigin(0, 0).setAlpha(0.22).setScrollFactor(0);

    this.cloudsFar = this.add.tileSprite(0, 0, W, H, 'clouds_far')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsMid = this.add.tileSprite(0, H * 0.18, W, H * 0.65, 'clouds_mid')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsFg = this.add.tileSprite(0, H - 185, W, 225, 'clouds_fg')
      .setOrigin(0, 0).setScrollFactor(0);
  }
}
