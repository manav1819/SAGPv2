import { Player } from '../objects/Player.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { InteractionManager } from '../systems/InteractionManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { SCENARIOS } from '../data/scenarios.js';

// Map constants
const TILE = 40;
const COLS = 24;
const ROWS = 16;
const W = COLS * TILE; // 960
const H = ROWS * TILE; // 640

export class OfficeScene extends Phaser.Scene {
  constructor() { super({ key: 'OfficeScene' }); }

  create() {
    this.scoreManager = new ScoreManager();
    this._buildMap();
    this._buildInteractables();

    this.player = new Player(this, 3 * TILE + 20, 3 * TILE + 20);

    // Camera
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Collide player with walls
    this.physics.add.collider(this.player.sprite, this.wallGroup);

    this.dialogueBox = new DialogueBox(this);
    this.interactionManager = new InteractionManager(this, this.scoreManager, this.dialogueBox);

    // Register all 5 interaction points
    this.interactionSprites.forEach(({ sprite, id }) => {
      this.interactionManager.register(sprite, id);
    });

    this.interactionManager.onAllComplete = () => {
      this.scene.start('ResultScene', {
        securityScore: this.scoreManager.securityScore,
        riskScore: this.scoreManager.riskScore,
        completed: this.scoreManager.completed,
      });
    };

    // HUD
    this._buildHUD();
  }

  update() {
    const locked = this.dialogueBox.isVisible();
    this.player.update(locked);
    this.interactionManager.update(this.player.sprite);
    this._updateHUD();
  }

  // ─── Map building ──────────────────────────────────────────────────────────

  _buildMap() {
    const g = this.add.graphics();

    // Floor tiles
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const shade = (row + col) % 2 === 0 ? 0x1a2a1a : 0x162216;
        g.fillStyle(shade, 1);
        g.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }

    // Grid lines
    g.lineStyle(1, 0x0d160d, 0.8);
    for (let col = 0; col <= COLS; col++) g.lineBetween(col * TILE, 0, col * TILE, H);
    for (let row = 0; row <= ROWS; row++) g.lineBetween(0, row * TILE, W, row * TILE);

    // Carpet areas (meeting rooms etc.)
    this._drawCarpet(g, 6, 2, 7, 5, 0x1a1a3a);  // meeting room
    this._drawCarpet(g, 15, 9, 8, 6, 0x2a1a1a); // server room

    // Walls
    this.wallGroup = this.physics.add.staticGroup();
    this._buildWalls();

    // Decorative furniture (no collision, just visual)
    this._drawFurniture(g);
  }

  _drawCarpet(g, col, row, w, h, color) {
    g.fillStyle(color, 1);
    g.fillRect(col * TILE + 2, row * TILE + 2, w * TILE - 4, h * TILE - 4);
    g.lineStyle(2, color + 0x111111, 1);
    g.strokeRect(col * TILE + 2, row * TILE + 2, w * TILE - 4, h * TILE - 4);
  }

  _buildWalls() {
    // Outer border
    this._wallRow(0, 0, COLS);      // top
    this._wallRow(ROWS - 1, 0, COLS); // bottom
    this._wallCol(0, 0, ROWS);      // left
    this._wallCol(COLS - 1, 0, ROWS); // right

    // Interior dividing walls
    // Horizontal wall row 7 cols 0-13
    this._wallRow(7, 0, 14);
    // Gap at col 5
    // Vertical wall col 13 rows 0-7
    this._wallCol(13, 0, 7);
    // Vertical divider col 13 rows 8-15
    this._wallCol(13, 8, ROWS);

    // Server room border (bottom-right area)
    this._wallRow(9, 14, COLS - 1);
    this._wallCol(14, 9, ROWS - 1);

    // Draw walls visually
    const g = this.add.graphics().setDepth(5);
    this.wallGroup.children.iterate(wall => {
      const wx = wall.x - wall.width / 2;
      const wy = wall.y - wall.height / 2;
      // Wall base
      g.fillStyle(0x334455, 1);
      g.fillRect(wx, wy, wall.width, wall.height);
      // Highlight top
      g.fillStyle(0x4a6688, 1);
      g.fillRect(wx, wy, wall.width, 4);
      // Shadow bottom
      g.fillStyle(0x1a2233, 1);
      g.fillRect(wx, wy + wall.height - 4, wall.width, 4);
    });
  }

  _wallRow(row, colStart, colEnd) {
    for (let c = colStart; c < colEnd; c++) this._addWall(c, row);
  }
  _wallCol(col, rowStart, rowEnd) {
    for (let r = rowStart; r < rowEnd; r++) this._addWall(col, r);
  }
  _addWall(col, row) {
    const rect = this.add.rectangle(
      col * TILE + TILE / 2, row * TILE + TILE / 2, TILE, TILE
    );
    this.physics.add.existing(rect, true);
    this.wallGroup.add(rect);
  }

  _drawFurniture(g) {
    // Desks
    const desks = [
      [2, 2], [2, 4], [4, 2], [4, 4],
      [7, 2], [9, 2], [7, 4], [9, 4],
      [2, 9], [2, 11], [4, 9], [4, 11],
      [7, 9], [7, 11],
    ];
    desks.forEach(([c, r]) => {
      g.fillStyle(0x5c3d1e, 1);
      g.fillRect(c * TILE + 4, r * TILE + 8, TILE - 8, TILE - 12);
      g.fillStyle(0x7a5230, 1);
      g.fillRect(c * TILE + 4, r * TILE + 8, TILE - 8, 4);
      // Monitor
      g.fillStyle(0x111122, 1);
      g.fillRect(c * TILE + 10, r * TILE + 10, 20, 14);
      g.fillStyle(0x0033aa, 1);
      g.fillRect(c * TILE + 11, r * TILE + 11, 18, 12);
    });

    // Plants
    [[11, 1], [11, 5], [1, 6], [22, 1], [22, 14]].forEach(([c, r]) => {
      g.fillStyle(0x1a6611, 1);
      g.fillCircle(c * TILE + 20, r * TILE + 20, 14);
      g.fillStyle(0x3d1a00, 1);
      g.fillRect(c * TILE + 15, r * TILE + 28, 10, 8);
    });

    // Meeting table
    g.fillStyle(0x7a5230, 1);
    g.fillRect(7 * TILE + 4, 2 * TILE + 4, 5 * TILE - 8, 3 * TILE - 8);
    g.fillStyle(0x8c6540, 1);
    g.fillRect(7 * TILE + 4, 2 * TILE + 4, 5 * TILE - 8, 6);

    // Server racks
    [[16, 10], [18, 10], [20, 10], [16, 12], [18, 12]].forEach(([c, r]) => {
      g.fillStyle(0x222233, 1);
      g.fillRect(c * TILE + 4, r * TILE + 2, TILE - 8, TILE - 4);
      g.fillStyle(0x00ff00, 1);
      for (let i = 0; i < 4; i++) g.fillRect(c * TILE + 8 + i * 8, r * TILE + 6, 4, 4);
      g.fillStyle(0xff4400, 1);
      g.fillRect(c * TILE + 8, r * TILE + 14, 4, 4);
    });
  }

  // ─── Interactable Objects ─────────────────────────────────────────────────

  _buildInteractables() {
    this.interactionSprites = [];

    const specs = [
      { id: 'phishing_email', col: 10, row: 3,  color: 0x00aaff, label: 'EMAIL\nTERMINAL' },
      { id: 'usb_drive',      col: 5,  row: 5,  color: 0xffaa00, label: 'USB\nDRIVE'    },
      { id: 'fake_it_support',col: 3,  row: 10, color: 0xff4444, label: 'IT\nSUPPORT'  },
      { id: 'mfa_fatigue',    col: 9,  row: 11, color: 0xaa44ff, label: 'MFA\nPROMPT'  },
      { id: 'tailgating',     col: 14, row: 7,  color: 0x44ff88, label: 'SECURE\nDOOR' },
    ];

    const g = this.add.graphics().setDepth(4);

    specs.forEach(({ id, col, row, color, label }) => {
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;

      // Draw icon in graphics
      const r = 18;
      g.fillStyle(color, 0.25);
      g.fillCircle(cx, cy, r + 6);
      g.lineStyle(2, color, 1);
      g.strokeCircle(cx, cy, r + 6);
      g.fillStyle(color, 0.9);
      g.fillCircle(cx, cy, r);

      // Physics sprite (invisible, for distance checking)
      const sprite = this.add.circle(cx, cy, r).setAlpha(0).setDepth(4);
      this.physics.add.existing(sprite, true);

      // Label
      this.add.text(cx, cy - r - 20, label, {
        fontSize: '9px', fontFamily: 'Courier New', color: '#ffffff',
        align: 'center', lineSpacing: 2,
        backgroundColor: '#00000088', padding: { x: 3, y: 2 },
      }).setOrigin(0.5).setDepth(6);

      // Pulse animation on gfx via tween on a dummy object
      const pulse = this.add.circle(cx, cy, r + 6).setAlpha(0).setDepth(3);
      this.tweens.add({
        targets: pulse,
        scaleX: 1.4, scaleY: 1.4,
        alpha: { from: 0.4, to: 0 },
        duration: 1200,
        repeat: -1,
        ease: 'Sine.easeOut',
      });
      // Re-draw pulse ring
      const pGfx = this.add.graphics().setDepth(3);
      pGfx.lineStyle(2, color, 0.6);
      pGfx.strokeCircle(cx, cy, r + 6);
      this.tweens.add({
        targets: pGfx,
        scaleX: 1.5, scaleY: 1.5,
        alpha: 0,
        duration: 1400,
        repeat: -1,
        ease: 'Sine.easeOut',
      });

      this.interactionSprites.push({ sprite, id });
    });
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  _buildHUD() {
    this.hudContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0);

    // Top bar
    const bar = this.add.rectangle(W / 2, 20, W, 40, 0x0d1b2a, 0.9)
      .setStrokeStyle(1, 0x003355);
    this.hudContainer.add(bar);

    this.add.text(12, 8, 'CYBERGUARD', {
      fontSize: '16px', fontFamily: 'Courier New', color: '#00ff88', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(101);

    this.secText = this.add.text(200, 8, '', {
      fontSize: '14px', fontFamily: 'Courier New', color: '#44ffaa',
    }).setScrollFactor(0).setDepth(101);

    this.riskText = this.add.text(400, 8, '', {
      fontSize: '14px', fontFamily: 'Courier New', color: '#ffaa44',
    }).setScrollFactor(0).setDepth(101);

    this.progressText = this.add.text(650, 8, '', {
      fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaff',
    }).setScrollFactor(0).setDepth(101);

    // Controls hint bottom
    this.add.text(W / 2, H - 12,
      'ARROWS/WASD: Move   |   E/SPACE: Interact when near glowing object', {
      fontSize: '11px', fontFamily: 'Courier New', color: '#445555',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  _updateHUD() {
    const sm = this.scoreManager;
    const done = this.interactionManager.getCompletedCount();
    this.secText.setText(`🛡 Security: ${sm.securityScore}`);
    this.riskText.setText(`⚠ Risk: ${sm.riskScore}`);
    this.progressText.setText(`Scenarios: ${done}/${SCENARIOS.length}`);
  }
}
