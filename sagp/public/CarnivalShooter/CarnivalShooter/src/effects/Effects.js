// =============================================================================
// Effects — particles, screen flash, floating text, neon sparks
// =============================================================================
import { COLORS } from '../config.js';

export class Effects {
    constructor(scene) {
        this.scene = scene;
        this._floatingTexts = [];
    }

    // ── SCREEN FLASH ─────────────────────────────────────────────────────────
    flash(color = 0xff0000, alpha = 0.35, duration = 180) {
        const s = this.scene;
        const rect = s.add.rectangle(640, 360, 1280, 720, color, alpha)
            .setDepth(200).setScrollFactor(0);
        s.tweens.add({
            targets: rect, alpha: 0, duration,
            onComplete: () => rect.destroy(),
        });
    }

    flashGreen()  { this.flash(0x00ff66, 0.25, 200); }
    flashRed()    { this.flash(0xff0000, 0.40, 200); }
    flashWhite()  { this.flash(0xffffff, 0.30, 150); }
    flashPurple() { this.flash(0xff00ff, 0.35, 250); }

    // ── FLOATING SCORE TEXT ──────────────────────────────────────────────────
    floatText(x, y, text, color = '#ffffff', size = 28) {
        const s = this.scene;
        const t = s.add.text(x, y, text, {
            fontFamily: '"Courier New", monospace',
            fontSize:   `${size}px`,
            color,
            stroke:      '#000000',
            strokeThickness: 3,
            shadow: { blur: 8, color, fill: true },
        }).setOrigin(0.5).setDepth(180).setScrollFactor(0);

        s.tweens.add({
            targets: t, y: y - 80, alpha: 0, duration: 1200,
            ease: 'Power2',
            onComplete: () => t.destroy(),
        });
        return t;
    }

    scorePopup(x, y, points, combo) {
        const sign  = points >= 0 ? '+' : '';
        const color = points >= 0 ? '#ffff00' : '#ff4444';
        const text  = combo > 1
            ? `${sign}${points}\n×${combo} COMBO!`
            : `${sign}${points}`;
        this.floatText(x, y, text, color, combo > 4 ? 34 : 26);
    }

    comboText(x, y, combo) {
        const colors = ['#ffffff','#ffff00','#ff8800','#ff4400','#ff00ff','#00ffff'];
        const c = colors[Math.min(combo - 1, colors.length - 1)];
        this.floatText(x, y - 40, `×${combo} COMBO!`, c, 32);
    }

    friendlyFire(x, y) {
        this.floatText(x, y, '⚠ FRIENDLY FIRE!', '#ff4444', 30);
        this.flashRed();
    }

    threatNeutralised(x, y) {
        this.floatText(x, y, '✓ THREAT NEUTRALISED', '#00ff88', 22);
    }

    headshot(x, y) {
        this.floatText(x, y, '💥 HEADSHOT!', '#ff00ff', 36);
        this.flashPurple();
    }

    // ── PARTICLE BURST ────────────────────────────────────────────────────────
    burst(x, y, color = 0xffff00, count = 20) {
        const s = this.scene;
        if (!s.textures.exists('particle_dot')) {
            const g = s.make.graphics({ add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('particle_dot', 8, 8);
            g.destroy();
        }
        const emitter = s.add.particles(x, y, 'particle_dot', {
            speed:    { min: 60, max: 260 },
            angle:    { min: 0, max: 360 },
            scale:    { start: 1.2, end: 0 },
            lifespan: 600,
            quantity: count,
            tint:     color,
            depth:    170,
        });
        s.time.delayedCall(700, () => emitter.destroy());
    }

    burstBad(x, y)  { this.burst(x, y, 0xff3333, 25); }
    burstGood(x, y) { this.burst(x, y, 0xff0000, 30); }    // penalty burst

    // ── SPARKS ────────────────────────────────────────────────────────────────
    sparks(x, y, color = 0xffaa00) {
        const s = this.scene;
        if (!s.textures.exists('particle_spark')) {
            const g = s.make.graphics({ add: false });
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 3, 8);
            g.generateTexture('particle_spark', 3, 8);
            g.destroy();
        }
        const emitter = s.add.particles(x, y, 'particle_spark', {
            speed:    { min: 80, max: 350 },
            angle:    { min: 0, max: 360 },
            rotate:   { min: 0, max: 360 },
            scale:    { start: 1, end: 0 },
            lifespan: 400,
            quantity: 15,
            tint:     color,
            depth:    171,
            gravityY: 400,
        });
        s.time.delayedCall(500, () => emitter.destroy());
    }

    // ── NEON RING ─────────────────────────────────────────────────────────────
    ring(x, y, color = 0xff00ff) {
        const s = this.scene;
        const g = s.add.graphics().setDepth(169).setScrollFactor(0);
        let radius = 10;
        let alpha   = 1;
        const timer = s.time.addEvent({
            delay: 16, repeat: 25,
            callback: () => {
                g.clear();
                g.lineStyle(3, color, alpha);
                g.strokeCircle(x, y, radius);
                radius += 6;
                alpha  -= 0.04;
            },
        });
        s.time.delayedCall(500, () => { g.destroy(); timer.remove(); });
    }

    // ── FOCUS MODE VFX ────────────────────────────────────────────────────────
    focusModeStart() {
        this.flashPurple();
        const s = this.scene;
        // Vignette-like darkening at edges
        if (!s._focusVignette) {
            s._focusVignette = s.add.graphics().setDepth(155).setScrollFactor(0);
        }
        const v = s._focusVignette;
        v.clear();
        v.lineStyle(80, 0x2200aa, 0.6);
        v.strokeRect(40, 40, 1200, 640);
        v.lineStyle(50, 0x4400cc, 0.4);
        v.strokeRect(20, 20, 1240, 680);
        s.tweens.add({ targets: v, alpha: 0.7, duration: 400, yoyo: true, hold: 4000, onComplete: () => v.clear() });
    }

    focusModeEnd() {
        if (this.scene._focusVignette) this.scene._focusVignette.clear();
    }

    // ── BOSS HIT SHAKE ────────────────────────────────────────────────────────
    screenShake(intensity = 8, duration = 300) {
        this.scene.cameras.main.shake(duration, intensity / 1000);
    }

    // ── ANNOUNCEMENT BANNER ──────────────────────────────────────────────────
    announce(text, color = '#ff00ff', subText = '') {
        const s = this.scene;
        const banner = s.add.container(640, 360).setDepth(190).setScrollFactor(0);

        const bg = s.add.rectangle(0, 0, 700, 100, 0x000000, 0.75);
        const border = s.add.graphics();
        border.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 1);
        border.strokeRect(-350, -50, 700, 100);

        const main = s.add.text(0, -10, text, {
            fontFamily: '"Courier New", monospace',
            fontSize: '40px', fontStyle: 'bold',
            color, stroke: '#000', strokeThickness: 4,
            shadow: { blur: 20, color, fill: true },
        }).setOrigin(0.5);

        const sub = s.add.text(0, 30, subText, {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px', color: '#cccccc',
        }).setOrigin(0.5);

        banner.add([bg, border, main, sub]);
        banner.setScale(0.3).setAlpha(0);
        s.tweens.add({
            targets: banner, scale: 1, alpha: 1,
            duration: 250, ease: 'Back.Out',
        });
        s.tweens.add({
            targets: banner, alpha: 0, scale: 0.8,
            delay: 1800, duration: 400,
            onComplete: () => banner.destroy(),
        });
    }
}
