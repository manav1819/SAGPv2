// =============================================================================
// Crosshair — scope overlay that follows mouse cursor
// =============================================================================
export class Crosshair {
    constructor(scene) {
        this.scene  = scene;
        this._build();
        scene.input.on('pointermove', p => this.move(p.x, p.y));
        scene.input.setDefaultCursor('none');
    }

    _build() {
        const s = this.scene;
        this._container = s.add.container(640, 360).setDepth(300).setScrollFactor(0);

        const g = s.add.graphics();
        this._g = g;
        this._drawScope(g, 0x00ff88, 1.0);
        this._container.add(g);

        // Lens tint overlay (subtle)
        this._lens = s.add.graphics();
        this._lens.fillStyle(0x00ffaa, 0.03);
        this._lens.fillCircle(0, 0, 44);
        this._container.add(this._lens);

        // Center dot
        this._dot = s.add.graphics();
        this._dot.fillStyle(0xff0000, 1);
        this._dot.fillCircle(0, 0, 2.5);
        this._container.add(this._dot);

        // Muzzle flash (hidden by default)
        this._muzzle = s.add.graphics();
        this._container.add(this._muzzle);
        this._muzzleAlpha = 0;
    }

    _drawScope(g, color, alpha) {
        g.clear();

        // Outer scope circle
        g.lineStyle(2, color, alpha * 0.9);
        g.strokeCircle(0, 0, 44);

        // Inner circle
        g.lineStyle(1, color, alpha * 0.5);
        g.strokeCircle(0, 0, 30);
        g.strokeCircle(0, 0, 12);

        // Cross hairs — gaps in center
        const gap = 10, len = 28;
        g.lineStyle(1.5, color, alpha);
        g.beginPath();
        g.moveTo(-len - gap, 0); g.lineTo(-gap, 0);
        g.moveTo( gap, 0);       g.lineTo( len + gap, 0);
        g.moveTo(0, -len - gap); g.lineTo(0, -gap);
        g.moveTo(0,  gap);       g.lineTo(0,  len + gap);
        g.strokePath();

        // Corner range-finder brackets
        const bL = 12, bO = 36;
        g.lineStyle(1, color, alpha * 0.7);
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy]) => {
            g.beginPath();
            g.moveTo(sx * bO, sy * bO);
            g.lineTo(sx * bO + sx * bL * 0, sy * bO);
            g.moveTo(sx * bO, sy * bO);
            g.lineTo(sx * bO, sy * bO + sy * bL * 0);
            // mini tick marks
            g.moveTo(sx * (bO - 5), sy * bO - sy * 4);
            g.lineTo(sx * (bO - 5), sy * bO + sy * 4);
            g.strokePath();
        });

        // Mil-dot indicators
        const dots = [[-20, 0],[20, 0],[0, -20],[0, 20]];
        g.fillStyle(color, alpha * 0.8);
        dots.forEach(([dx, dy]) => g.fillCircle(dx, dy, 1.5));

        // Scope glass glint
        g.lineStyle(1, 0xffffff, alpha * 0.2);
        g.beginPath(); g.arc(0, 0, 42, -2.4, -1.8); g.strokePath();
    }

    move(x, y) {
        if (this._container) {
            this._container.x = x;
            this._container.y = y;
        }
    }

    // Call this on every shot fired
    shootFX() {
        // Brief red flash on crosshair
        this._g.clear();
        this._drawScope(this._g, 0xff4444, 1);
        this.scene.time.delayedCall(80, () => {
            if (this._g) {
                this._g.clear();
                this._drawScope(this._g, 0x00ff88, 1);
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

    // Reload state — crosshair turns orange
    setReloading(v) {
        this._g.clear();
        this._drawScope(this._g, v ? 0xff8800 : 0x00ff88, 1);
        this._dot.clear();
        this._dot.fillStyle(v ? 0xff8800 : 0xff0000, 1);
        this._dot.fillCircle(0, 0, 2.5);
    }

    // Focus mode — crosshair turns purple + expands
    setFocus(v) {
        this._g.clear();
        this._drawScope(this._g, v ? 0xff00ff : 0x00ff88, 1);
        this.scene.tweens.add({
            targets: this._container,
            scaleX: v ? 1.3 : 1, scaleY: v ? 1.3 : 1,
            duration: 300, ease: 'Power2',
        });
    }

    destroy() {
        this._container?.destroy();
    }
}
