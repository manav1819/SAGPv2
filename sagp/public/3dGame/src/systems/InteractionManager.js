import { SCENARIOS, OUTCOME_SCORES } from '../data/scenarios.js';

window._gameData = { OUTCOME_SCORES };

const TILE = 32;

export class InteractionManager {
  constructor(scene, scoreManager, dialogueBox) {
    this.scene        = scene;
    this.scoreManager = scoreManager;
    this.dialogueBox  = dialogueBox;
    this.interactables = [];
    this.completedIds  = new Set();
    this.onAllComplete = null;
    this._totalForRoom = 0;

    this.eKey    = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  register(sprite, scenarioId) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    this.interactables.push({ sprite, scenario });
    this._totalForRoom++;
  }

  update(playerSprite) {
    if (this.dialogueBox.isVisible()) return;

    for (const item of this.interactables) {
      if (this.completedIds.has(item.scenario.id)) continue;

      const dist = Phaser.Math.Distance.Between(
        playerSprite.x, playerSprite.y,
        item.sprite.x,  item.sprite.y
      );

      if (dist < TILE * 2.2) {
        if (!item._hint) {
          item._hint = this.scene.add.text(
            item.sprite.x, item.sprite.y - TILE - 8,
            '[E] Interact', {
              fontSize: '11px', fontFamily: 'Courier New', color: '#ffffff',
              backgroundColor: '#002233cc', padding: { x: 6, y: 3 },
            }
          ).setOrigin(0.5).setDepth(20);
          this.scene._roomCleanup.push(item._hint);
          this.scene.tweens.add({
            targets: item._hint, y: item._hint.y - 6,
            duration: 400, yoyo: true, repeat: -1,
          });
        }

        if (Phaser.Input.Keyboard.JustDown(this.eKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          this._trigger(item);
        }
      } else {
        if (item._hint) { item._hint.destroy(); item._hint = null; }
      }
    }
  }

  _trigger(item) {
    if (item._hint) { item._hint.destroy(); item._hint = null; }
    this.dialogueBox.show(item.scenario, this.scoreManager, () => {
      this.completedIds.add(item.scenario.id);
      item.sprite.setAlpha(0.25);

      if (this._totalForRoom > 0 &&
          this.completedIds.size >= this._totalForRoom &&
          this.onAllComplete) {
        this.scene.time.delayedCall(800, this.onAllComplete);
      }
    });
  }

  getCompletedCount() { return this.completedIds.size; }

  destroy() {
    this.interactables.forEach(item => {
      if (item._hint) item._hint.destroy();
    });
    this.interactables = [];
  }
}
