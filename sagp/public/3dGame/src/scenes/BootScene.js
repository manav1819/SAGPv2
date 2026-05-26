export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const W = 960, H = 640;

    // ── Loading bar ──────────────────────────────────────────────────────────
    const barBg = this.add.rectangle(W / 2, H / 2 + 80, 400, 18, 0x112233)
      .setStrokeStyle(1, 0x224455);
    const bar   = this.add.rectangle(W / 2 - 200, H / 2 + 80, 0, 14, 0x00ff88).setOrigin(0, 0.5);
    const pct   = this.add.text(W / 2, H / 2 + 106, 'Loading assets...', {
      fontSize: '12px', fontFamily: 'Courier New', color: '#557799',
    }).setOrigin(0.5);

    this.load.on('progress', v => {
      bar.width = 396 * v;
      pct.setText(`Loading assets... ${Math.floor(v * 100)}%`);
    });

    // ── Title (shown during load) ────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2 - 80, 480, 200, 0x0d1b2a, 0.9)
      .setStrokeStyle(1, 0x1a4060);
    this.add.text(W / 2, H / 2 - 130, 'CYBERGUARD', {
      fontSize: '56px', fontFamily: 'Courier New', color: '#00ff88',
      stroke: '#003322', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 70, 'OFFICE SECURITY TRAINING', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#44aaff', letterSpacing: 5,
    }).setOrigin(0.5);

    // ── Floor tilesheet ──────────────────────────────────────────────────────
    this.load.spritesheet('room_tiles',
      './assets/modern_tiles/Interiors_free/16x16/Room_Builder_free_16x16.png',
      { frameWidth: 16, frameHeight: 16 });

    // ── Furniture / props tilesheet ──────────────────────────────────────────
    this.load.spritesheet('interiors',
      './assets/modern_tiles/Interiors_free/16x16/Interiors_free_16x16.png',
      { frameWidth: 16, frameHeight: 16 });

    // ── Character spritesheets ───────────────────────────────────────────────
    const chars = ['Adam', 'Alex', 'Amelia', 'Bob'];
    chars.forEach(name => {
      const key = name.toLowerCase();
      const base = `./assets/modern_tiles/Characters_free/${name}`;
      this.load.spritesheet(`${key}_run`,  `${base}_run_16x16.png`,       { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet(`${key}_idle`, `${base}_idle_anim_16x16.png`, { frameWidth: 16, frameHeight: 16 });
    });
  }

  create() {
    // Build animations from loaded sheets
    this._buildAnims();
    this.scene.start('GameScene', {});
  }

  _buildAnims() {
    // Character run/walk — sheet is 24 cols × 2 rows
    // Rows: 0 = down, 6 = left, 12 = right, 18 = up  (6 frames each)
    const chars = ['adam', 'alex', 'amelia', 'bob'];
    const dirFrames = { down: 0, left: 6, right: 12, up: 18 };

    chars.forEach(key => {
      Object.entries(dirFrames).forEach(([dir, start]) => {
        if (!this.anims.exists(`${key}_walk_${dir}`)) {
          this.anims.create({
            key: `${key}_walk_${dir}`,
            frames: this.anims.generateFrameNumbers(`${key}_run`, { start, end: start + 5 }),
            frameRate: 8,
            repeat: -1,
          });
        }
        if (!this.anims.exists(`${key}_idle_${dir}`)) {
          this.anims.create({
            key: `${key}_idle_${dir}`,
            frames: this.anims.generateFrameNumbers(`${key}_idle`, { start, end: start + 5 }),
            frameRate: 4,
            repeat: -1,
          });
        }
      });
    });
  }
}
