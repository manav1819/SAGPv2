// ============================================================
//  src/scenes/Start.js  –  Security Awareness Training Game
//  Phaser 3  |  Title / Boot Scene
// ============================================================

export default class Start extends Phaser.Scene {
  constructor() {
    super({ key: 'Start' });
  }

  // ----------------------------------------------------------
  //  PRELOAD
  // ----------------------------------------------------------
  preload() {
    this._buildLoadingBar();

    // Background layers
    this.load.image('sky',        'assets/Clouds 5/1.png');
    this.load.image('bg_dark',    'assets/Clouds 5/2.png');
    this.load.image('clouds_far', 'assets/Clouds 5/3.png');
    this.load.image('clouds_mid', 'assets/Clouds 5/4.png');
    this.load.image('clouds_fg',  'assets/Clouds 5/5.png');

    // Character spritesheet  768×1408  → 12 cols × 22 rows  @  64×64 px
    this.load.spritesheet('character', 'assets/Character 9.png', {
      frameWidth:  64,
      frameHeight: 64,
    });

    // Advisor sprites (emotional NPC)
    for (let i = 1; i <= 4; i++) {
      this.load.image(`sprite${i}happy`, `assets/sprite${i} happy.png`);
      this.load.image(`sprite${i}angry`, `assets/sprite${i} angry.png`);
      this.load.image(`sprite${i}sad`,   `assets/sprite${i} sad.png`);
    }

    // Emails dataset
    this.load.json('emails', 'assets/emails.json');

    // ── Audio ──────────────────────────────────────────────
    // Start / menu music
    this.load.audio('menuMusic',   'assets/music/Music/MP3/Main_theme_prison_loopable.mp3');
    // Gameplay background
    this.load.audio('gameMusic',   'assets/music/Music/MP3/Alternative_theme_prison.mp3');
    // Win screen music
    this.load.audio('winMusic',    'assets/music/Music/MP3/Prisoners_escape_theme.mp3');
    // Sound FX
    this.load.audio('sfxEmailOpen', 'assets/music/Sounds/Prison_cell_open.wav');
    this.load.audio('sfxCorrect',   'assets/music/Sounds/Laser.wav');
    this.load.audio('sfxWrong',     'assets/music/Sounds/Trap_electric_shock.wav');
    this.load.audio('sfxHurt',      'assets/music/Sounds/Blood_1.wav');
    this.load.audio('sfxDeath',     'assets/music/Sounds/Prison_buzzer.wav');
    this.load.audio('sfxGlitch',    'assets/music/Sounds/Glitch.wav');
    this.load.audio('sfxPunch',     'assets/music/Sounds/Punch_with_electricity.wav');
    this.load.audio('sfxAlarm',     'assets/music/Sounds/Alarm_loopable.wav');
  }

  // ----------------------------------------------------------
  //  CREATE
  // ----------------------------------------------------------
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBackground(W, H);
    this._registerAnims();

    // Character on title screen
    this.character = this.add.sprite(W * 0.5, H - 160, 'character')
      .setScale(2.5)
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.character.play('idle');

    this._buildHUD(W, H);

    this.scrollSpeeds = { far: 0.08, mid: 0.22, fg: 0.55 };

    // Start looping menu music
    this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: 0.25 });
    this.menuMusic.play();
  }

  // ----------------------------------------------------------
  //  UPDATE  – parallax cloud scroll
  // ----------------------------------------------------------
  update() {
    this.cloudsFar.tilePositionX -= this.scrollSpeeds.far;
    this.cloudsMid.tilePositionX -= this.scrollSpeeds.mid;
    this.cloudsFg.tilePositionX  -= this.scrollSpeeds.fg;
  }

  // ----------------------------------------------------------
  //  Loading bar
  // ----------------------------------------------------------
  _buildLoadingBar() {
    const W = this.scale.width;
    const H = this.scale.height;

    const box = this.add.graphics();
    const bar = this.add.graphics();

    box.fillStyle(0x0a1628, 0.9);
    box.fillRect(W * 0.25, H * 0.44, W * 0.5, 34);
    box.lineStyle(1, 0x4a9fd4, 0.8);
    box.strokeRect(W * 0.25, H * 0.44, W * 0.5, 34);

    this.add.text(W * 0.5, H * 0.38, '🔐 Loading Security Training...', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '16px', color: '#82bde0',
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x4a9fd4, 1);
      bar.fillRect(W * 0.25 + 2, H * 0.44 + 2, (W * 0.5 - 4) * v, 30);
    });

    this.load.on('complete', () => {
      bar.destroy();
      box.destroy();
    });
  }

  // ----------------------------------------------------------
  //  Background layers
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
  //  Register all character animations (global, persists across scenes)
  // ----------------------------------------------------------
  _registerAnims() {
    if (this.anims.exists('idle')) return; // already registered
    const a   = this.anims;
    const row = (r, c0, c1) =>
      a.generateFrameNumbers('character', { start: r * 12 + c0, end: r * 12 + c1 });

    a.create({ key: 'idle',         frames: row(0, 0, 3),                                  frameRate: 6,  repeat: -1 });
    a.create({ key: 'walk_down',    frames: row(1, 0, 3),                                  frameRate: 8,  repeat: -1 });
    a.create({ key: 'walk_left',    frames: row(2, 0, 5),                                  frameRate: 8,  repeat: -1 });
    a.create({ key: 'walk_right',   frames: row(3, 0, 5),                                  frameRate: 8,  repeat: -1 });
    a.create({ key: 'walk_up',      frames: [...row(4, 0, 2), ...row(5, 0, 3)],            frameRate: 8,  repeat: -1 });
    a.create({ key: 'attack',       frames: row(6, 0, 7),                                  frameRate: 12, repeat: 0  });
    a.create({ key: 'attack_heavy', frames: row(7, 0, 8),                                  frameRate: 10, repeat: 0  });
    a.create({ key: 'hurt',         frames: row(8, 0, 8),                                  frameRate: 10, repeat: 0  });
    a.create({ key: 'death',        frames: a.generateFrameNumbers('character', { start: 9 * 12 + 5, end: 9 * 12 + 11 }), frameRate: 8, repeat: 0 });
    a.create({ key: 'cast',         frames: row(10, 0, 7),                                 frameRate: 8,  repeat: 0  });
    a.create({ key: 'spell',        frames: [...row(19, 0, 9), ...row(20, 0, 11), ...row(21, 0, 9)], frameRate: 12, repeat: 0 });
  }

  // ----------------------------------------------------------
  //  HUD / Title card
  // ----------------------------------------------------------
  _buildHUD(W, H) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x0a1628, 0.82);
    g.fillRoundedRect(W * 0.5 - 310, 18, 620, 130, 18);
    g.lineStyle(1.5, 0x4a9fd4, 0.55);
    g.strokeRoundedRect(W * 0.5 - 310, 18, 620, 130, 18);

    this.add.text(W * 0.5, 42, '🔐  Phishing Simulator', {
      fontFamily: '"Segoe UI", "Trebuchet MS", Arial, sans-serif',
      fontSize: '26px', fontStyle: 'bold',
      color: '#e8f4ff', stroke: '#071020', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(21);

    this.add.text(W * 0.5, 80, 'Can you spot the phishing emails? Train your instincts!', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '13px', color: '#82bde0',
    }).setOrigin(0.5, 0).setDepth(21);

    this.add.text(W * 0.5, 104, '3 Lives  ·  10 Emails  ·  Speed Bonuses  ·  Streaks', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px', color: '#4a7a9a',
    }).setOrigin(0.5, 0).setDepth(21);

    // Blinking prompt
    const startTxt = this.add.text(W * 0.5, H - 22, '▶  PRESS  SPACE  or  CLICK  TO  BEGIN  ◀', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '15px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#0a1628', strokeThickness: 5,
    }).setOrigin(0.5, 1).setDepth(21);

    this.tweens.add({
      targets: startTxt, alpha: 0.15, duration: 720,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    this._demoAnims();

    // Both input listeners call _startGame once
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());
    this.input.once('pointerdown',            () => this._startGame());
  }

  // Demo animation cycle
  _demoAnims() {
    const seq = [
      { anim: 'idle',       dur: 2000 },
      { anim: 'walk_right', dur: 1000 },
      { anim: 'attack',     dur: 800  },
      { anim: 'cast',       dur: 900  },
      { anim: 'spell',      dur: 1600 },
      { anim: 'idle',       dur: 99999 },
    ];
    let i = 0;
    const next = () => {
      if (i >= seq.length) return;
      const { anim, dur } = seq[i++];
      this.character.play(anim);
      this.time.delayedCall(dur, next);
    };
    next();
  }

  // ----------------------------------------------------------
  //  Called on SPACE / click — launch game immediately
  //  Player name is read from the ?name= URL parameter (set by
  //  the employee portal / LMS when embedding this game).
  //  Falls back to 'Agent' if the parameter is absent.
  // ----------------------------------------------------------
  _startGame() {
    // Resolve employee name from URL query string
    const params     = new URLSearchParams(window.location.search);
    const playerName = params.get('name') || 'Agent';

    if (this.menuMusic) this.menuMusic.stop();

    this.cameras.main.fadeOut(550, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('InboxScene', { playerName });
    });
  }
}
