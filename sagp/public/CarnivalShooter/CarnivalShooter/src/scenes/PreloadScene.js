// =============================================================================
// PreloadScene — loads all assets and shows a themed loading bar
// =============================================================================
import { AudioManager } from '../audio/AudioManager.js';

export class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }

    preload() {
        const W = 1280, H = 720;

        // ── Loading UI ────────────────────────────────────────────────────────
        const bg = this.add.rectangle(W/2, H/2, W, H, 0x050510);

        // Animated carnival lights strip
        const lights = this.add.graphics();
        this._lightTimer = 0;
        const drawLights = () => {
            lights.clear();
            for (let i = 0; i < 40; i++) {
                const x   = i * 32 + 16;
                const col = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00][i % 4];
                const on  = Math.sin(Date.now() / 200 + i) > 0;
                lights.fillStyle(col, on ? 1 : 0.15);
                lights.fillCircle(x, 30, 8);
                lights.fillStyle(col, on ? 0.3 : 0.05);
                lights.fillCircle(x, 30, 14);
            }
        };
        this.time.addEvent({ delay: 80, repeat: -1, callback: drawLights });

        this.add.text(W/2, 200, '⚡ CYBER CARNIVAL ⚡', {
            fontFamily: '"Courier New", monospace',
            fontSize: '52px', fontStyle: 'bold', color: '#ff00ff',
            stroke: '#000', strokeThickness: 5,
            shadow: { blur: 30, color: '#ff00ff', fill: true },
        }).setOrigin(0.5);

        this.add.text(W/2, 265, 'THREAT HUNT', {
            fontFamily: '"Courier New", monospace',
            fontSize: '28px', color: '#00ffff',
            shadow: { blur: 15, color: '#00ffff', fill: true },
        }).setOrigin(0.5);

        // progress bar
        const barBg = this.add.rectangle(W/2, H/2 + 80, 500, 16, 0x1a0030).setStrokeStyle(1, 0x6600aa);
        const barFill = this.add.rectangle(W/2 - 250, H/2 + 80, 0, 14, 0xff00ff).setOrigin(0, 0.5);

        const statusTxt = this.add.text(W/2, H/2 + 108, 'INITIALISING THREAT DATABASE...', {
            fontFamily: '"Courier New", monospace',
            fontSize: '14px', color: '#aaaaaa',
        }).setOrigin(0.5);

        const messages = [
            'SCANNING FOR MALWARE...',
            'ARMING DART GUN...',
            'CALIBRATING SCOPE...',
            'DEPLOYING TARGETS...',
            'CARNIVAL READY.',
        ];

        this.load.on('progress', v => {
            barFill.width = 498 * v;
            statusTxt.setText(messages[Math.min(Math.floor(v * messages.length), messages.length - 1)]);
        });

        // ── Assets ────────────────────────────────────────────────────────────
        this.load.image('background',  'assets/background.png');
        this.load.image('foreground',  'assets/foreground.png');
        this.load.image('bullet_hole', 'assets/bullet_hole.png');
        this.load.image('crosshair_img','assets/crosshair.png');

        AudioManager.preloadAssets(this);
    }

    create() {
        // Generate particle textures
        this._genParticles();
        this.scene.start('MenuScene');
    }

    _genParticles() {
        // particle_dot
        const g1 = this.make.graphics({ add: false });
        g1.fillStyle(0xffffff, 1); g1.fillCircle(4, 4, 4);
        g1.generateTexture('particle_dot', 8, 8); g1.destroy();

        // particle_spark
        const g2 = this.make.graphics({ add: false });
        g2.fillStyle(0xffffff, 1); g2.fillRect(0, 0, 3, 8);
        g2.generateTexture('particle_spark', 3, 8); g2.destroy();

        // particle_star
        const g3 = this.make.graphics({ add: false });
        g3.fillStyle(0xffffff, 1);
        g3.fillTriangle(4, 0, 8, 8, 0, 8);
        g3.generateTexture('particle_star', 8, 8); g3.destroy();
    }
}
