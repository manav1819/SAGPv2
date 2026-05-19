const TILE = 32;
const CHAR_SCALE_W = 32;
const CHAR_SCALE_H = 40;

// Direction frames (6 frames each in the run/idle sheet: row 0)
const DIR_FRAME = { down: 0, left: 6, right: 12, up: 18 };

export class NPCManager {
  constructor(scene, roomCfg) {
    this.scene   = scene;
    this.roomCfg = roomCfg;   // stored so patrol can read room bounds
    this.npcs    = [];
    this._build(roomCfg.npcs || []);
  }

  _build(npcDefs) {
    npcDefs.forEach(def => {
      const { char, col, row, anim, label, tint } = def;
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;

      // Prefer the run sheet for sprite creation (it's always loaded)
      const runKey  = `${char}_run`;
      const idleKey = `${char}_idle`;
      const hasRun  = this.scene.textures.exists(runKey);
      const hasIdle = this.scene.textures.exists(idleKey);

      if (!hasRun && !hasIdle) return; // nothing to draw

      // Create sprite using run sheet (has all 4 directions × 6 frames)
      const sheetKey = hasRun ? runKey : idleKey;
      const sprite = this.scene.add.sprite(x, y, sheetKey, DIR_FRAME.down)
        .setDisplaySize(CHAR_SCALE_W, CHAR_SCALE_H)
        .setDepth(9);

      if (tint) sprite.setTint(tint);
      this.scene._roomCleanup.push(sprite);

      let npcObj;

      if (anim === 'patrol') {
        // Random-waypoint patrol across the whole room (slow, natural guard movement)
        npcObj = this._setupRandomPatrol(sprite, char, x, y);
      } else if (anim === 'phone') {
        // Standing still, playing idle animation (represents phone use)
        this._playIdle(sprite, char, 'down');
        npcObj = { sprite, update: () => {} };
      } else {
        // Idle with a gentle vertical bob
        this._playIdle(sprite, char, 'down');
        const startY = y;
        let t = Math.random() * Math.PI * 2;
        npcObj = {
          sprite,
          update: () => {
            t += 0.02;
            sprite.y = startY + Math.sin(t) * 1.5;
          },
        };
      }

      // Name label above the sprite
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Play idle animation for a character + direction, with safe fallback to _down */
  _playIdle(sprite, char, dir = 'down') {
    const key = `${char}_idle_${dir}`;
    const fallback = `${char}_idle_down`;
    if (sprite.anims.currentAnim?.key === key) return;
    if (this.scene.anims.exists(key)) {
      sprite.anims.play(key, true);
    } else if (this.scene.anims.exists(fallback)) {
      sprite.anims.play(fallback, true);
    }
  }

  /** Play walk animation for a character + direction, with safe fallback */
  _playWalk(sprite, char, dir = 'down') {
    const key = `${char}_walk_${dir}`;
    if (sprite.anims.currentAnim?.key === key) return;
    if (this.scene.anims.exists(key)) {
      sprite.anims.play(key, true);
    } else {
      // Fallback: try walk_down, then idle_down
      const fallback = `${char}_walk_down`;
      if (this.scene.anims.exists(fallback)) sprite.anims.play(fallback, true);
    }
  }

  // ── Patrol system ──────────────────────────────────────────────────────────

  /**
   * Random-waypoint patrol across the whole room.
   * Guard picks a random point, walks to it at a realistic speed,
   * pauses briefly, then picks another. Direction and animation update
   * continuously so the sprite always faces the way it's moving.
   *
   * Speed: ~45 px/s  (a 30-col room ≈ 960px wide → ~21 s to cross fully)
   * Pause: 0.6 – 1.8 s at each waypoint
   */
  _setupRandomPatrol(sprite, char, startX, startY) {
    const SPEED_PX_PER_MS = 0.045;  // ~45 px/s — leisurely guard patrol
    const ARRIVE_DIST     = 5;      // px threshold for "arrived"

    // Stay 2.5 tiles inside the room walls on every side
    const margin = 2.5 * TILE;
    const minX   = margin;
    const maxX   = (this.roomCfg.cols - 1) * TILE - margin;
    const minY   = margin;
    const maxY   = (this.roomCfg.rows - 1) * TILE - margin;

    let targetX       = startX;
    let targetY       = startY;
    let waiting       = false;
    let waitRemaining = 0;
    let lastDir       = 'down';

    const pickNewTarget = () => {
      // Bias toward the far side of the room from current position for
      // more interesting patrol coverage
      const rx = Math.random();
      const ry = Math.random();
      targetX = minX + rx * (maxX - minX);
      targetY = minY + ry * (maxY - minY);
    };

    // Start walking immediately
    this._playWalk(sprite, char, 'down');
    pickNewTarget();

    return {
      sprite,
      update: (delta) => {
        if (waiting) {
          waitRemaining -= delta;
          if (waitRemaining <= 0) {
            waiting = false;
            pickNewTarget();
            this._playWalk(sprite, char, lastDir);
          }
          return;
        }

        const dx   = targetX - sprite.x;
        const dy   = targetY - sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ARRIVE_DIST) {
          // Arrived — idle briefly then move again
          this._playIdle(sprite, char, lastDir);
          waiting       = true;
          waitRemaining = 600 + Math.random() * 1200; // 0.6 – 1.8 s
        } else {
          // Move toward the target
          const step = SPEED_PX_PER_MS * delta;
          sprite.x += (dx / dist) * step;
          sprite.y += (dy / dist) * step;

          // Determine dominant movement direction for animation
          const dir = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down'  : 'up');

          if (dir !== lastDir) {
            lastDir = dir;
            this._playWalk(sprite, char, dir);
          }
        }
      },
      _label: null,
    };
  }

  // ── Update / destroy ───────────────────────────────────────────────────────

  update(delta = 16.67) {
    this.npcs.forEach(npc => {
      npc.update(delta);
      if (npc._label) {
        npc._label.x = npc.sprite.x;
        npc._label.y = npc.sprite.y - CHAR_SCALE_H / 2 - 6;
      }
    });
  }

  destroy() {
    // Sprites are tracked in _roomCleanup — no extra cleanup needed here
    this.npcs = [];
  }
}
