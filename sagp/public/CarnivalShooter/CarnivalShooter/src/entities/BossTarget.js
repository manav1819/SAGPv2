// =============================================================================
// BossTarget — large multi-hit boss enemy with special behaviour
// =============================================================================
export class BossTarget extends Phaser.GameObjects.Container {
    constructor(scene, bossData) {
        const x = Math.random() < 0.5 ? -160 : 1440;
        super(scene, x, 200 + Math.random() * 300);
        this.bossData  = bossData;
        this.alive     = true;
        this.health    = bossData.health;
        this.maxHealth = bossData.health;
        this.isGood    = false;
        this._time     = 0;
        this._velX     = x < 0 ? 120 : -120;
        this.W = bossData.size || 140;
        this.H = bossData.size || 140;
        this._hitFlash = 0;

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
        const { primaryColor, accentColor, label, subLabel } = this.bossData;
        const W = this.W, H = this.H;
        const g = this.scene.add.graphics();

        // Pulsing glow rings
        [40, 30, 20, 10, 3].forEach((lw, i) => {
            g.lineStyle(lw, primaryColor, [0.05, 0.08, 0.15, 0.4, 1][i]);
            g.strokeCircle(0, 0, W * 0.52);
        });

        // Main body (hexagon)
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

        // BOSS face decoration
        this._drawBossFace(g, primaryColor, accentColor);

        this.add(g);
        this._g = g;

        // BOSS label
        const nameT = this.scene.add.text(0, H * 0.38, label, {
            fontFamily: '"Courier New", monospace',
            fontSize: '16px', fontStyle: 'bold',
            color: '#ff0000',
            stroke: '#000', strokeThickness: 3,
            shadow: { blur: 12, color: '#ff0000', fill: true },
        }).setOrigin(0.5);
        this.add(nameT);

        const subT = this.scene.add.text(0, H * 0.38 + 18, '[ BOSS ]', {
            fontFamily: '"Courier New", monospace',
            fontSize: '10px', color: '#ffaa00',
        }).setOrigin(0.5);
        this.add(subT);

        // HP bar
        this._hpBg = this.scene.add.graphics();
        this._hpBg.fillStyle(0x330000, 1);
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
            // Creepy clown
            g.fillStyle(0xffeedd, 1); g.fillCircle(0, -5, 28);
            g.fillStyle(0xff0000, 1); g.fillCircle(0, 3, 8);
            g.fillStyle(0xff2222, 1); g.fillCircle(-18, -2, 7); g.fillCircle(18, -2, 7);
            g.fillStyle(0x000000, 1); g.fillCircle(-10, -10, 4); g.fillCircle(10, -10, 4);
            g.lineStyle(3, 0x000000, 1);
            g.beginPath(); g.arc(0, 0, 15, 0.3, Math.PI - 0.3); g.strokePath();
            g.fillStyle(0x330000, 1); g.fillRect(-16, -38, 32, 10); g.fillRect(-10, -58, 20, 22);
        } else if (id === 'phishing_king') {
            // Crown + evil email
            g.fillStyle(0xffcc00, 1);
            g.fillTriangle(-20, -40, -20, -25, -10, -32);
            g.fillTriangle(-10, -40, -10, -25, 0, -35);
            g.fillTriangle(0, -40, 0, -25, 10, -35);
            g.fillTriangle(10, -40, 10, -25, 20, -32);
            g.fillTriangle(20, -40, 20, -25, 20, -25);
            g.fillRect(-20, -30, 40, 12);
            g.fillStyle(0x880000, 1); g.fillCircle(0, -5, 22);
            g.fillStyle(0xffffff, 0.9); g.fillRect(-15, -10, 30, 20);
            g.lineStyle(2, 0x880000, 1); g.strokeRect(-15, -10, 30, 20);
            g.beginPath(); g.moveTo(-15, -10); g.lineTo(0, 2); g.lineTo(15, -10); g.strokePath();
        } else {
            // Evil AI robot
            g.fillStyle(0x001133, 1); g.fillRect(-22, -30, 44, 44);
            g.lineStyle(2, color, 1); g.strokeRect(-22, -30, 44, 44);
            g.fillStyle(color, 0.9); g.fillRect(-16, -22, 12, 10);
            g.fillRect(4, -22, 12, 10);
            g.lineStyle(2, 0x00ffff, 1);
            g.beginPath(); g.moveTo(-16, -8); g.lineTo(16, -8); g.strokePath();
            g.fillStyle(0xff00ff, 0.8);
            g.fillRect(-12, -5, 8, 12); g.fillRect(4, -5, 8, 12);
            g.lineStyle(2, 0xff00ff, 0.6);
            g.beginPath(); g.moveTo(-12, 6); g.lineTo(12, 6); g.strokePath();
            // Antenna
            g.lineStyle(2, color, 1);
            g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -42); g.strokePath();
            g.fillStyle(0xff0000, 1); g.fillCircle(0, -44, 4);
        }
    }

    _updateHP() {
        this._hpBar.clear();
        const W = this.W;
        const pct = this.health / this.maxHealth;
        const col = pct > 0.6 ? 0x00ff66 : pct > 0.3 ? 0xffff00 : 0xff2222;
        this._hpBar.fillStyle(col, 1);
        this._hpBar.fillRect(-W/2 + 4, this.H/2 - 12, (W - 8) * pct, 8);
    }

    hit() {
        if (!this.alive) return false;
        this.health--;
        this._hitFlash = 0.8;
        this._updateHP();

        // Flinch animation
        this.scene.tweens.add({
            targets: this, x: this.x + (Math.random() - 0.5) * 20,
            duration: 80, yoyo: true,
        });

        if (this.health <= 0) {
            this.alive = false;
            this._deathAnim();
            return true;
        }
        return false;
    }

    _deathAnim() {
        this.scene.tweens.add({
            targets: this, scale: 2, alpha: 0, rotation: Math.PI,
            duration: 500, ease: 'Power3',
            onComplete: () => this.destroy(),
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
