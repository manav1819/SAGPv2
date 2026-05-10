const W = 960, H = 640;

export class HUD {
  constructor(scene, scoreManager, currentRoomId) {
    this.scene        = scene;
    this.scoreManager = scoreManager;
    this._notifTimer  = 0;
    this._depth       = 100;
    this._build(currentRoomId);
  }

  _build(roomId) {
    const s = this.scene;

    // Top bar background
    this.topBar = s.add.rectangle(W / 2, 20, W, 40, 0x060e18, 0.92)
      .setStrokeStyle(1, 0x1a3350).setScrollFactor(0).setDepth(this._depth);

    // Logo
    s.add.text(12, 8, '◈ CYBERGUARD', {
      fontSize: '15px', fontFamily: 'Courier New',
      color: '#00ff88', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // Room name
    this.roomText = s.add.text(180, 6, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#4488aa',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    this.subtitleText = s.add.text(180, 22, '', {
      fontSize: '9px', fontFamily: 'Courier New', color: '#2a4a5a',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // Security score
    this.secText = s.add.text(500, 8, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#44ffaa',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // Risk score
    this.riskText = s.add.text(660, 8, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#ffaa44',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // Progress
    this.progressText = s.add.text(820, 8, '', {
      fontSize: '12px', fontFamily: 'Courier New', color: '#8888cc',
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // Bottom hint bar
    s.add.rectangle(W / 2, H - 12, W, 22, 0x040a14, 0.85)
      .setScrollFactor(0).setDepth(this._depth);
    s.add.text(W / 2, H - 12,
      'WASD / ↑↓←→  Move   |   E  Interact / Enter Door', {
        fontSize: '10px', fontFamily: 'Courier New', color: '#334455',
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 1);

    // Notification area (centre-top, appears temporarily)
    this.notifBg = s.add.rectangle(W / 2, 60, 500, 30, 0x003322, 0)
      .setScrollFactor(0).setDepth(this._depth + 2);
    this.notifText = s.add.text(W / 2, 60, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#00ff88',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 3).setAlpha(0);

    // Minimap (bottom-right)
    this._buildMinimap();
  }

  _buildMinimap() {
    const mx = W - 120, my = H - 80;
    const s = this.scene;

    this.minimapBg = s.add.rectangle(mx, my, 110, 60, 0x040a14, 0.9)
      .setScrollFactor(0).setDepth(this._depth)
      .setStrokeStyle(1, 0x1a3350);

    // Room layout dots
    const layout = {
      lobby:       { x: 0,    y: -1.5 },
      hallway:     { x: 0,    y:  0   },
      cubicles:    { x: -1.2, y:  0   },
      it_dept:     { x:  1.2, y:  0   },
      breakroom:   { x: 0,    y:  1.5 },
      server_room: { x:  2.4, y:  0   },
      soc:         { x:  3.6, y:  0   },
    };

    this._minimapDots = {};
    Object.entries(layout).forEach(([id, pos]) => {
      const dx = mx + pos.x * 14;
      const dy = my + pos.y * 12;
      const dot = s.add.rectangle(dx, dy, 10, 7, 0x1a3350)
        .setScrollFactor(0).setDepth(this._depth + 1)
        .setStrokeStyle(1, 0x2a5070);
      this._minimapDots[id] = dot;
      // Tiny room label
      s.add.text(dx, dy + 8, id.slice(0, 3).toUpperCase(), {
        fontSize: '5px', fontFamily: 'Courier New', color: '#2a4a5a',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 1);
    });

    s.add.text(mx, my - 26, '[ MAP ]', {
      fontSize: '7px', fontFamily: 'Courier New', color: '#224433',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 1);
  }

  setRoom(name, subtitle) {
    this.roomText.setText(name.toUpperCase());
    this.subtitleText.setText(subtitle || '');
  }

  showRoomComplete(msg) {
    if (!msg) return;
    this.notifText.setText(msg).setAlpha(1);
    this.notifBg.setFillStyle(0x003322, 0.9).setAlpha(1);
    this._notifTimer = 3000;
  }

  highlightRoom(roomId, state = 'visited') {
    const dot = this._minimapDots[roomId];
    if (!dot) return;
    const colors = {
      current:  0x00ff88,
      visited:  0x225533,
      unlocked: 0x1a4466,
      locked:   0x1a3350,
    };
    dot.setFillStyle(colors[state] || 0x1a3350);
  }

  update(completedScenarios, totalScenarios, completedRooms, currentRoom) {
    const sm = this.scoreManager;
    this.secText.setText(`🛡 Security: ${sm.securityScore}`);
    this.riskText.setText(`⚠ Risk: ${sm.riskScore}`);
    this.progressText.setText(`${completedScenarios}/${totalScenarios} tasks`);

    // Update minimap dots
    Object.keys(this._minimapDots || {}).forEach(id => {
      if (id === currentRoom) this.highlightRoom(id, 'current');
      else if (completedRooms.has(id)) this.highlightRoom(id, 'visited');
    });

    // Fade notification
    if (this._notifTimer > 0) {
      this._notifTimer -= 16;
      if (this._notifTimer <= 0) {
        this.scene.tweens.add({
          targets: [this.notifText, this.notifBg],
          alpha: 0, duration: 500,
        });
      }
    }
  }
}
