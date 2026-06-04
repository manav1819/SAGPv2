// =============================================================================
// Target — procedurally-drawn shooting gallery target
// Supports multiple movement patterns and visual types
// =============================================================================
export class Target extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} typeData  — one entry from TARGET_TYPES config
     * @param {number} speedMult — difficulty speed multiplier
     */
    constructor(scene, typeData, speedMult = 1) {
        const startPos = Target.getStartPosition(typeData.movementType);
        super(scene, startPos.x, startPos.y);

        this.typeData      = typeData;
        this.isGood        = typeData.isGood;
        this.alive         = true;
        this.health        = typeData.health || 1;
        this.maxHealth     = this.health;
        this.movementType  = typeData.movementType || 'slide';
        this._speedMult    = speedMult;
        this._time         = 0;
        this._baseX        = startPos.x;
        this._baseY        = startPos.y;
        this._velX         = startPos.velX * speedMult;
        this._velY         = startPos.velY * speedMult;
        this._flickerTimer = 0;
        this._hidden       = false;
        this._hitFlash     = 0;

        this.W = 110;
        this.H = 90;

        this._buildGraphics();
        this._buildHealthBar();

        scene.add.existing(this);
        this.setDepth(50 + Math.random() * 20);
        this.setSize(this.W, this.H);
        this.setInteractive();

        // Entrance animation
        this.setAlpha(0).setScale(0.3);
        scene.tweens.add({
            targets: this, alpha: 1, scale: 1, duration: 200,
            ease: 'Back.Out',
        });
    }

    // ── GRAPHICS BUILD ────────────────────────────────────────────────────────
    _buildGraphics() {
        const { primaryColor, accentColor, bgColor, label, subLabel, icon, isGood } = this.typeData;
        const W = this.W, H = this.H;
        const cx = 0, cy = 0;

        // --- Background panel ---
        const g = this.scene.add.graphics();

        // outer glow (multiple strokes)
        const glowAlphas = [0.12, 0.22, 0.4, 0.9];
        const glowWidths = [12, 8, 4, 2];
        glowWidths.forEach((lw, i) => {
            g.lineStyle(lw, primaryColor, glowAlphas[i]);
            g.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 8);
        });

        // fill
        g.fillStyle(bgColor || (isGood ? 0x001a10 : 0x1a0000), 1);
        g.fillRoundedRect(cx - W/2 + 1, cy - H/2 + 1, W - 2, H - 2, 7);

        // top stripe (accent)
        g.fillStyle(primaryColor, 0.8);
        g.fillRoundedRect(cx - W/2 + 1, cy - H/2 + 1, W - 2, 18, { tl: 7, tr: 7, bl: 0, br: 0 });

        // danger bars on bad targets
        if (!isGood) {
            g.lineStyle(1, primaryColor, 0.3);
            for (let i = 0; i < 4; i++) {
                g.strokeRect(cx - W/2 + 4 + i * 2, cy - H/2 + 4 + i * 2, W - 8 - i * 4, H - 8 - i * 4);
            }
        }

        this.add(g);
        this._bg = g;

        // --- Icon symbol (drawn) ---
        this._drawIcon(icon, primaryColor, accentColor, isGood);

        // --- Sub-label (top stripe text) ---
        const subLbl = this.scene.add.text(0, -H/2 + 9, subLabel, {
            fontFamily: '"Courier New", monospace',
            fontSize: '9px', fontStyle: 'bold',
            color: '#000000',
        }).setOrigin(0.5, 0.5);
        this.add(subLbl);

        // --- Main label ---
        const mainColor = isGood ? '#00ff88' : '#ffffff';
        const mainLbl = this.scene.add.text(0, H/2 - 22, label, {
            fontFamily: '"Courier New", monospace',
            fontSize: '13px', fontStyle: 'bold',
            color: mainColor,
            stroke: '#000000', strokeThickness: 2,
            shadow: { blur: 8, color: mainColor, fill: true },
            wordWrap: { width: W - 10 },
        }).setOrigin(0.5, 0.5);
        this.add(mainLbl);

        // warning triangle for bad targets
        if (!isGood) {
            const warn = this.scene.add.text(W/2 - 10, -H/2 + 3, '⚠', {
                fontSize: '10px', color: '#ffff00',
            }).setOrigin(0.5, 0);
            this.add(warn);
        } else {
            const check = this.scene.add.text(W/2 - 10, -H/2 + 3, '✓', {
                fontSize: '10px', color: '#00ff88',
            }).setOrigin(0.5, 0);
            this.add(check);
        }
    }

    _drawIcon(icon, color, accent, isGood) {
        const g = this.scene.add.graphics();
        const W = this.W, H = this.H;
        // center zone: cx=0, cy=-8 (leaving room for label at bottom)
        const ix = 0, iy = -6;
        const ic = color;
        const ia = 0.9;

        g.fillStyle(ic, 0.15);
        g.fillCircle(ix, iy, 22);
        g.lineStyle(2, ic, ia);
        g.strokeCircle(ix, iy, 22);

        g.lineStyle(2, ic, ia);
        g.fillStyle(ic, 0.8);

        switch (icon) {
            case 'lock_broken': {
                // broken padlock
                g.strokeRect(ix - 10, iy - 5, 20, 15);
                g.beginPath(); g.moveTo(ix - 7, iy - 5);
                g.lineTo(ix - 7, iy - 14); g.lineTo(ix + 4, iy - 14);
                g.strokePath();
                // crack
                g.lineStyle(2, 0xffff00, 1);
                g.beginPath(); g.moveTo(ix, iy - 2); g.lineTo(ix + 3, iy + 3); g.lineTo(ix - 1, iy + 8); g.strokePath();
                break;
            }
            case 'email_evil': {
                // envelope with skull
                g.strokeRect(ix - 14, iy - 9, 28, 18);
                g.beginPath(); g.moveTo(ix - 14, iy - 9); g.lineTo(ix, iy + 2); g.lineTo(ix + 14, iy - 9); g.strokePath();
                g.fillStyle(0xff0000, 0.8);
                g.fillCircle(ix, iy + 3, 6);
                g.fillStyle(0x000000, 1);
                g.fillCircle(ix - 2, iy + 2, 1.5);
                g.fillCircle(ix + 2, iy + 2, 1.5);
                g.fillRect(ix - 3, iy + 5, 6, 2);
                break;
            }
            case 'usb_skull': {
                g.fillRect(ix - 4, iy - 14, 8, 20);
                g.fillRect(ix - 8, iy - 14, 16, 5);
                g.fillRect(ix - 5, iy - 3, 4, 4);
                g.fillRect(ix + 1, iy - 3, 4, 4);
                g.fillStyle(0xff0000, 0.8);
                g.fillCircle(ix, iy + 8, 7);
                g.fillStyle(0x000000, 1);
                g.fillCircle(ix - 2, iy + 7, 1.5);
                g.fillCircle(ix + 2, iy + 7, 1.5);
                g.fillRect(ix - 3, iy + 11, 2, 2);
                g.fillRect(ix, iy + 11, 2, 2);
                g.fillRect(ix + 3, iy + 11, 2, 2);
                break;
            }
            case 'popup': {
                g.fillStyle(0x220000, 1);
                g.fillRect(ix - 16, iy - 12, 32, 22);
                g.lineStyle(2, 0xff4400, 1);
                g.strokeRect(ix - 16, iy - 12, 32, 22);
                g.fillStyle(0xff4400, 1);
                g.fillRect(ix - 16, iy - 12, 32, 7);
                g.fillStyle(0xffff00, 1);
                g.fillTriangle(ix, iy - 1, ix - 5, iy + 8, ix + 5, iy + 8);
                g.fillStyle(0x000000, 1);
                g.fillRect(ix - 1, iy + 1, 2, 4);
                g.fillCircle(ix, iy + 8, 1);
                break;
            }
            case 'file_evil': {
                g.fillStyle(0x330000, 1);
                g.fillRect(ix - 11, iy - 15, 22, 26);
                g.lineStyle(2, ic, ia);
                g.strokeRect(ix - 11, iy - 15, 22, 26);
                g.fillStyle(0xff0000, 1);
                g.fillTriangle(ix, iy - 8, ix - 5, iy + 2, ix + 5, iy + 2);
                g.fillStyle(0xffffff, 1);
                g.fillRect(ix - 1, iy - 6, 2, 5); g.fillRect(ix - 1, iy + 3, 2, 2);
                break;
            }
            case 'qr_evil': {
                const s = 5;
                const pat = [[1,1,0,1,1],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[1,1,0,1,1]];
                pat.forEach((row, r) => row.forEach((v, c) => {
                    if (v) { g.fillStyle(ic, 0.9); g.fillRect(ix - 12 + c*s, iy - 12 + r*s, s-1, s-1); }
                }));
                g.fillStyle(0xff0000, 0.8); g.fillCircle(ix, iy, 5);
                g.fillStyle(0x000000, 1); g.fillCircle(ix-2, iy-1, 1.5); g.fillCircle(ix+2, iy-1, 1.5);
                g.fillRect(ix-3, iy+2, 6, 2);
                break;
            }
            case 'money_skull': {
                g.fillStyle(0xcc9900, 0.9); g.fillCircle(ix, iy, 14);
                g.fillStyle(ic, 1);
                g.fillText('$', ix - 5, iy - 8);
                g.fillStyle(0xff0000, 0.9); g.fillCircle(ix, iy + 2, 8);
                g.fillStyle(0x000000, 1); g.fillCircle(ix-2, iy+1, 1.5); g.fillCircle(ix+2, iy+1, 1.5);
                g.fillRect(ix-3, iy+5, 2, 2); g.fillRect(ix, iy+5, 2, 2); g.fillRect(ix+3, iy+5, 2, 2);
                break;
            }
            case 'shield_broken': {
                g.beginPath(); g.moveTo(ix, iy - 14); g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4); g.lineTo(ix, iy + 14); g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8); g.closePath(); g.strokePath();
                g.lineStyle(3, 0xff0000, 1);
                g.beginPath(); g.moveTo(ix - 3, iy - 14); g.lineTo(ix + 3, iy + 14); g.strokePath();
                g.lineStyle(2, 0xff4444, 0.8);
                g.beginPath(); g.moveTo(ix - 8, iy - 4); g.lineTo(ix + 4, iy + 10); g.strokePath();
                break;
            }
            case 'phone_evil': {
                g.fillStyle(0x330000, 1);
                g.fillRoundedRect(ix - 8, iy - 14, 16, 26, 3);
                g.lineStyle(2, ic, 0.9);
                g.strokeRoundedRect(ix - 8, iy - 14, 16, 26, 3);
                g.fillStyle(0xff0000, 1);
                g.fillTriangle(ix, iy - 6, ix - 5, iy + 4, ix + 5, iy + 4);
                g.fillStyle(0xffffff, 1); g.fillRect(ix - 1, iy - 4, 2, 5); g.fillRect(ix-1, iy+5, 2, 2);
                break;
            }
            case 'wifi_evil': {
                [14, 10, 6].forEach((r, i) => {
                    g.lineStyle(2, i === 0 ? 0xff0000 : ic, ia - i * 0.1);
                    g.beginPath();
                    g.arc(ix, iy + 2, r, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330));
                    g.strokePath();
                });
                g.fillStyle(0xff0000, 1); g.fillCircle(ix, iy + 2, 3);
                break;
            }
            case 'clown': {
                // clown face
                g.fillStyle(0xffffff, 0.9); g.fillCircle(ix, iy, 14);
                g.fillStyle(0xff0000, 1); g.fillCircle(ix, iy + 4, 4);
                g.fillStyle(0xff4444, 1); g.fillCircle(ix - 8, iy + 1, 3); g.fillCircle(ix + 8, iy + 1, 3);
                g.fillStyle(0x000000, 1); g.fillCircle(ix - 5, iy - 4, 2); g.fillCircle(ix + 5, iy - 4, 2);
                // evil grin
                g.lineStyle(2, 0x000000, 1);
                g.beginPath(); g.arc(ix, iy + 3, 7, Phaser.Math.DegToRad(15), Phaser.Math.DegToRad(165)); g.strokePath();
                // hat
                g.fillStyle(0x220000, 1); g.fillRect(ix - 12, iy - 18, 24, 5); g.fillRect(ix - 7, iy - 28, 14, 12);
                break;
            }
            // GOOD target icons
            case 'shield_ok': {
                g.beginPath(); g.moveTo(ix, iy - 14); g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4); g.lineTo(ix, iy + 14); g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8); g.closePath();
                g.fillStyle(ic, 0.2); g.fillPath();
                g.lineStyle(2, ic, 1); g.strokePath();
                g.lineStyle(3, 0x00ff88, 1);
                g.beginPath(); g.moveTo(ix - 6, iy); g.lineTo(ix - 1, iy + 6); g.lineTo(ix + 7, iy - 6); g.strokePath();
                break;
            }
            case 'vault': {
                g.fillStyle(0x003344, 1); g.fillRoundedRect(ix - 14, iy - 12, 28, 22, 4);
                g.lineStyle(2, ic, 1); g.strokeRoundedRect(ix - 14, iy - 12, 28, 22, 4);
                g.lineStyle(1, ic, 0.5);
                [0, 1, 2, 3].forEach(i => g.strokeCircle(ix, iy, 3 + i * 3));
                g.fillStyle(ic, 1); g.fillCircle(ix, iy, 3);
                g.fillStyle(0x00ccff, 1); g.fillRect(ix + 3, iy - 3, 10, 3);
                break;
            }
            case 'lock_ok': {
                g.fillStyle(0x003300, 1); g.fillRect(ix - 10, iy - 3, 20, 14);
                g.lineStyle(2, ic, 1); g.strokeRect(ix - 10, iy - 3, 20, 14);
                g.lineStyle(2, ic, 1); g.arc(ix, iy - 3, 8, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0)); g.strokePath();
                g.fillStyle(ic, 1); g.fillCircle(ix, iy + 4, 3);
                g.fillRect(ix - 1, iy + 4, 2, 5);
                g.fillStyle(0x00ff88, 1);
                g.fillTriangle(ix - 10, iy + 20, ix - 4, iy + 28, ix + 6, iy + 14);
                break;
            }
            case 'flag': {
                g.fillStyle(0x004400, 1); g.fillRect(ix - 1, iy - 14, 2, 26);
                g.lineStyle(2, ic, 1); g.strokeRect(ix - 1, iy - 14, 2, 26);
                g.fillStyle(ic, 0.9);
                g.fillTriangle(ix + 1, iy - 14, ix + 14, iy - 7, ix + 1, iy);
                break;
            }
            case 'update_shield': {
                g.beginPath(); g.moveTo(ix, iy - 14); g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4); g.lineTo(ix, iy + 14); g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8); g.closePath();
                g.lineStyle(2, ic, 1); g.strokePath();
                // circular arrow
                g.lineStyle(2, ic, 0.9);
                g.beginPath(); g.arc(ix, iy, 7, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(300)); g.strokePath();
                g.fillStyle(ic, 1);
                g.fillTriangle(ix + 6, iy - 4, ix + 2, iy - 9, ix + 10, iy - 8);
                break;
            }
            case 'zero_trust': {
                g.lineStyle(2, ic, 0.8);
                g.strokeRect(ix - 10, iy - 10, 20, 20);
                g.fillStyle(0xff0000, 1); g.fillCircle(ix, iy, 6);
                g.lineStyle(2, 0xffffff, 1);
                g.beginPath(); g.moveTo(ix - 4, iy - 4); g.lineTo(ix + 4, iy + 4); g.strokePath();
                g.beginPath(); g.moveTo(ix + 4, iy - 4); g.lineTo(ix - 4, iy + 4); g.strokePath();
                break;
            }
            case 'team': {
                [{ x: -8, y: -2 }, { x: 0, y: -6 }, { x: 8, y: -2 }].forEach(p => {
                    g.fillStyle(ic, 0.8); g.fillCircle(ix + p.x, iy + p.y, 5);
                });
                g.lineStyle(1, ic, 0.5);
                g.strokeCircle(ix - 8, iy - 2, 5);
                break;
            }
            default: {
                // generic diamond
                g.fillStyle(ic, 0.8);
                g.fillTriangle(ix, iy - 12, ix + 10, iy, ix, iy + 12);
                g.fillTriangle(ix, iy - 12, ix - 10, iy, ix, iy + 12);
                break;
            }
        }
        this.add(g);
        this._iconG = g;
    }

    _buildHealthBar() {
        if (this.maxHealth <= 1) return;
        const W = this.W;
        this._hpBg = this.scene.add.graphics();
        this._hpBg.fillStyle(0x333333, 1);
        this._hpBg.fillRect(-W/2 + 4, this.H/2 - 8, W - 8, 5);
        this.add(this._hpBg);
        this._hpBar = this.scene.add.graphics();
        this.add(this._hpBar);
        this._updateHealthBar();
    }

    _updateHealthBar() {
        if (!this._hpBar) return;
        const W = this.W;
        const pct = this.health / this.maxHealth;
        const barW = (W - 8) * pct;
        this._hpBar.clear();
        this._hpBar.fillStyle(pct > 0.5 ? 0x00ff66 : pct > 0.25 ? 0xffff00 : 0xff2222, 1);
        this._hpBar.fillRect(-W/2 + 4, this.H/2 - 8, barW, 5);
    }

    // ── MOVEMENT ─────────────────────────────────────────────────────────────
    static getStartPosition(type) {
        const W = 1280, H = 720;
        switch (type) {
            case 'slide': {
                const fromLeft = Math.random() < 0.5;
                const y = 120 + Math.random() * 420;
                return { x: fromLeft ? -80 : W + 80, y, velX: fromLeft ? 180 : -180, velY: 0 };
            }
            case 'flyby': {
                const fromLeft = Math.random() < 0.5;
                const y = 80 + Math.random() * 300;
                return { x: fromLeft ? -80 : W + 80, y, velX: fromLeft ? 280 : -280, velY: (Math.random() - 0.5) * 60 };
            }
            case 'popup':
                return { x: 150 + Math.random() * 980, y: H + 80, velX: 0, velY: -200 };
            case 'hover':
                return { x: 200 + Math.random() * 880, y: 100 + Math.random() * 350, velX: 0, velY: 0 };
            case 'zigzag': {
                const fromLeft = Math.random() < 0.5;
                return { x: fromLeft ? -80 : W + 80, y: 200 + Math.random() * 300, velX: fromLeft ? 200 : -200, velY: 0 };
            }
            case 'pendulum':
                return { x: 200 + Math.random() * 880, y: 80 + Math.random() * 300, velX: 0, velY: 0 };
            default:
                return { x: -80, y: 200 + Math.random() * 300, velX: 160, velY: 0 };
        }
    }

    update(time, delta) {
        if (!this.alive) return;
        const dt = delta / 1000;
        this._time += dt;
        this._hitFlash = Math.max(0, this._hitFlash - dt * 4);

        // Apply tint for hit flash
        const flashAlpha = this._hitFlash;
        if (flashAlpha > 0) {
            this.list.forEach(c => { if (c.setTint) c.setTint(0xffffff); });
        } else {
            this.list.forEach(c => { if (c.clearTint) c.clearTint(); });
        }

        // Movement logic
        switch (this.movementType) {
            case 'slide':
            case 'flyby':
                this.x += this._velX * dt;
                this.y += this._velY * dt;
                break;
            case 'popup':
                if (this.y > 100 + Math.random() * 400) {
                    this.y += this._velY * dt;
                } else {
                    // hover briefly then pop down
                    this._time > 2.5 && (this.y -= this._velY * dt * 0.5);
                }
                break;
            case 'zigzag':
                this.x += this._velX * dt;
                this.y = this._baseY + Math.sin(this._time * 3) * 80;
                break;
            case 'pendulum':
                this.x = this._baseX + Math.sin(this._time * 1.8) * 180;
                this.y = this._baseY + Math.sin(this._time * 0.9) * 40;
                break;
            case 'hover':
                this.x = this._baseX + Math.sin(this._time * 1.2) * 60;
                this.y = this._baseY + Math.cos(this._time * 0.8) * 30;
                break;
        }

        // Bobbing rotation for flair
        this.rotation = Math.sin(this._time * 2 + this._baseX) * 0.05;

        // Check OOB
        if (this.x < -200 || this.x > 1480 || this.y > 820) {
            this.scene.events.emit('targetEscaped', this);
            this.destroy();
        }
    }

    // ── HIT ───────────────────────────────────────────────────────────────────
    hit(isHeadshot = false) {
        if (!this.alive) return false;
        this.health--;
        this._hitFlash = 1;
        this._updateHealthBar();
        if (this.health <= 0) {
            this.alive = false;
            this._destroyAnim();
            return true;   // killed
        }
        return false;      // damaged but alive
    }

    _destroyAnim() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.4, scaleY: 0,
            alpha: 0,
            duration: 180,
            ease: 'Power2',
            onComplete: () => this.destroy(),
        });
    }

    /** Returns true if the click y is in the top 25% (headshot zone) */
    isHeadshot(worldY) {
        return worldY < this.y - this.H * 0.25;
    }
}
