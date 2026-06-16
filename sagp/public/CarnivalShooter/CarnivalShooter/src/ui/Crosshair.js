// =============================================================================
// Crosshair — scope overlay that follows the mouse cursor during gameplay.
//
// Cursor policy:
//   • Constructor does NOT hide the system cursor.
//   • show() hides the cursor and displays the crosshair.
//   • hide() restores the cursor and hides the crosshair.
//   • This keeps menus and non-gameplay screens fully accessible.
// =============================================================================
export class Crosshair {
    constructor(scene) {
        this.scene    = scene;
        this._visible = false;
        this._build();
        scene.input.on('pointermove', p => this.move(p.x, p.y));
        // Cursor is NOT hidden here — call show() when gameplay begins.
    }

    _build() {
        const s = this.scene;
        this._container = s.add.container(640, 360)
            .setDepth(300).setScrollFactor(0).setVisible(false);

        const g = s.add.graphics();
        this._g = g;
        this._drawScope(g, 0xC8941A, 1.0);   // brass to match target palette
        this._container.add(g);

        // Subtle lens overlay
        this._lens = s.add.graphics();
        this._lens.fillStyle(0xC8941A, 0.04);
        this._lens.fillCircle(0, 0, 44);
        this._container.add(this._lens);

        // Centre dot
        this._dot = s.add.graphics();
        this._dot.fillStyle(0xff4444, 1);
        this._dot.fillCircle(0, 0, 2.5);
        this._container.add(this._dot);
    }

    _drawScope(g, color, alpha) {
        g.clear();

        // Outer scope ring
        g.lineStyle(2, color, alpha * 0.9);
        g.strokeCircle(0, 0, 44);

        // Inner rings
        g.lineStyle(1, color, alpha * 0.5);
        g.strokeCircle(0, 0, 30);
        g.strokeCircle(0, 0, 12);

        // Cross hairs with centre gap
        const gap = 10, len = 28;
        g.lineStyle(1.5, color, alpha);
        g.beginPath();
        g.moveTo(-len - gap, 0); g.lineTo(-gap, 0);
        g.moveTo( gap,       0); g.lineTo( len + gap, 0);
        g.moveTo(0, -len - gap); g.lineTo(0, -gap);
        g.moveTo(0,  gap);       g.lineTo(0,  len + gap);
        g.strokePath();

        // Corner range-finder brackets
        const bO = 36;
        g.lineStyle(1, color, alpha * 0.7);
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
            g.beginPath();
            g.moveTo(sx * (bO - 5), sy * bO - sy * 4);
            g.lineTo(sx * (bO - 5), sy * bO + sy * 4);
            g.strokePath();
        });

        // Mil-dot indicators
        g.fillStyle(color, alpha * 0.8);
        [[-20,0],[20,0],[0,-20],[0,20]].forEach(([dx, dy]) => g.fillCircle(dx, dy, 1.5));

        // Glass glint
        g.lineStyle(1, 0xffffff, alpha * 0.2);
        g.beginPath(); g.arc(0, 0, 42, -2.4, -1.8); g.strokePath();
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    /** Show crosshair and hide the system cursor. Call on gameplay start. */
    show() {
        if (this._visible) return;
        this._visible = true;
        this._container.setVisible(true);
        // Hide via CSS — works even if pointer lock is unavailable.
        document.body.style.cursor = 'none';
        try { this.scene.input.setDefaultCursor('none'); } catch (e) {}
    }

    /** Hide crosshair and restore the system cursor. Call on pause / game over. */
    hide() {
        if (!this._visible) return;
        this._visible = false;
        this._container.setVisible(false);
        document.body.style.cursor = 'default';
        try { this.scene.input.setDefaultCursor('default'); } catch (e) {}
    }

    move(x, y) {
        if (this._container) {
            this._container.x = x;
            this._container.y = y;
        }
    }

    // ── VISUAL STATES ─────────────────────────────────────────────────────────

    /** Brief flash on shot fired */
    shootFX() {
        this._g.clear();
        this._drawScope(this._g, 0xff8800, 1);
        this.scene.time.delayedCall(80, () => {
            if (this._g && this._g.active) {
                this._g.clear();
                this._drawScope(this._g, 0xC8941A, 1);
            }
        });

        // Recoil tween
        const orig = { x: this._container.x, y: this._container.y };
        this.scene.tweens.add({
            targets: this._container,
            y: orig.y - 8, duration: 60,
            yoyo: true, ease: 'Power2',
        });
    }

    /** Reload state — scope turns orange */
    setReloading(v) {
        this._g.clear();
        this._drawScope(this._g, v ? 0xff8800 : 0xC8941A, 1);
        this._dot.clear();
        this._dot.fillStyle(v ? 0xff8800 : 0xff4444, 1);
        this._dot.fillCircle(0, 0, 2.5);
    }

    /** Focus mode — scope expands, turns purple */
    setFocus(v) {
        this._g.clear();
        this._drawScope(this._g, v ? 0xff00ff : 0xC8941A, 1);
        this.scene.tweens.add({
            targets: this._container,
            scaleX: v ? 1.3 : 1, scaleY: v ? 1.3 : 1,
            duration: 300, ease: 'Power2',
        });
    }

    destroy() {
        this.hide();  // always restore cursor on destroy
        this._container?.destroy();
    }
}
