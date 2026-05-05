// ============================================================
//  src/main.js  –  Security Awareness Training Game
//  Entry point: configures Phaser and boots the scene stack
// ============================================================

import Start        from './scenes/Start.js';
import GameScene    from './scenes/GameScene.js';
import InboxScene   from './scenes/InboxScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type:   Phaser.AUTO,

  width:  960,
  height: 540,

  backgroundColor: '#9dc8f0',

  parent: 'game-container',

  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // ── DOM element support (needed for name-entry form) ──────
  dom: {
    createContainer: true,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug:   false,
    },
  },

  // Scene order: Start boots first, then InboxScene is the game,
  // GameScene is kept for future platformer use.
  scene: [Start, GameScene, InboxScene, GameOverScene],

  render: {
    pixelArt:    true,
    antialias:   false,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);

export default game;
