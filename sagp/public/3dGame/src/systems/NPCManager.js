const TILE = 32;
const CHAR_SCALE_W = 32;
const CHAR_SCALE_H = 40;

// Direction frames (6 frames each in the run sheet)
const DIR_FRAME = { down: 0, left: 6, right: 12, up: 18 };

export class NPCManager {
  constructor(scene, roomCfg) {
    this.scene  = scene;
    this.npcs   = [];
    this._build(roomCfg.npcs || []);
  }

  _build(npcDefs) {
    npcDefs.forEach(def => {
      const { char, col, row, anim, label, tint } = def;
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;

      const key = `${char}_run`;
      if (!this.scene.textures.exists(key)) return; // asset not loaded

      const sprite = this.scene.add.sprite(x, y, key, DIR_FRAME.down)
        .setDisplaySize(CHAR_SCALE_W, CHAR_SCALE_H)
        .setDepth(9);

      if (tint) sprite.setTint(tint);

      this.scene._roomCleanup.push(sprite);

      let npcObj;

      if (anim === 'patrol') {
        // Simple 2-point patrol
        npcObj = this._setupPatrol(sprite, char, x, y, x + TILE * 6, y);
      } else if (anim === 'phone') {
        sprite.anims.play(`${char}_idle_down`, true);
        npcObj = { sprite, update: () => {} };
      } else {
        // Idle with gentle bob
        sprite.anims.play(`${char}_idle_down`, true);
        const startY = y;
        let t = Math.random() * Math.PI * 2;
        npcObj = { sprite, update: () => {
          t += 0.02;
          sprite.y = startY + Math.sin(t) * 1.5;
        }};
      }

      // Name label
      const lbl = this.scene.add.text(x, y - CHAR_SCALE_H / 2 - 6, label || '', {
        fontSize: '8px', fontFamily: 'Courier New', color: '#aaccdd',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 },
        align: 'center',
      }).setOrigin(0.5).setDepth(11);
      this.scene._roomCleanup.push(lbl);
      npcObj._label = lbl;

      this.npcs.push(npcObj);
    });
  }

  _setupPatrol(sprite, char, x1, y1, x2, y2) {
    const SPEED = 0.3;
    let forward = true;
    let t = 0;

    return {
      sprite,
      update: () => {
        t += forward ? SPEED : -SPEED;
        if (t >= 1) { t = 1; forward = false; sprite.anims.play(`${char}_walk_left`, true); }
        if (t <= 0) { t = 0; forward = true;  sprite.anims.play(`${char}_walk_right`, true); }

        sprite.x = Phaser.Math.Linear(x1, x2, t);
        sprite.y = Phaser.Math.Linear(y1, y2, t);

        if (t === 0 || t === 1) {
          // pause briefly at ends
        }
      },
      _label: null,
    };
  }

  update() {
    this.npcs.forEach(npc => {
      npc.update();
      if (npc._label) {
        npc._label.x = npc.sprite.x;
        npc._label.y = npc.sprite.y - CHAR_SCALE_H / 2 - 6;
      }
    });
  }

  destroy() {
    // sprites tracked in _roomCleanup, nothing extra needed
    this.npcs = [];
  }
}
