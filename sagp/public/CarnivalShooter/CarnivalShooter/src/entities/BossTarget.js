// =============================================================================
// BossTarget — large multi-hit boss enemy
// Uses the unified carnival brass palette.
// Flinch tween is guarded so it cannot accumulate on rapid hits.
// =============================================================================
export class BossTarget extends Phaser.GameObjects.Container {
    constructor(scene, bossData) {
        const x = Math.random() < 0.5 ? -160 : 1440;
        super(scene, x, 200 + Math.random() * 300);
        this.bossData   = bossData;
        this.alive      = true;
        this.health     = bossData.health;
        this.maxHealth  = bossData.health;
        this.isGood     = false;
        this._time      = 0;
        this._velX      = x < 0 ? 120 : -120;
        this.W = bossData.size || 140;
        this.H = bossData.size || 140;
        this._hitFlash  = 0;
        this._flinching = false;   // prevent tween accumulation

        this._build();
        scene.add.existing(this);
        this.setDepth(90);
        this.setSize(this.W, this.H);
        this.setInteractive();

        // Dramatic entrance
        this.setAlpha(0).setScale(0.1);
        scene.tweens.add({
            targets: this, alpha: 1, scale: 1,
            duration: 500, ease: 'Back.Out',
        });
    }

    _build() {
        const { primaryColor, accentColor, label } = this.bossData;
        const W = this.W, H = this.H;
        const g = this.scene.add.graphics();

        // Pulsing glow rings (brass)
        [40, 30, 20, 10, 3].forEach((lw, i) => {
            g.lineStyle(lw, primaryColor, [0.05, 0.08, 0.15, 0.4, 1][i]);
            g.strokeCircle(0, 0, W * 0.52);
        });

        // Main hexagon body
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            pts.push({ x: Math.cos(a) * W * 0.48, y: Math.sin(a) * W * 0.48 });
        }
        g.fillStyle(0x0a0010, 1);
        g.fillPoints(pts, true);
        g.lineStyle(4, primaryColor, 1);
        g.strokePoints(pts, true);

        // Inner detail rings
        g.lineStyle(2, accentColor, 0.4);
        g.strokeCircle(0, 0, W * 0.3);
        g.lineStyle(1, accentColor, 0.2);
        g.strokeCircle(0, 0, W * 0.15);

        this._drawBossFace(g, primaryColor, accentColor);
        this.add(g);
        this._g = g;

        // BOSS label (amber, not red)
        const nameT = this.scene.add.text(0, H * 0.38, label, {
            fontFamily: '"Courier New", monospace',
            fontSize: '16px', fontStyle: 'bold',
            color: '#FFE082',
            stroke: '#000', strokeThickness: 3,
            shadow: { blur: 12, color: '#FFE082', fill: true },
        }).setOrigin(0.5);
        this.add(nameT);

        const subT = this.scene.add.text(0, H * 0.38 + 18, '[ BOSS ]', {
            fontFamily: '"Courier New", monospace',
            fontSize: '10px', color: '#C8941A',
        }).setOrigin(0.5);
        this.add(subT);

        // HP bar
        this._hpBg = this.scene.add.graphics();
        this._hpBg.fillStyle(0x3D2000, 1);
        this._hpBg.fillRect(-W/2 + 4, H/2 - 12, W - 8, 8);
        this.add(this._hpBg);

        this._hpBar = this.scene.add.graphics();
        this.add(this._hpBar);
        this._updateHP();
    }

    _drawBossFace(g, color, accent) {
        const id = this.bossData.id;
        g.lineStyle(3, color, 0.9);
        g.fillStyle(color, 0.7);

        if (id === 'ransomware_clown') {
            // Carnival clown — flesh/tan face, brass accents
            g.fillStyle(0xD4A96A, 1);  g.fillCircle(0, -5, 28);
            g.fillStyle(color, 1);     g.fillCircle(0, 3, 8);
            g.fillStyle(0x8B5A30, 1);  g.fillCircle(-18, -2, 7); g.fillCircle(18, -2, 7);
            g.fillStyle(0x1E0E05, 1);  g.fillCircle(-10, -10, 4); g.fillCircle(10, -10, 4);
            g.lineStyle(3, 0x1E0E05, 1);
            g.beginPath(); g.arc(0, 0, 15, 0.3, Math.PI - 0.3); g.strokePath();
            g.fillStyle(0x1E0E05, 1); g.fillRect(-16, -38, 32, 10); g.fillRect(-10, -58, 20, 22);
        } else if (id === 'phishing_king') {
            // Crown king
            g.fillStyle(accent, 1);
            g.fillTriangle(-20, -40, -20, -25, -10, -32);
            g.fillTriangle(-10, -40, -10, -25, 0,   -35);
            g.fillTriangle(0,   -40, 0,   -25, 10,  -35);
            g.fillTriangle(10,  -40, 10,  -25, 20,  -32);
            g.fillRect(-20, -30, 40, 12);
            g.fillStyle(0x3D2000, 1); g.fillCircle(0, -5, 22);
            g.fillStyle(0xD4A96A, 0.9); g.fillRect(-15, -10, 30, 20);
            g.lineStyle(2, color, 1); g.strokeRect(-15, -10, 30, 20);
            g.beginPath(); g.moveTo(-15, -10); g.lineTo(0, 2); g.lineTo(15, -10); g.strokePath();
        } else {
            // Evil AI robot
            g.fillStyle(0x001133, 1); g.fillRect(-22, -30, 44, 44);
            g.lineStyle(2, color, 1); g.strokeRect(-22, -30, 44, 44);
            g.fillStyle(color, 0.9); g.fillRect(-16, -22, 12, 10);
            g.fillRect(4, -22, 12, 10);
            g.lineStyle(2, accent, 1);
            g.beginPath(); g.moveTo(-16, -8); g.lineTo(16, -8); g.strokePath();
            g.fillStyle(color, 0.8);
            g.fillRect(-12, -5, 8, 12); g.fillRect(4, -5, 8, 12);
            g.lineStyle(2, accent, 0.6);
            g.beginPath(); g.moveTo(-12, 6); g.lineTo(12, 6); g.strokePath();
            // Antenna
            g.lineStyle(2, color, 1);
            g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -42); g.strokePath();
            g.fillStyle(color, 1); g.fillCircle(0, -44, 4);
        }
    }

    _updateHP() {
        this._hpBar.clear();
        const W = this.W;
        const pct = this.health / this.maxHealth;
        // Neutral brass bar — not colour-coded good/bad
        const col = pct > 0.5 ? 0xC8941A : pct > 0.25 ? 0xE8C050 : 0x8B5A10;
        this._hpBar.fillStyle(col, 1);
        this._hpBar.fillRect(-W/2 + 4, this.H/2 - 12, (W - 8) * pct, 8);
    }

    hit() {
        if (!this.alive) return false;
        this.health--;
        this._hitFlash = 0.8;
        this._updateHP();

        // Flinch tween — guarded to prevent accumulation on rapid hits
        if (!this._flinching && this.scene && this.scene.tweens) {
            this._flinching = true;
            const origX = this.x;
            this.scene.tweens.add({
                targets: this,
                x: origX + (Math.random() - 0.5) * 20,
                duration: 80, yoyo: true,
                onComplete: () => {
                    this.x = origX;
                    this._flinching = false;
                },
            });
        }

        if (this.health <= 0) {
            this.alive = false;
            this._deathAnim();
            return true;
        }
        return false;
    }

    _deathAnim() {
        if (!this.scene || !this.scene.tweens) {
            try { this.destroy(); } catch (e) {}
            return;
        }
        this.disableInteractive();
        this.scene.tweens.add({
            targets: this, scale: 2, alpha: 0, rotation: Math.PI,
            duration: 500, ease: 'Power3',
            onComplete: () => { try { this.destroy(); } catch (e) {} },
        });
    }

    update(time, delta) {
        if (!this.alive) return;
        const dt = delta / 1000;
        this._time += dt;
        this._hitFlash = Math.max(0, this._hitFlash - dt * 3);

        // Horizontal patrol
        this.x += this._velX * dt;
        this.y += Math.sin(this._time * 0.8) * 1.5;
        this.rotation = Math.sin(this._time * 1.2) * 0.08;

        // Bounce off walls
        if (this.x < 150 || this.x > 1130) this._velX *= -1;

        // Pulse scale
        const pulse = 1 + Math.sin(this._time * 4) * 0.04;
        this.setScale(pulse);
    }

    isHeadshot(worldY) { return worldY < this.y - this.H * 0.2; }
}
