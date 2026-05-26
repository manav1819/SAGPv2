// ============================================================
//  src/scenes/GameScene.js  –  Security Awareness Training Game
//  Phaser 3  |  Main Gameplay Scene
// ============================================================

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ----------------------------------------------------------
  //  PRELOAD
  //  Assets cached by Start.js are already available.
  //  Add new gameplay assets here as you create them.
  // ----------------------------------------------------------
  preload() {
    // Future assets – uncomment and add files to assets/ as needed:
    // this.load.image('email',      'assets/email.png');
    // this.load.image('shield',     'assets/shield.png');
    // this.load.image('virus',      'assets/virus.png');
    // this.load.image('warning',    'assets/warning.png');
  }

  // ----------------------------------------------------------
  //  CREATE
  // ----------------------------------------------------------
  create() {
    const W = this.scale.width;   // 960
    const H = this.scale.height;  // 540

    this._buildBackground(W, H);

    // ── Player character ──────────────────────────────────
    this.player = this.physics.add.sprite(W * 0.5, H - 160, 'character')
      .setScale(2.5)
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setCollideWorldBounds(true);

    this.player.play('idle');

    // ── Input ─────────────────────────────────────────────
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Game state ────────────────────────────────────────
    this.score       = 0;
    this.lives       = 3;
    this.isAttacking = false;

    // ── HUD ───────────────────────────────────────────────
    this._buildHUD(W, H);

    // ── Parallax speeds ───────────────────────────────────
    this.scrollSpeeds = { far: 0.08, mid: 0.22, fg: 0.55 };

    // Return to idle after one-shot anims finish
    this.player.on('animationcomplete', (anim) => {
      if (['attack', 'attack_heavy', 'cast', 'hurt'].includes(anim.key)) {
        this.isAttacking = false;
        this.player.play('idle');
      }
    });
  }

  // ----------------------------------------------------------
  //  UPDATE
  // ----------------------------------------------------------
  update() {
    const SPEED = 220;
    const { left, right } = this.cursors;

    // Parallax scroll
    this.cloudsFar.tilePositionX -= this.scrollSpeeds.far;
    this.cloudsMid.tilePositionX -= this.scrollSpeeds.mid;
    this.cloudsFg.tilePositionX  -= this.scrollSpeeds.fg;

    if (this.isAttacking) return;

    // Horizontal movement
    if (left.isDown) {
      this.player.setVelocityX(-SPEED);
      this.player.play('walk_left', true);
    } else if (right.isDown) {
      this.player.setVelocityX(SPEED);
      this.player.play('walk_right', true);
    } else {
      this.player.setVelocityX(0);
      const cur = this.player.anims.currentAnim?.key;
      if (cur !== 'hurt' && cur !== 'death') {
        this.player.play('idle', true);
      }
    }

    // Attack on SPACE
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.isAttacking = true;
      this.player.setVelocityX(0);
      this.player.play('attack');
    }
  }

  // ----------------------------------------------------------
  //  PUBLIC API – call from threat/pickup objects
  // ----------------------------------------------------------
  takeHit() {
    if (this.lives <= 0) return;
    this.lives--;
    this.player.play('hurt');
    this._updateLivesHUD();

    if (this.lives <= 0) {
      this.isAttacking = true; // lock input
      this.player.play('death');
      this.time.delayedCall(2200, () => this.scene.start('Start'));
    }
  }

  addScore(points = 10) {
    this.score += points;
    this._updateScoreHUD();
  }

  // ----------------------------------------------------------
  //  Background (same layers as Start.js, already cached)
  // ----------------------------------------------------------
  _buildBackground(W, H) {
    this.add.tileSprite(0, 0, W, H, 'sky')
      .setOrigin(0, 0).setScrollFactor(0);

    this.add.tileSprite(0, 0, W, H, 'bg_dark')
      .setOrigin(0, 0).setAlpha(0.18).setScrollFactor(0);

    this.cloudsFar = this.add.tileSprite(0, 0, W, H, 'clouds_far')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsMid = this.add.tileSprite(0, H * 0.18, W, H * 0.65, 'clouds_mid')
      .setOrigin(0, 0).setScrollFactor(0);

    this.cloudsFg = this.add.tileSprite(0, H - 185, W, 225, 'clouds_fg')
      .setOrigin(0, 0).setScrollFactor(0);
  }

  // ----------------------------------------------------------
  //  HUD
  // ----------------------------------------------------------
  _buildHUD(W, H) {
    const baseStyle = {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '16px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#0a1628', strokeThickness: 4,
    };

    // Score – top left
    this.scoreTxt = this.add.text(16, 12, 'Score: 0', baseStyle).setDepth(30);

    // Lives – top right
    this.livesTxt = this.add.text(W - 16, 12, '❤️  ❤️  ❤️', {
      ...baseStyle, fontSize: '18px',
    }).setOrigin(1, 0).setDepth(30);

    // Level label – top centre
    this.add.text(W * 0.5, 12, '— Level 1: Phishing Inbox —', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '13px', color: '#aaddff',
      stroke: '#071020', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(30);
  }

  _updateScoreHUD() {
    this.scoreTxt.setText(`Score: ${this.score}`);
  }

  _updateLivesHUD() {
    const hearts = [0, 1, 2].map(i => i < this.lives ? '❤️ ' : '🖤 ').join('');
    this.livesTxt.setText(hearts);
  }
}