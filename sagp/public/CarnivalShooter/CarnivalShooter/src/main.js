// =============================================================================
// CYBER CARNIVAL: THREAT HUNT — Main Entry Point
// SAGP (Security Awareness Gamification Platform)
// =============================================================================
import { PreloadScene }  from './scenes/PreloadScene.js';
import { MenuScene }     from './scenes/MenuScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
    type:            Phaser.AUTO,
    title:           'Cyber Carnival: Threat Hunt',
    description:     'SAGP — Security Awareness Gamification Platform',
    parent:          'game-container',
    width:           1280,
    height:          720,
    backgroundColor: '#050510',
    pixelArt:        false,
    scene:           [PreloadScene, MenuScene, GameScene, GameOverScene],
    scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
        disableWebAudio: false,
    },
    render: {
        antialias:      true,
        antialiasGL:    true,
        roundPixels:    false,
    },
};

// Wait for DOM
window.addEventListener('DOMContentLoaded', () => {
    const game = new Phaser.Game(config);

    // Hide HTML loading screen once game is booted
    game.events.once('ready', () => {
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.style.transition = 'opacity 0.5s';
            ls.style.opacity    = '0';
            setTimeout(() => ls.remove(), 600);
        }
    });

    // Expose for debugging
    window.game = game;
});
