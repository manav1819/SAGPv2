const TILE = 32;
const DISPLAY_W = 28;
const DISPLAY_H = 36;
const DIR_FRAME = { down: 0, left: 6, right: 12, up: 18 };

export class Player {
  constructor(scene, x, y) {
    this.scene   = scene;
    this.facing  = 'down';
    this.moving  = false;
    this.speed   = 170;

    // Use loaded spritesheet or fall back to procedural texture
    const hasSheet = scene.textures.exists('adam_run');

    if (hasSheet) {
      this.sprite = scene.physics.add.sprite(x, y, 'adam_run', 0)
        .setDisplaySize(DISPLAY_W, DISPLAY_H)
        .setDepth(10);
    } else {
      this._buildFallbackTexture(scene);
      this.sprite = scene.physics.add.sprite(x, y, 'player_fb')
        .setDisplaySize(DISPLAY_W, DISPLAY_H)
        .setDepth(10);
    }

    this.sprite.setCollideWorldBounds(false);
    this._useSheet = hasSheet;

    // Drop shadow
    this.shadow = scene.add.ellipse(x, y + 14, 20, 8, 0x000000, 0.35).setDepth(9);
    scene._roomCleanup.push(this.shadow);

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  _buildFallbackTexture(scene) {
    if (scene.textures.exists('player_fb')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x000000, 0.35); g.fillEllipse(14, 32, 20, 8);
    g.fillStyle(0x2255cc);       g.fillRoundedRect(3, 13, 22, 20, 4);
    g.fillStyle(0xffcc99);       g.fillCircle(14, 8, 9);
    g.fillStyle(0x000000);       g.fillCircle(10, 7, 2); g.fillCircle(18, 7, 2);
    g.fillStyle(0x00ff88);       g.fillRect(9, 19, 10, 6);
    g.fillStyle(0x003322);       g.fillRect(10, 20, 8, 4);
    g.generateTexture('player_fb', 28, 36);
    g.destroy();
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y + 14);
  }

  update(locked) {
    if (locked) {
      this.sprite.setVelocity(0, 0);
      this.moving = false;
      if (this._useSheet) this._playAnim('idle');
      return;
    }

    const { keys, speed } = this;
    let vx = 0, vy = 0;

    if (keys.left.isDown  || keys.a.isDown)  { vx = -speed; this.facing = 'left';  }
    if (keys.right.isDown || keys.d.isDown)  { vx =  speed; this.facing = 'right'; }
    if (keys.up.isDown    || keys.w.isDown)  { vy = -speed; this.facing = 'up';    }
    if (keys.down.isDown  || keys.s.isDown)  { vy =  speed; this.facing = 'down';  }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.sprite.setVelocity(vx, vy);
    this.moving = vx !== 0 || vy !== 0;

    // Shadow follows
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 14);

    if (this._useSheet) {
      this._playAnim(this.moving ? 'walk' : 'idle');
    }
  }

  _playAnim(type) {
    const key = `adam_${type}_${this.facing}`;
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.anims.play(key, true);
    }
  }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
