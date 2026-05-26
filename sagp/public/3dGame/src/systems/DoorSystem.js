const TILE = 32;

export class DoorSystem {
  constructor(scene, roomCfg, gameState, onTransition) {
    this.scene       = scene;
    this.cfg         = roomCfg;
    this.state       = gameState;
    this.onTransition = onTransition;
    this._zones      = [];
    this._hints      = {};
    this._cooldown   = false;

    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this._buildZones();
  }

  _buildZones() {
    this.cfg.doors.forEach((door, i) => {
      const isLocked = door.lockedUntil &&
        !this.state.completedRooms.has(door.lockedUntil);

      // Store lock state on door object for re-rendering
      door._locked = isLocked;

      const zone = this.scene.add.zone(
        door.col * TILE + TILE / 2,
        door.row * TILE + TILE / 2,
        TILE + 8, TILE + 8
      );
      this.scene.physics.add.existing(zone, true);
      zone._door   = door;
      zone._locked = isLocked;
      this._zones.push(zone);
      this.scene._roomCleanup.push(zone);
    });
  }

  unlockNextDoor() {
    const { id } = this.cfg;
    this._zones.forEach(z => {
      if (z._door.lockedUntil === id) {
        z._locked = false;
        z._door._locked = false;
        // Flash the door zone
        const flash = this.scene.add.graphics().setDepth(10);
        this.scene._roomCleanup.push(flash);
        flash.fillStyle(0x00ff88, 0.4);
        flash.fillRect(
          z._door.col * TILE, z._door.row * TILE, TILE, TILE
        );
        this.scene.tweens.add({
          targets: flash, alpha: 0, duration: 800,
          onComplete: () => flash.clear(),
        });
        // Update label text
        if (this._hints[z._door.toRoom]) {
          this._hints[z._door.toRoom].setColor('#00ccff');
        }
      }
    });
  }

  update(playerSprite) {
    if (this._cooldown) return;
    const px = playerSprite.x, py = playerSprite.y;

    for (const zone of this._zones) {
      const door = zone._door;
      const dist = Phaser.Math.Distance.Between(px, py, zone.x, zone.y);

      if (dist < TILE * 1.2) {
        if (!this._hints[door.toRoom]) {
          const col = zone._locked ? '#aa6600' : '#00eeff';
          const msg = zone._locked
            ? `🔒 ${door.lockedUntil?.toUpperCase()} must be cleared first`
            : `[E] Enter ${door.toRoom.replace('_', ' ').toUpperCase()}`;
          const hint = this.scene.add.text(zone.x, zone.y - TILE - 4, msg, {
            fontSize: '10px', fontFamily: 'Courier New', color: col,
            backgroundColor: '#00000099', padding: { x: 6, y: 4 },
            align: 'center',
          }).setOrigin(0.5).setDepth(20);
          this._hints[door.toRoom] = hint;
          this.scene._roomCleanup.push(hint);
          this.scene.tweens.add({
            targets: hint, y: hint.y - 6,
            duration: 500, yoyo: true, repeat: -1,
          });
        }

        if (!zone._locked && Phaser.Input.Keyboard.JustDown(this.eKey)) {
          this._trigger(door);
          return;
        }
      } else {
        if (this._hints[door.toRoom]) {
          this._hints[door.toRoom].destroy();
          delete this._hints[door.toRoom];
        }
      }
    }
  }

  _trigger(door) {
    if (this._cooldown) return;
    this._cooldown = true;
    this.onTransition(door.toRoom, this.cfg.id, door.facing);
  }

  destroy() {
    Object.values(this._hints).forEach(h => h.destroy());
    this._hints = {};
  }
}
