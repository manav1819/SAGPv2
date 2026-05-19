import { ROOMS, ROOM_ORDER } from '../data/rooms.js';
import { SCENARIOS } from '../data/scenarios.js';
import { Player }              from '../objects/Player.js';
import { EnvironmentBuilder }  from '../systems/EnvironmentBuilder.js';
import { DoorSystem }          from '../systems/DoorSystem.js';
import { NPCManager }          from '../systems/NPCManager.js';
import { InteractionManager }  from '../systems/InteractionManager.js';
import { ScoreManager }        from '../systems/ScoreManager.js';
import { DialogueBox }         from '../ui/DialogueBox.js';
import { HUD }                 from '../ui/HUD.js';

const TILE = 32;
const TOTAL_SCENARIOS = SCENARIOS.length; // 5

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(data) {
    this.state = {
      currentRoomId:      data.roomId      || 'lobby',
      fromRoom:           data.fromRoom    || null,
      completedRooms:     new Set(data.completedRooms     || []),
      completedScenarios: new Set(data.completedScenarios || []),
      securityScore:      data.securityScore ?? 100,
      riskScore:          data.riskScore    ?? 0,
    };
    this._transitioning = false;
    this._roomCleanup   = [];   // all room-scoped objects pushed here
  }

  create() {
    // Persistent systems (survive room changes)
    this.scoreManager = new ScoreManager();
    this.scoreManager.securityScore = this.state.securityScore;
    this.scoreManager.riskScore     = this.state.riskScore;

    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, this.scoreManager, this.state.currentRoomId);

    // Player (repositioned on room change, not recreated)
    this.player = null;

    this.cameras.main.setBackgroundColor('#060c12');
    this.cameras.main.fadeIn(600);

    this._loadRoom(this.state.currentRoomId);
  }

  update(time, delta) {
    if (this._transitioning) return;

    const locked = this.dialogueBox.isVisible();
    if (this.player)            this.player.update(locked);
    if (this.interactionMgr)    this.interactionMgr.update(this.player.sprite);
    if (this.doorSystem)        this.doorSystem.update(this.player.sprite);
    if (this.npcManager)        this.npcManager.update(delta);

    this.hud.update(
      this.state.completedScenarios.size,
      TOTAL_SCENARIOS,
      this.state.completedRooms,
      this.state.currentRoomId
    );
  }

  // ── Room Loading ───────────────────────────────────────────────────────────

  _loadRoom(roomId) {
    const cfg = ROOMS[roomId];
    if (!cfg) { console.error('Unknown room:', roomId); return; }

    this.state.currentRoomId = roomId;

    // 1 ── Clean up previous room objects
    this._clearRoom();

    // 2 ── Physics world bounds
    this.physics.world.setBounds(0, 0, cfg.cols * TILE, cfg.rows * TILE);

    // 3 ── Build environment
    const env = new EnvironmentBuilder(this, cfg);
    env.buildFloor();
    this.wallGroup = env.buildWalls();
    env.buildFurniture();

    // 4 ── Interactables (only unfinished scenarios for this room)
    const pendingScenarios = cfg.scenarios.filter(
      id => !this.state.completedScenarios.has(id)
    );

    this.interactionMgr = new InteractionManager(this, this.scoreManager, this.dialogueBox);
    env.buildInteractables(pendingScenarios, (sprite, sid) => {
      this.interactionMgr.register(sprite, sid);
    });

    this.interactionMgr.onAllComplete = () => {
      this._onRoomComplete(roomId);
    };

    // If all scenarios for this room were already done, mark complete now
    const allDone = cfg.scenarios.every(id => this.state.completedScenarios.has(id));
    if (allDone && cfg.scenarios.length > 0) {
      this._onRoomComplete(roomId, true); // silent
    }

    // 5 ── NPCs
    this.npcManager = new NPCManager(this, cfg);

    // 6 ── Door system
    this.doorSystem = new DoorSystem(this, cfg, this.state, (toRoom, fromRoom) => {
      this._transitionToRoom(toRoom, fromRoom);
    });

    // 7 ── Player — create or reposition
    const spawn = this._calcSpawn(cfg);
    if (!this.player) {
      this.player = new Player(this, spawn.x, spawn.y);
    } else {
      this.player.setPosition(spawn.x, spawn.y);
    }
    this.player.sprite.setDepth(10);

    // Physics colliders
    this.physics.add.collider(this.player.sprite, this.wallGroup);

    // 8 ── Camera
    this.cameras.main.setBounds(0, 0, cfg.cols * TILE, cfg.rows * TILE);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 9 ── HUD room name
    this.hud.setRoom(cfg.name, cfg.subtitle);
    this.hud.highlightRoom(roomId, 'current');

    // 10 ── Finale handling
    if (cfg.isFinale) {
      this.time.delayedCall(1200, () => this._triggerFinale());
    }
  }

  _calcSpawn(cfg) {
    const { fromRoom, currentRoomId } = this.state;
    if (!fromRoom) {
      return {
        x: cfg.defaultSpawn.col * TILE + TILE / 2,
        y: cfg.defaultSpawn.row * TILE + TILE / 2,
      };
    }
    // Spawn near the door that leads back to the previous room
    const backDoor = cfg.doors.find(d => d.toRoom === fromRoom);
    if (backDoor) {
      // Offset inward from the door
      const offsets = { north: [0, 2], south: [0, -2], east: [-2, 0], west: [2, 0] };
      const [dc, dr] = offsets[backDoor.facing] || [0, 0];
      return {
        x: (backDoor.col + dc) * TILE + TILE / 2,
        y: (backDoor.row + dr) * TILE + TILE / 2,
      };
    }
    return {
      x: cfg.defaultSpawn.col * TILE + TILE / 2,
      y: cfg.defaultSpawn.row * TILE + TILE / 2,
    };
  }

  // ── Room Completion ────────────────────────────────────────────────────────

  _onRoomComplete(roomId, silent = false) {
    this.state.completedRooms.add(roomId);

    // Merge any locally-completed scenarios into global state
    this.interactionMgr?.completedIds.forEach(id => {
      this.state.completedScenarios.add(id);
    });

    // Sync score from ScoreManager back into state
    this.state.securityScore = this.scoreManager.securityScore;
    this.state.riskScore     = this.scoreManager.riskScore;

    // Unlock next door visually
    this.doorSystem?.unlockNextDoor();

    if (!silent) {
      const cfg = ROOMS[roomId];
      this.hud.showRoomComplete(cfg?.completionMsg || '✅ Room cleared!');
      this.hud.highlightRoom(roomId, 'visited');
    }
  }

  // ── Room Transition ────────────────────────────────────────────────────────

  _transitionToRoom(toRoomId, fromRoomId) {
    if (this._transitioning) return;
    this._transitioning = true;

    // Freeze player
    if (this.player) this.player.sprite.setVelocity(0, 0);

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      // Sync state
      this.interactionMgr?.completedIds.forEach(id => {
        this.state.completedScenarios.add(id);
      });
      this.state.securityScore = this.scoreManager.securityScore;
      this.state.riskScore     = this.scoreManager.riskScore;
      this.state.fromRoom      = fromRoomId;

      this._loadRoom(toRoomId);
      this._transitioning = false;

      this.cameras.main.fadeIn(400, 0, 0, 0);
    });
  }

  // ── Clear Room ─────────────────────────────────────────────────────────────

  _clearRoom() {
    // Destroy all room-scoped objects
    for (const obj of this._roomCleanup) {
      try {
        if (obj && typeof obj.destroy === 'function') obj.destroy(true);
      } catch (_) {}
    }
    this._roomCleanup = [];

    // Dispose systems
    this.interactionMgr?.destroy(); this.interactionMgr = null;
    this.doorSystem?.destroy();     this.doorSystem = null;
    this.npcManager?.destroy();     this.npcManager = null;

    // Wall group: destroy its children and remove from scene
    if (this.wallGroup) {
      this.wallGroup.destroy(true);
      this.wallGroup = null;
    }

    // Remove all physics colliders
    this.physics.world.colliders.destroy();
  }

  // ── Finale ─────────────────────────────────────────────────────────────────

  _triggerFinale() {
    const cam = this.cameras.main;
    cam.fadeOut(800, 0, 20, 10);
    this.time.delayedCall(900, () => {
      this.scene.start('ResultScene', {
        securityScore: this.scoreManager.securityScore,
        riskScore:     this.scoreManager.riskScore,
        completed:     [...this.state.completedScenarios].map(id => ({
          scenarioId: id,
          outcome:    this.scoreManager.completed.find(c => c.scenarioId === id)?.outcome || 'neutral',
        })),
      });
    });
  }
}
