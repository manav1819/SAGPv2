// ── Floor tile frame constants ───────────────────────────────────────────────
// Room_Builder_free_16x16.png  (17 cols × 23 rows)
// Frame index = row * 17 + col
// Verified visually: col 4 = interior tile, col 5 = slight variant
const FLOORS = {
  tile_cream: { a: 106, b: 107, c: 108 },  // row  6 — cream / off-white (Lobby)
  tile_blue:  { a: 123, b: 124, c: 125 },  // row  7 — pale blue         (Hallway)
  wood_warm:  { a: 174, b: 175, c: 176 },  // row 10 — warm wood plank   (Cubicles)
  tile_slate: { a: 310, b: 311, c: 312 },  // row 18 — blue-grey slate   (IT Dept)
  wood_dark:  { a: 208, b: 209, c: 210 },  // row 12 — dark wood         (Server Rm)
  wood_light: { a: 259, b: 260, c: 261 },  // row 15 — light wood        (Break Rm)
  carpet_tan: { a: 344, b: 345, c: 346 },  // row 20 — tan carpet        (SOC)
};

// ── Furniture frame constants ────────────────────────────────────────────────
// Interiors_free_16x16.png  (16 cols × 89 rows)
// Frame index = row * 16 + col
const F = {
  PLANT_A:    784,  // row 49 col 0 — potted plant (green)
  PLANT_B:    785,  // row 49 col 1 — potted plant variant
  BOOKCASE_A: 258,  // row 16 col 2 — bookcase col A
  BOOKCASE_B: 259,  // row 16 col 3
  BOOKCASE_C: 260,  // row 16 col 4
  RUG_TL:     672,  // row 42 col 0 — green rug top-left
  RUG_TR:     673,
  RUG_BL:     688,
  RUG_BR:     689,
};

const TILE = 32;

// ─────────────────────────────────────────────────────────────────────────────
export class EnvironmentBuilder {
  constructor(scene, roomCfg) {
    this.scene = scene;
    this.cfg   = roomCfg;
    this._cleanup = scene._roomCleanup; // shared cleanup array
    // Random seeded per room for deterministic decoration
    this._seed = roomCfg.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  }

  _rand(max) {
    this._seed = (this._seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(this._seed) % max;
  }

  // ── PUBLIC BUILD STEPS ────────────────────────────────────────────────────

  buildFloor() {
    const { cols, rows, floorStyle } = this.cfg;
    const frames = FLOORS[floorStyle] || FLOORS.tile_cream;
    const g = this.scene.add.graphics().setDepth(0);
    this._track(g);

    // Dark base fill (visible under transparent tiles)
    g.fillStyle(0x060c12, 1);
    g.fillRect(0, 0, cols * TILE, rows * TILE);

    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const r = this._rand(100);
        let frame;
        if (r < 5)       frame = frames.c;
        else if (r < 50) frame = frames.a;
        else             frame = frames.b;

        const tile = this.scene.add.image(
          col * TILE + TILE / 2,
          row * TILE + TILE / 2,
          'room_tiles', frame
        ).setDisplaySize(TILE, TILE).setDepth(0);
        this._track(tile);
      }
    }

    // Subtle inner shadow along top wall
    const shadow = this.scene.add.graphics().setDepth(1);
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRect(TILE, TILE, (cols - 2) * TILE, 12);
    this._track(shadow);
  }

  buildWalls() {
    const { cols, rows, wallColor, wallLight, wallShadow } = this.cfg;
    const walls = this.scene.physics.add.staticGroup();
    const g = this.scene.add.graphics().setDepth(5);
    this._track(g);

    const addWall = (col, row) => {
      // Visual
      const wx = col * TILE, wy = row * TILE;
      g.fillStyle(wallColor, 1);
      g.fillRect(wx, wy, TILE, TILE);
      // Top highlight (isometric hint)
      g.fillStyle(wallLight, 1);
      g.fillRect(wx, wy, TILE, 4);
      // Right shadow
      g.fillStyle(wallShadow, 1);
      g.fillRect(wx + TILE - 3, wy + 4, 3, TILE - 4);
      // Bottom edge
      g.fillStyle(wallShadow, 1);
      g.fillRect(wx, wy + TILE - 3, TILE, 3);

      // Physics body (invisible rect tracked via walls group)
      const r = this.scene.add.rectangle(
        col * TILE + TILE / 2, row * TILE + TILE / 2, TILE, TILE
      );
      this.scene.physics.add.existing(r, true);
      walls.add(r);
      this._track(r);
    };

    // Outer border (skip door cells)
    const doorCells = new Set(
      this.cfg.doors.map(d => `${d.col},${d.row}`)
    );
    const isDoor = (col, row) => doorCells.has(`${col},${row}`);

    for (let c = 0; c < cols; c++) {
      if (!isDoor(c, 0))        addWall(c, 0);
      if (!isDoor(c, rows - 1)) addWall(c, rows - 1);
    }
    for (let r = 1; r < rows - 1; r++) {
      if (!isDoor(0, r))        addWall(0, r);
      if (!isDoor(cols - 1, r)) addWall(cols - 1, r);
    }

    // Draw door openings (archway visual)
    this.cfg.doors.forEach(door => {
      this._drawDoorway(g, door);
    });

    // Feature-based interior walls
    this._buildInteriorWalls(g, walls, isDoor);

    return walls;
  }

  _buildInteriorWalls(g, walls, isDoor) {
    const { features, wallColor, wallLight, wallShadow, cols, rows } = this.cfg;
    if (!features) return;

    const addInnerWall = (col, row) => {
      const wx = col * TILE, wy = row * TILE;
      g.fillStyle(wallColor, 1);
      g.fillRect(wx, wy, TILE, TILE);
      g.fillStyle(wallLight, 1);
      g.fillRect(wx, wy, TILE, 4);
      g.fillStyle(wallShadow, 1);
      g.fillRect(wx + TILE - 3, wy + 4, 3, TILE - 4);
      const r = this.scene.add.rectangle(
        col * TILE + TILE / 2, row * TILE + TILE / 2, TILE, TILE
      );
      this.scene.physics.add.existing(r, true);
      walls.add(r);
      this._track(r);
    };

    if (features.includes('cubicle_grid')) {
      // Divider walls between cubicle pods
      [[5,3],[6,3],[5,7],[6,7],[13,3],[14,3],[13,7],[14,7],
       [5,11],[6,11],[5,15],[6,15],[13,11],[14,11],[13,15],[14,15]].forEach(([c,r]) => {
        if (c < cols-1 && r < rows-1) addInnerWall(c, r);
      });
    }

    if (features.includes('server_wall')) {
      // Back wall of servers
      for (let c = 18; c < cols - 1; c++) addInnerWall(c, 3);
      for (let c = 18; c < cols - 1; c++) addInnerWall(c, 4);
    }
  }

  _drawDoorway(g, door) {
    const { col, row, facing, label, toRoom } = door;
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;

    // Archway accent (glowing edge)
    const color = door._locked ? 0x885500 : 0x00aaff;
    g.fillStyle(color, 0.35);
    g.fillRect(col * TILE, row * TILE, TILE, TILE);
    g.lineStyle(2, color, 0.8);
    g.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);

    // Arrow indicator
    const arrowMap = { north: '↑', south: '↓', east: '→', west: '←' };
    const lbl = this.scene.add.text(cx, cy - 18, arrowMap[facing] || '?', {
      fontSize: '14px', fontFamily: 'Courier New',
      color: door._locked ? '#885500' : '#00ccff',
    }).setOrigin(0.5).setDepth(6);
    this._track(lbl);

    const roomLbl = this.scene.add.text(cx, cy + 4, label || toRoom, {
      fontSize: '8px', fontFamily: 'Courier New',
      color: door._locked ? '#664400' : '#4499aa',
      align: 'center',
    }).setOrigin(0.5).setDepth(6);
    this._track(roomLbl);
  }

  buildFurniture(g) {
    const { features, cols, rows } = this.cfg;
    if (!features) return;
    const gfx = this.scene.add.graphics().setDepth(3);
    this._track(gfx);

    features.forEach(feat => {
      switch (feat) {
        case 'reception':        this._drawReception(gfx, cols, rows); break;
        case 'plants_corners':   this._drawPlantsCorners(gfx, cols, rows); break;
        case 'plants_sides':     this._drawPlantsSides(gfx, cols, rows); break;
        case 'security_poster':  this._drawSecurityPosters(gfx, cols, rows); break;
        case 'badge_scanner':    this._drawBadgeScanners(gfx, cols, rows); break;
        case 'elevator':         this._drawElevator(gfx, cols, rows); break;
        case 'cubicle_grid':     this._drawCubicles(gfx, cols, rows); break;
        case 'coffee_station':   this._drawCoffeeStation(gfx, cols, rows); break;
        case 'whiteboard':       this._drawWhiteboard(gfx, cols, rows); break;
        case 'direction_signs':  this._drawDirectionSigns(gfx, cols, rows); break;
        case 'security_posters': this._drawSecurityPosters(gfx, cols, rows); break;
        case 'cctv_cameras':     this._drawCCTV(gfx, cols, rows); break;
        case 'helpdesk':         this._drawHelpdesk(gfx, cols, rows); break;
        case 'cable_runs':       this._drawCableRuns(gfx, cols, rows); break;
        case 'server_maze':      this._drawServerMaze(gfx, cols, rows); break;
        case 'blink_lights':     this._drawBlinkLights(cols, rows); break;
        case 'danger_signs':     this._drawDangerSigns(gfx, cols, rows); break;
        case 'kitchen':          this._drawKitchen(gfx, cols, rows); break;
        case 'couch_area':       this._drawCouchArea(gfx, cols, rows); break;
        case 'notice_board':     this._drawNoticeBoard(gfx, cols, rows); break;
        case 'soc_screens':      this._drawSOCScreens(gfx, cols, rows); break;
        case 'analysis_desks':   this._drawAnalysisDesks(gfx, cols, rows); break;
        case 'server_wall':      this._drawServerWall(gfx, cols, rows); break;
        case 'monitors_blink':   this._drawBlinkingMonitors(cols, rows); break;
      }
    });
  }

  buildInteractables(scenarioIds, onRegister) {
    const COLOR_MAP = {
      phishing_email:  { color: 0x00aaff, label: 'EMAIL\nTERMINAL' },
      usb_drive:       { color: 0xffaa00, label: 'USB\nDRIVE'      },
      fake_it_support: { color: 0xff4444, label: 'IT\nSUPPORT'     },
      mfa_fatigue:     { color: 0xaa44ff, label: 'MFA\nPROMPT'     },
      tailgating:      { color: 0x44ff88, label: 'SECURE\nDOOR'    },
    };

    const POSITIONS = {
      phishing_email:  { col: 10, row: 8  },
      usb_drive:       { col: 18, row: 12 },
      fake_it_support: { col: 14, row: 9  },
      mfa_fatigue:     { col: 8,  row: 9  },
      tailgating:      { col: 14, row: 17 },
    };

    const g = this.scene.add.graphics().setDepth(4);
    this._track(g);

    scenarioIds.forEach(id => {
      const cfg = COLOR_MAP[id];
      const pos = POSITIONS[id];
      if (!cfg || !pos) return;

      const cx = pos.col * TILE + TILE / 2;
      const cy = pos.row * TILE + TILE / 2;
      const r  = 16;

      // Outer glow
      g.fillStyle(cfg.color, 0.18);
      g.fillCircle(cx, cy, r + 10);
      g.lineStyle(1, cfg.color, 0.5);
      g.strokeCircle(cx, cy, r + 10);

      // Main icon circle
      g.fillStyle(cfg.color, 0.9);
      g.fillCircle(cx, cy, r);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(cx - 4, cy - 4, 5);

      // Sprite for collision detection (invisible)
      const sprite = this.scene.add.circle(cx, cy, r).setAlpha(0).setDepth(4);
      this.scene.physics.add.existing(sprite, true);
      this._track(sprite);

      // Label
      const lbl = this.scene.add.text(cx, cy - r - 18, cfg.label, {
        fontSize: '8px', fontFamily: 'Courier New', color: '#ffffff',
        align: 'center', lineSpacing: 1,
        backgroundColor: '#00000099', padding: { x: 3, y: 2 },
      }).setOrigin(0.5).setDepth(7);
      this._track(lbl);

      // Pulse ring
      const pGfx = this.scene.add.graphics().setDepth(3);
      pGfx.lineStyle(2, cfg.color, 0.6);
      pGfx.strokeCircle(cx, cy, r + 10);
      this._track(pGfx);
      this.scene.tweens.add({
        targets: pGfx, scaleX: 1.6, scaleY: 1.6, alpha: 0,
        duration: 1400, repeat: -1, ease: 'Sine.easeOut',
      });

      onRegister(sprite, id);
    });
  }

  // ── FURNITURE DRAWERS ─────────────────────────────────────────────────────

  _drawDesk(g, col, row, w = 1, h = 1) {
    const x = col * TILE + 3, y = row * TILE + 6;
    const dw = w * TILE - 6, dh = h * TILE - 8;
    // Surface (brown)
    g.fillStyle(0x5c3d1e, 1); g.fillRect(x, y, dw, dh);
    // Front edge
    g.fillStyle(0x7a5230, 1); g.fillRect(x, y, dw, 5);
    // Legs
    g.fillStyle(0x3d2810, 1);
    g.fillRect(x, y + dh - 4, 4, 4);
    g.fillRect(x + dw - 4, y + dh - 4, 4, 4);
    // Monitor
    const mx = x + dw / 2 - 9, my = y + 3;
    g.fillStyle(0x111122, 1); g.fillRect(mx, my, 18, 12);
    g.fillStyle(0x0033cc, 1); g.fillRect(mx + 1, my + 1, 16, 10);
    // Screen glint
    g.fillStyle(0xffffff, 0.3); g.fillRect(mx + 2, my + 2, 5, 3);
    // Stand
    g.fillStyle(0x222233, 1); g.fillRect(mx + 7, my + 12, 4, 3);
    // Keyboard
    g.fillStyle(0xaaaaaa, 1); g.fillRect(x + 3, y + dh - 10, dw - 6, 6);
    g.fillStyle(0x888888, 1); g.fillRect(x + 4, y + dh - 9, dw - 8, 1);
  }

  _drawMonitor(g, col, row) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    g.fillStyle(0x111122, 1); g.fillRect(cx - 12, cy - 8, 24, 16);
    g.fillStyle(0x002288, 1); g.fillRect(cx - 11, cy - 7, 22, 14);
    g.fillStyle(0x0055ff, 0.3); g.fillRect(cx - 9, cy - 5, 10, 6);
    g.fillStyle(0xffffff, 0.2); g.fillRect(cx - 11, cy - 7, 22, 2);
    g.fillStyle(0x333344, 1); g.fillRect(cx - 2, cy + 7, 4, 4);
    g.fillStyle(0x444455, 1); g.fillRect(cx - 6, cy + 10, 12, 2);
  }

  _drawPlant(g, col, row, size = 1) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2 + 4;
    const r = size === 2 ? 18 : 12;
    // Pot
    g.fillStyle(0x8b4513, 1); g.fillRect(cx - 8, cy + r - 6, 16, 10);
    g.fillStyle(0xa0522d, 1); g.fillRect(cx - 9, cy + r - 8, 18, 4);
    // Leaves
    g.fillStyle(0x1a6611, 1); g.fillCircle(cx, cy, r);
    g.fillStyle(0x228822, 1); g.fillCircle(cx - 4, cy - 4, r - 4);
    g.fillStyle(0x33aa33, 0.5); g.fillCircle(cx + 3, cy - 6, r - 6);
    // Leaf highlight
    g.fillStyle(0x55cc55, 0.4); g.fillCircle(cx - 2, cy - 2, 4);
  }

  _drawServerRack(g, col, row) {
    const x = col * TILE + 2, y = row * TILE + 2;
    const rw = TILE - 4, rh = TILE - 4;
    // Cabinet body
    g.fillStyle(0x1a1a2e, 1); g.fillRect(x, y, rw, rh);
    // Face plate
    g.fillStyle(0x222244, 1); g.fillRect(x + 2, y + 2, rw - 4, rh - 4);
    // Drive bays (4)
    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x333355, 1);
      g.fillRect(x + 3, y + 3 + i * 6, rw - 6, 4);
      // Status LED
      const led = this._rand(3);
      const ledColor = led === 0 ? 0x00ff00 : led === 1 ? 0xff8800 : 0xff0000;
      g.fillStyle(ledColor, 1);
      g.fillCircle(x + rw - 5, y + 5 + i * 6, 2);
    }
    // Top brand strip
    g.fillStyle(0x0044aa, 1); g.fillRect(x + 2, y + 2, rw - 4, 3);
    // Shadow under rack
    g.fillStyle(0x000000, 0.4); g.fillRect(x + 2, y + rh, rw - 2, 3);
  }

  _drawChair(g, col, row) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2 + 4;
    // Seat
    g.fillStyle(0x3a5a8a, 1); g.fillRect(cx - 8, cy - 4, 16, 12);
    g.fillStyle(0x4a7acc, 0.4); g.fillRect(cx - 8, cy - 4, 16, 4);
    // Back
    g.fillStyle(0x2a4a7a, 1); g.fillRect(cx - 7, cy - 12, 14, 9);
    // Wheels
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 6, cy + 9, 3);
    g.fillCircle(cx + 6, cy + 9, 3);
    g.fillCircle(cx, cy + 11, 3);
  }

  // ── FEATURE IMPLEMENTATIONS ────────────────────────────────────────────────

  _drawReception(g, cols, rows) {
    // Large L-shaped reception desk
    // Horizontal bar
    for (let c = 10; c <= 18; c++) {
      const x = c * TILE + 2, y = 5 * TILE + 4;
      g.fillStyle(0x4a3020, 1); g.fillRect(x, y, TILE - 4, TILE - 6);
      g.fillStyle(0x6a5040, 1); g.fillRect(x, y, TILE - 4, 5);
      g.fillStyle(0x302010, 1); g.fillRect(x, y + TILE - 9, TILE - 4, 3);
    }
    // Vertical extension on left
    for (let r = 5; r <= 7; r++) {
      const x = 10 * TILE + 2, y = r * TILE + 4;
      g.fillStyle(0x4a3020, 1); g.fillRect(x, y, TILE - 4, TILE - 4);
      g.fillStyle(0x6a5040, 1); g.fillRect(x, y, TILE - 4, 5);
    }
    // Computer on desk
    this._drawMonitor(g, 14, 4);
    // Phone
    g.fillStyle(0x111111, 1); g.fillRect(16 * TILE + 8, 4 * TILE + 12, 12, 8);
    g.fillStyle(0x333333, 1); g.fillRect(17 * TILE + 2, 4 * TILE + 8, 10, 6);
    // "RECEPTION" sign on desk
    this._track(this.scene.add.text(14 * TILE + TILE / 2, 5 * TILE + 10, 'RECEPTION', {
      fontSize: '7px', fontFamily: 'Courier New', color: '#00ff88', align: 'center',
    }).setOrigin(0.5).setDepth(6));

    // Company logo on back wall
    this._track(this.scene.add.text(15 * TILE, 2 * TILE, '◈  AcmeCorp', {
      fontSize: '16px', fontFamily: 'Courier New', color: '#00aaff',
      stroke: '#003366', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4));
    this._track(this.scene.add.text(15 * TILE, 2 * TILE + 20, 'Secure Your Future™', {
      fontSize: '9px', fontFamily: 'Courier New', color: '#3366aa',
    }).setOrigin(0.5).setDepth(4));
  }

  _drawPlantsCorners(g, cols, rows) {
    [[2, 2], [cols - 3, 2], [2, rows - 3], [cols - 3, rows - 3]].forEach(([c, r]) => {
      this._drawPlant(g, c, r, 2);
    });
  }

  _drawPlantsSides(g, cols, rows) {
    [[2, 3], [2, rows - 4], [cols - 3, 3], [cols - 3, rows - 4]].forEach(([c, r]) => {
      this._drawPlant(g, c, r, 1);
    });
  }

  _drawSecurityPosters(g, cols, rows) {
    const spots = [[14, 2], [15, 2]];
    spots.forEach(([c, r]) => {
      const px = c * TILE + 4, py = r * TILE + 4;
      g.fillStyle(0x002244, 1); g.fillRect(px, py, TILE - 8, TILE - 8);
      g.lineStyle(1, 0x0055aa, 1); g.strokeRect(px, py, TILE - 8, TILE - 8);
      g.fillStyle(0x00aaff, 1); g.fillRect(px + 3, py + 3, TILE - 14, 3);
      g.fillStyle(0x4488ff, 0.7); g.fillRect(px + 3, py + 8, TILE - 14, 2);
      g.fillStyle(0x4488ff, 0.7); g.fillRect(px + 3, py + 12, TILE - 14, 2);
      this._track(this.scene.add.text(c * TILE + TILE / 2, r * TILE + TILE / 2 + 8,
        '🔒\nSECURE', {
          fontSize: '7px', fontFamily: 'Courier New', color: '#00ccff',
          align: 'center', lineSpacing: 1,
        }).setOrigin(0.5).setDepth(6));
    });
  }

  _drawBadgeScanners(g, cols, rows) {
    [[cols / 2 - 1, rows - 3], [cols / 2, rows - 3]].forEach(([c, r]) => {
      const bx = Math.floor(c) * TILE + TILE / 2;
      const by = Math.floor(r) * TILE + TILE / 2;
      g.fillStyle(0x111133, 1); g.fillRect(bx - 6, by - 10, 12, 18);
      g.lineStyle(1, 0x3366ff, 1); g.strokeRect(bx - 6, by - 10, 12, 18);
      g.fillStyle(0x00ff44, 1); g.fillCircle(bx, by - 4, 3);
      this._track(this.scene.add.text(bx, by + 8, 'BADGE', {
        fontSize: '6px', fontFamily: 'Courier New', color: '#336666',
      }).setOrigin(0.5).setDepth(6));
    });
  }

  _drawElevator(g, cols, rows) {
    const ex = 2 * TILE, ey = 8 * TILE;
    g.fillStyle(0x223344, 1); g.fillRect(ex, ey, TILE * 2, TILE * 3);
    g.lineStyle(2, 0x4488bb, 1); g.strokeRect(ex, ey, TILE * 2, TILE * 3);
    // Door seam
    g.lineStyle(1, 0x336699, 0.8);
    g.lineBetween(ex + TILE, ey + 4, ex + TILE, ey + TILE * 3 - 4);
    // Panel
    g.fillStyle(0x334455, 1); g.fillRect(ex + TILE * 2 + 4, ey + TILE, 8, TILE);
    g.fillStyle(0xffdd00, 1); g.fillCircle(ex + TILE * 2 + 8, ey + TILE + 8, 4);
    g.fillStyle(0x888888, 1); g.fillCircle(ex + TILE * 2 + 8, ey + TILE + 18, 4);
    this._track(this.scene.add.text(ex + TILE, ey + TILE, '▲▼', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#88bbff', align: 'center',
    }).setOrigin(0.5).setDepth(4));
  }

  _drawCubicles(g, cols, rows) {
    // Main desk clusters (2×2 pods)
    const pods = [
      [3, 4], [8, 4], [13, 4],
      [3, 10], [8, 10],
      [3, 14], [8, 14],
    ];
    pods.forEach(([pc, pr]) => {
      // Dividers
      g.fillStyle(0x446644, 0.8);
      g.fillRect(pc * TILE, pr * TILE, 2, TILE * 3);
      g.fillRect(pc * TILE, pr * TILE, TILE * 4, 2);
      // Desks (2 per pod)
      this._drawDesk(g, pc + 1, pr + 1);
      this._drawDesk(g, pc + 2, pr + 1);
      this._drawDesk(g, pc + 1, pr + 2);
      this._drawDesk(g, pc + 2, pr + 2);
    });
    // Extra desks right side
    [[20, 5], [22, 5], [20, 9], [22, 9], [20, 13], [22, 13]].forEach(([c, r]) => {
      this._drawDesk(g, c, r);
      this._drawChair(g, c, r + 1);
    });
  }

  _drawCoffeeStation(g, cols, rows) {
    const cx = 24 * TILE, cy = 14 * TILE;
    // Counter
    g.fillStyle(0x5c3d1e, 1); g.fillRect(cx, cy, TILE * 3, TILE * 2);
    g.fillStyle(0x7a5230, 1); g.fillRect(cx, cy, TILE * 3, 5);
    // Coffee machine
    g.fillStyle(0x2a2a2a, 1); g.fillRect(cx + 4, cy - TILE, 18, TILE - 2);
    g.fillStyle(0x444444, 1); g.fillRect(cx + 5, cy - TILE + 2, 16, TILE - 6);
    g.fillStyle(0xff6600, 1); g.fillCircle(cx + 13, cy - TILE + 6, 4);
    g.fillStyle(0x111111, 1); g.fillRect(cx + 8, cy - 10, 10, 8);
    // Cups
    g.fillStyle(0xffffff, 0.8); g.fillRect(cx + TILE, cy - 4, 8, 6);
    g.fillStyle(0x8b4513, 0.7); g.fillRect(cx + TILE, cy - 3, 8, 4);
    this._track(this.scene.add.text(cx + TILE * 1.5, cy + TILE, '☕ COFFEE', {
      fontSize: '8px', fontFamily: 'Courier New', color: '#aa6633',
    }).setOrigin(0.5).setDepth(6));
  }

  _drawWhiteboard(g, cols, rows) {
    const wx = 2 * TILE, wy = 8 * TILE;
    // Frame
    g.fillStyle(0x3a3a3a, 1); g.fillRect(wx - 2, wy - 2, TILE * 2 + 4, TILE + 4);
    // Surface
    g.fillStyle(0xeef0f0, 1); g.fillRect(wx, wy, TILE * 2, TILE);
    // Marker lines
    g.fillStyle(0x0044cc, 0.8);
    g.fillRect(wx + 4, wy + 8, 28, 2);
    g.fillRect(wx + 4, wy + 14, 20, 2);
    g.fillStyle(0xcc2200, 0.8);
    g.fillRect(wx + 4, wy + 20, 24, 2);
    g.fillStyle(0x00aa00, 0.8);
    g.fillRect(wx + 8, wy + 6, 10, 10); // box
    this._track(this.scene.add.text(wx + TILE, wy - 10, 'WHITEBOARD', {
      fontSize: '7px', fontFamily: 'Courier New', color: '#666666',
    }).setOrigin(0.5).setDepth(6));
  }

  _drawDirectionSigns(g, cols, rows) {
    // Hanging signs for doors
    this.cfg.doors.forEach(door => {
      if (door.toRoom === 'lobby') return;
      const sx = door.col * TILE + TILE / 2;
      const sy = 3 * TILE;
      g.fillStyle(0x002244, 0.9);
      g.fillRect(sx - 30, sy - 10, 60, 18);
      g.lineStyle(1, 0x0055aa, 1);
      g.strokeRect(sx - 30, sy - 10, 60, 18);
      this._track(this.scene.add.text(sx, sy, door.label || door.toRoom.toUpperCase(), {
        fontSize: '7px', fontFamily: 'Courier New', color: '#44aaff', align: 'center',
      }).setOrigin(0.5).setDepth(7));
    });
  }

  _drawCCTV(g, cols, rows) {
    [[4, 1], [cols - 5, 1], [4, rows - 2], [cols - 5, rows - 2]].forEach(([c, r]) => {
      const cx = c * TILE + TILE / 2, cy = r * TILE + TILE / 2;
      g.fillStyle(0x1a1a2a, 1); g.fillCircle(cx, cy, 5);
      g.fillStyle(0x444466, 1); g.fillRect(cx - 6, cy - 2, 4, 4);
      g.lineStyle(1, 0x333355, 0.8); g.strokeCircle(cx, cy, 5);
      g.fillStyle(0xff0000, 1); g.fillCircle(cx + 3, cy - 3, 2);
    });
  }

  _drawHelpdesk(g, cols, rows) {
    // Large L-shaped desk
    for (let c = 7; c <= 12; c++) this._drawDesk(g, c, 7);
    for (let r = 8; r <= 10; r++) this._drawDesk(g, 7, r);
    // Extra monitors
    this._drawMonitor(g, 9, 6);
    this._drawMonitor(g, 11, 6);
    // "IT HELP DESK" sign
    this._track(this.scene.add.text(9 * TILE + TILE, 6 * TILE - 8, '🖥 IT HELPDESK', {
      fontSize: '9px', fontFamily: 'Courier New', color: '#44aaff',
    }).setOrigin(0.5).setDepth(6));
    // Cable/patch panel
    g.fillStyle(0x1a1a2a, 1); g.fillRect(24 * TILE, 6 * TILE, TILE * 3, TILE);
    for (let i = 0; i < 12; i++) {
      g.fillStyle(i % 3 === 0 ? 0x00ff00 : 0xff8800, 1);
      g.fillRect(24 * TILE + 4 + i * 7, 6 * TILE + 4, 4, 4);
    }
    this._track(this.scene.add.text(25 * TILE + TILE / 2, 7 * TILE + 4, 'PATCH PANEL', {
      fontSize: '7px', fontFamily: 'Courier New', color: '#336666',
    }).setOrigin(0.5).setDepth(6));
  }

  _drawCableRuns(g, cols, rows) {
    g.lineStyle(2, 0x004422, 0.6);
    g.lineBetween(3 * TILE, rows / 2 * TILE, (cols - 3) * TILE, rows / 2 * TILE);
    g.lineStyle(1, 0x006633, 0.4);
    g.lineBetween(3 * TILE, rows / 2 * TILE - 3, (cols - 3) * TILE, rows / 2 * TILE - 3);
    g.lineBetween(3 * TILE, rows / 2 * TILE + 3, (cols - 3) * TILE, rows / 2 * TILE + 3);
  }

  _drawServerMaze(g, cols, rows) {
    const racks = [
      [3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
      [3,7],[4,7],[5,7],[6,7],[7,7],[8,7],
      [3,11],[4,11],[5,11],[6,11],[7,11],
      [3,15],[4,15],[5,15],[6,15],
      [12,4],[13,4],[14,4],[15,4],
      [12,8],[13,8],[14,8],[15,8],
      [12,12],[13,12],[14,12],
      [20,5],[20,8],[20,11],[20,14],
    ];
    racks.forEach(([c, r]) => this._drawServerRack(g, c, r));

    // Floor cable channels
    g.lineStyle(2, 0x001122, 0.8);
    for (let r = 5; r < rows - 2; r += 4) {
      g.lineBetween(2 * TILE, r * TILE, (cols - 2) * TILE, r * TILE);
    }
    g.lineBetween(10 * TILE, 2 * TILE, 10 * TILE, (rows - 2) * TILE);
    g.lineBetween(18 * TILE, 2 * TILE, 18 * TILE, (rows - 2) * TILE);
  }

  _drawBlinkLights(cols, rows) {
    const positions = [
      [4,3],[7,3],[12,4],[15,4],[20,5],[4,11],[7,11],[12,12],
    ];
    positions.forEach(([c, r]) => {
      const cx = c * TILE + TILE / 2, cy = r * TILE + 4;
      const dot = this.scene.add.graphics().setDepth(8);
      const colors = [0x00ff00, 0xff8800, 0xff0000, 0x0088ff];
      const color = colors[this._rand(4)];
      dot.fillStyle(color, 1); dot.fillCircle(cx, cy, 3);
      this._track(dot);
      this.scene.tweens.add({
        targets: dot, alpha: 0.1, duration: 300 + this._rand(700),
        yoyo: true, repeat: -1,
      });
    });
  }

  _drawDangerSigns(g, cols, rows) {
    [[11, 2], [11, rows - 3]].forEach(([c, r]) => {
      const px = c * TILE + 4, py = r * TILE + 4;
      g.fillStyle(0xff4400, 0.9); g.fillRect(px, py, TILE - 8, TILE - 8);
      g.lineStyle(2, 0xffcc00, 1); g.strokeRect(px, py, TILE - 8, TILE - 8);
      this._track(this.scene.add.text(c * TILE + TILE / 2, r * TILE + TILE / 2,
        '⚠️\nHV', {
          fontSize: '9px', fontFamily: 'Courier New', color: '#ffdd00',
          align: 'center', lineSpacing: 1,
        }).setOrigin(0.5).setDepth(6));
    });
  }

  _drawKitchen(g, cols, rows) {
    // Counter along top-right
    g.fillStyle(0x6a5040, 1); g.fillRect(16 * TILE, 2 * TILE, TILE * 10, TILE * 2);
    g.fillStyle(0x8a7060, 1); g.fillRect(16 * TILE, 2 * TILE, TILE * 10, 5);
    // Sink
    g.fillStyle(0x888899, 1); g.fillRect(20 * TILE + 4, 2 * TILE + 4, TILE - 8, TILE - 8);
    g.fillStyle(0x3366aa, 0.6); g.fillRect(20 * TILE + 6, 2 * TILE + 6, TILE - 12, TILE - 12);
    // Fridge
    g.fillStyle(0xaabbcc, 1); g.fillRect(16 * TILE + 2, 3 * TILE, TILE * 2 - 4, TILE * 2 - 2);
    g.lineStyle(1, 0x8899aa, 1); g.strokeRect(16 * TILE + 2, 3 * TILE, TILE * 2 - 4, TILE - 1);
    g.fillStyle(0x778899, 1); g.fillRect(17 * TILE - 2, 3 * TILE + 4, 4, TILE - 10);
    // Coffee machine
    g.fillStyle(0x2a2a2a, 1); g.fillRect(24 * TILE + 4, 2 * TILE - 14, 20, TILE + 12);
    g.fillStyle(0xff6600, 1); g.fillCircle(24 * TILE + 14, 2 * TILE - 6, 5);
    g.fillStyle(0x111111, 1); g.fillRect(24 * TILE + 6, 3 * TILE - 4, 16, 10);
    // Microwave
    g.fillStyle(0x333333, 1); g.fillRect(22 * TILE + 2, 2 * TILE - 14, TILE * 2 - 4, 14);
    g.fillStyle(0x222222, 1); g.fillRect(22 * TILE + 4, 2 * TILE - 12, TILE - 6, 10);
    g.fillStyle(0x004400, 0.7); g.fillRect(22 * TILE + 5, 2 * TILE - 11, TILE - 8, 8);
    // Table and chairs
    g.fillStyle(0x7a5230, 1); g.fillRect(5 * TILE, 10 * TILE, TILE * 6, TILE * 4);
    g.fillStyle(0x8b6040, 1); g.fillRect(5 * TILE, 10 * TILE, TILE * 6, 6);
    this._drawChair(g, 5, 11); this._drawChair(g, 7, 11); this._drawChair(g, 9, 11);
    this._drawChair(g, 5, 13); this._drawChair(g, 7, 13); this._drawChair(g, 9, 13);
  }

  _drawCouchArea(g, cols, rows) {
    // Couch
    g.fillStyle(0x334a5a, 1); g.fillRect(6 * TILE, 5 * TILE, TILE * 5, TILE * 2);
    g.fillStyle(0x446688, 1); g.fillRect(6 * TILE, 5 * TILE, TILE * 5, 6);
    g.fillStyle(0x446688, 1); g.fillRect(6 * TILE, 5 * TILE, 6, TILE * 2); // arm L
    g.fillStyle(0x446688, 1); g.fillRect(11 * TILE - 6, 5 * TILE, 6, TILE * 2); // arm R
    // Coffee table
    g.fillStyle(0x5c3d1e, 1); g.fillRect(7 * TILE + 4, 8 * TILE, TILE * 3 - 8, TILE - 4);
    g.fillStyle(0x7a5230, 1); g.fillRect(7 * TILE + 4, 8 * TILE, TILE * 3 - 8, 4);
    // Notice board
    this._drawNoticeBoard(g, cols, rows);
  }

  _drawNoticeBoard(g, cols, rows) {
    const nx = 2 * TILE, ny = 6 * TILE;
    g.fillStyle(0x3a2a0a, 1); g.fillRect(nx, ny, TILE * 2, TILE);
    g.fillStyle(0xcc9922, 1); g.fillRect(nx + 2, ny + 2, TILE * 2 - 4, TILE - 4);
    // Pinned notes
    [[4,4,0xff3333],[10,6,0x3333ff],[16,4,0x33aa33],[22,8,0xffcc00]].forEach(([ox,oy,c]) => {
      g.fillStyle(c, 0.9); g.fillRect(nx + ox, ny + oy, 8, 6);
      g.fillStyle(0xffffff, 0.8); g.fillRect(nx + ox + 1, ny + oy + 1, 6, 1);
    });
    this._track(this.scene.add.text(nx + TILE, ny + TILE + 6, 'NOTICE BOARD', {
      fontSize: '7px', fontFamily: 'Courier New', color: '#885500',
    }).setOrigin(0.5).setDepth(6));
  }

  _drawSOCScreens(g, cols, rows) {
    // Large curved bank of screens across the north wall
    for (let c = 8; c <= 20; c++) {
      const sx = c * TILE + 2, sy = 2 * TILE + 4;
      g.fillStyle(0x111122, 1); g.fillRect(sx, sy, TILE - 4, TILE - 6);
      // Different data on each screen
      const hue = (c - 8) / 13;
      const col = hue < 0.33 ? 0x00ff88 : hue < 0.66 ? 0x44aaff : 0xff4444;
      g.fillStyle(col, 0.8); g.fillRect(sx + 1, sy + 1, TILE - 6, 3);
      g.fillStyle(0x000033, 1); g.fillRect(sx + 1, sy + 4, TILE - 6, TILE - 12);
      // Graph lines
      for (let j = 0; j < 3; j++) {
        g.fillStyle(col, 0.4 + j * 0.1);
        g.fillRect(sx + 2, sy + 5 + j * 6, TILE - 8, 2);
      }
      // Screen glow
      g.fillStyle(col, 0.05); g.fillRect(sx - 2, sy - 2, TILE, TILE - 2);
    }
    // Screen bank label
    this._track(this.scene.add.text(14 * TILE, 1 * TILE + 14, '[ THREAT MONITORING DASHBOARD ]', {
      fontSize: '9px', fontFamily: 'Courier New', color: '#2255aa',
    }).setOrigin(0.5).setDepth(6));
    // Animated "live" indicator
    const liveDot = this.scene.add.graphics().setDepth(8);
    liveDot.fillStyle(0xff0000, 1); liveDot.fillCircle(24 * TILE, TILE + 10, 3);
    this._track(liveDot);
    this.scene.tweens.add({ targets: liveDot, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
    this._track(this.scene.add.text(24 * TILE + 6, TILE + 10, '● LIVE', {
      fontSize: '8px', fontFamily: 'Courier New', color: '#ff3333',
    }).setOrigin(0, 0.5).setDepth(8));
  }

  _drawAnalysisDesks(g, cols, rows) {
    const pods = [[7,7],[14,7],[19,7],[7,13],[14,13]];
    pods.forEach(([c, r]) => {
      this._drawDesk(g, c, r, 2, 1);
      this._drawChair(g, c, r + 1);
      this._drawChair(g, c + 1, r + 1);
    });
  }

  _drawServerWall(g, cols, rows) {
    // Right-side server wall
    for (let r = 1; r < rows - 1; r += 2) {
      this._drawServerRack(g, cols - 5, r);
      this._drawServerRack(g, cols - 4, r);
      if (r + 1 < rows - 1) {
        this._drawServerRack(g, cols - 5, r + 1);
        this._drawServerRack(g, cols - 4, r + 1);
      }
    }
  }

  _drawBlinkingMonitors(cols, rows) {
    const spots = [[6,5],[8,5],[10,5],[15,5],[17,5],[6,12],[8,12],[15,12]];
    spots.forEach(([c, r]) => {
      const mx = c * TILE + 6, my = r * TILE + 6;
      const mon = this.scene.add.graphics().setDepth(3);
      mon.fillStyle(0x002266, 1); mon.fillRect(mx, my, 20, 14);
      this._track(mon);
      // Random screen content swap
      this.scene.time.addEvent({
        delay: 2000 + this._rand(3000),
        loop: true,
        callback: () => {
          const col = [0x002266, 0x003300, 0x220033][this._rand(3)];
          mon.clear(); mon.fillStyle(col, 1); mon.fillRect(mx, my, 20, 14);
          // Data line
          mon.fillStyle(0x00ff88, 0.6); mon.fillRect(mx + 2, my + 3, 8 + this._rand(8), 2);
          mon.fillStyle(0x4488ff, 0.5); mon.fillRect(mx + 2, my + 8, 10 + this._rand(6), 2);
        },
      });
    });
  }

  // ── UTILITIES ─────────────────────────────────────────────────────────────

  _track(obj) {
    this._cleanup.push(obj);
    return obj;
  }
}
