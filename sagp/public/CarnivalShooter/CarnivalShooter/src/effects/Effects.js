// =============================================================================
// Effects — particles, screen flash, floating text, neon sparks
// Performance-safe: all effect types are capped to prevent unbounded growth.
// =============================================================================
import { COLORS } from '../config.js';

// Hard ceilings to prevent effect accumulation
const MAX_FLOAT_TEXTS = 8;
const MAX_EMITTERS    = 6;
const MAX_RINGS       = 5;
const MAX_BANNERS     = 2;

export class Effects {
    constructor(scene) {
        this.scene = scene;

        // Concurrency counters
        this._activeTexts    = 0;
        this._activeEmitters = 0;
        this._activeRings    = 0;
        this._activeBanners  = 0;

        // Reusable flash overlay — one rectangle, retweened each time
        this._flashRect = scene.add.rectangle(640, 360, 1280, 720, 0xff0000, 0)
            .setDepth(200).setScrollFactor(0).setAlpha(0);
        this._flashTween = null;

        // Persistent vignette graphics (created once, cleared/drawn as needed)
        this._focusVignette = scene.add.graphics().setDepth(155).setScrollFactor(0);
    }

    // ── SCREEN FLASH ─────────────────────────────────────────────────────────
    // Reuses a single rectangle — no per-flash allocation.
    flash(color = 0xff0000, alpha = 0.35, duration = 180) {
        if (this._flashTween) {
            this._flashTween.stop();
            this._flashTween = null;
        }
        this._flashRect.setFillStyle(color, alpha).setAlpha(1);
        this._flashTween = this.scene.tweens.add({
            targets: this._flashRect, alpha: 0, duration,
            ease: 'Linear',
            onComplete: () => { this._flashTween = null; },
        });
    }

    flashGreen()  { this.flash(0x00ff66, 0.25, 200); }
    flashRed()    { this.flash(0xff0000, 0.40, 200); }
    flashWhite()  { this.flash(0xffffff, 0.30, 150); }
    flashPurple() { this.flash(0xff00ff, 0.35, 250); }

    // ── FLOATING SCORE TEXT ──────────────────────────────────────────────────
    // Capped at MAX_FLOAT_TEXTS; excess calls are silently dropped.
    floatText(x, y, text, color = '#ffffff', size = 28) {
        if (this._activeTexts >= MAX_FLOAT_TEXTS) return null;
        this._activeTexts++;

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
            onComplete: () => {
                if (t.active) t.destroy();
                this._activeTexts = Math.max(0, this._activeTexts - 1);
            },
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

    headshot(x, y) {
        this.floatText(x, y, '💥 HEADSHOT!', '#ff00ff', 36);
        this.flashPurple();
    }

    // ── PARTICLE BURST ────────────────────────────────────────────────────────
    // Capped at MAX_EMITTERS; excess calls are dropped.
    burst(x, y, color = 0xffff00, count = 20) {
        if (this._activeEmitters >= MAX_EMITTERS) return;
        this._activeEmitters++;

        const s = this.scene;
        const emitter = s.add.particles(x, y, 'particle_dot', {
            speed:    { min: 60, max: 260 },
            angle:    { min: 0, max: 360 },
            scale:    { start: 1.2, end: 0 },
            lifespan: 600,
            quantity: Math.min(count, 25),   // hard cap per burst
            tint:     color,
            depth:    170,
        });
        s.time.delayedCall(700, () => {
            if (emitter && emitter.active) emitter.destroy();
            this._activeEmitters = Math.max(0, this._activeEmitters - 1);
        });
    }

    burstBad(x, y)  { this.burst(x, y, 0xC8941A, 20); }   // brass — not red
    burstGood(x, y) { this.burst(x, y, 0xC8941A, 20); }   // same brass for friendly-fire

    // ── SPARKS ────────────────────────────────────────────────────────────────
    sparks(x, y, color = 0xC8941A) {
        if (this._activeEmitters >= MAX_EMITTERS) return;
        this._activeEmitters++;

        const s = this.scene;
        const emitter = s.add.particles(x, y, 'particle_spark', {
            speed:    { min: 80, max: 350 },
            angle:    { min: 0, max: 360 },
            rotate:   { min: 0, max: 360 },
            scale:    { start: 1, end: 0 },
            lifespan: 400,
            quantity: 12,
            tint:     color,
            depth:    171,
            gravityY: 400,
        });
        s.time.delayedCall(500, () => {
            if (emitter && emitter.active) emitter.destroy();
            this._activeEmitters = Math.max(0, this._activeEmitters - 1);
        });
    }

    // ── NEON RING ─────────────────────────────────────────────────────────────
    // Tween-driven instead of per-ring timer — far cheaper.
    // Capped at MAX_RINGS.
    ring(x, y, color = 0xff00ff) {
        if (this._activeRings >= MAX_RINGS) return;
        this._activeRings++;

        const s = this.scene;
        const g = s.add.graphics().setDepth(169);

        // Animate radius and alpha via a plain object tween
        const state = { r: 10, a: 0.9 };
        s.tweens.add({
            targets: state,
            r: 160, a: 0,
            duration: 450,
            ease: 'Linear',
            onUpdate: () => {
                if (!g.active) return;
                g.clear();
                g.lineStyle(3, color, Math.max(0, state.a));
                g.strokeCircle(x, y, state.r);
            },
            onComplete: () => {
                if (g.active) g.destroy();
                this._activeRings = Math.max(0, this._activeRings - 1);
            },
        });
    }

    // ── FOCUS MODE VFX ────────────────────────────────────────────────────────
    focusModeStart() {
        this.flashPurple();
        const v = this._focusVignette;
        v.clear();
        v.lineStyle(80, 0x2200aa, 0.6);
        v.strokeRect(40, 40, 1200, 640);
        v.lineStyle(50, 0x4400cc, 0.4);
        v.strokeRect(20, 20, 1240, 680);
        v.setAlpha(0.7);
    }

    focusModeEnd() {
        this._focusVignette.clear();
    }

    // ── SCREEN SHAKE ─────────────────────────────────────────────────────────
    screenShake(intensity = 8, duration = 300) {
        this.scene.cameras.main.shake(duration, intensity / 1000);
    }

    // ── ANNOUNCEMENT BANNER ──────────────────────────────────────────────────
    // Capped at MAX_BANNERS to prevent stacking.
    announce(text, color = '#ff00ff', subText = '') {
        if (this._activeBanners >= MAX_BANNERS) return;
        this._activeBanners++;

        const s = this.scene;
        const banner = s.add.container(640, 360).setDepth(190).setScrollFactor(0);

        const bg = s.add.rectangle(0, 0, 700, 100, 0x000000, 0.75);
        const border = s.add.graphics();
        const hexCol = Phaser.Display.Color.HexStringToColor(color).color;
        border.lineStyle(3, hexCol, 1);
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
            onComplete: () => {
                if (banner.active) banner.destroy();
                this._activeBanners = Math.max(0, this._activeBanners - 1);
            },
        });
    }

    // ── CLEANUP ───────────────────────────────────────────────────────────────
    // Called by GameScene on shutdown to reset counters.
    reset() {
        this._activeTexts    = 0;
        this._activeEmitters = 0;
        this._activeRings    = 0;
        this._activeBanners  = 0;
    }
}
