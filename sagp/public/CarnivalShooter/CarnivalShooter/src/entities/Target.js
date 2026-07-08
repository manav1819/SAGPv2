// =============================================================================
// Target — procedurally-drawn shooting gallery target
// Unified carnival visual style: players must read content, not match colours.
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
        this._hitFlash     = 0;
        this._destroying   = false;

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
    // ALL targets use the same carnival wood-panel look.
    // Visual distinction between good/bad is REMOVED by design:
    // the player must read the label/subLabel to identify threats.
    _buildGraphics() {
        const { label, subLabel, icon, primaryColor, accentColor } = this.typeData;
        const W = this.W, H = this.H;

        // Unified carnival palette (same for every target)
        const WOOD_DARK   = 0x1E0E05;
        const WOOD_MID    = 0x2A1500;
        const BRASS       = primaryColor;    // tarnished brass from config
        const BRASS_LIGHT = accentColor;     // light gold from config
        const STRIPE      = 0x8B1A0A;       // carnival booth red (decorative only)

        const g = this.scene.add.graphics();

        // ── Outer brass border ───────────────────────────────────────────────
        g.lineStyle(3, BRASS, 0.95);
        g.strokeRoundedRect(-W/2, -H/2, W, H, 8);

        // ── Dark wood fill ───────────────────────────────────────────────────
        g.fillStyle(WOOD_MID, 1);
        g.fillRoundedRect(-W/2 + 2, -H/2 + 2, W - 4, H - 4, 7);

        // ── Horizontal wood grain (subtle texture) ───────────────────────────
        g.lineStyle(1, WOOD_DARK, 0.55);
        for (let i = 0; i < 4; i++) {
            const gy = -H/2 + 22 + i * 16;
            g.beginPath();
            g.moveTo(-W/2 + 6, gy);
            g.lineTo( W/2 - 6, gy);
            g.strokePath();
        }

        // ── Inner inset border ───────────────────────────────────────────────
        g.lineStyle(1, BRASS, 0.35);
        g.strokeRoundedRect(-W/2 + 5, -H/2 + 5, W - 10, H - 10, 5);

        // ── Carnival stripe (top, decorative — same colour for all) ──────────
        g.fillStyle(STRIPE, 1);
        g.fillRoundedRect(-W/2 + 2, -H/2 + 2, W - 4, 18,
            { tl: 7, tr: 7, bl: 0, br: 0 });

        // ── Corner rivets ────────────────────────────────────────────────────
        g.fillStyle(BRASS, 0.65);
        [
            [-W/2 + 8, -H/2 + 8],
            [ W/2 - 8, -H/2 + 8],
            [-W/2 + 8,  H/2 - 8],
            [ W/2 - 8,  H/2 - 8],
        ].forEach(([rx, ry]) => g.fillCircle(rx, ry, 2.5));

        this.add(g);
        this._bg = g;

        // ── Icon (all icons drawn in the unified brass palette) ───────────────
        this._drawIcon(icon, BRASS, BRASS_LIGHT);

        // ── Sub-label (white text on red stripe) ─────────────────────────────
        const subLbl = this.scene.add.text(0, -H/2 + 10, subLabel, {
            fontFamily: '"Courier New", monospace',
            fontSize: '9px', fontStyle: 'bold',
            color: '#FFFFFF',
        }).setOrigin(0.5, 0.5);
        this.add(subLbl);

        // ── Main label — SAME warm amber for ALL targets ──────────────────────
        // Players must read this, not rely on colour.
        const mainLbl = this.scene.add.text(0, H/2 - 22, label, {
            fontFamily: '"Courier New", monospace',
            fontSize: '13px', fontStyle: 'bold',
            color: '#FFE082',
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: W - 10 },
        }).setOrigin(0.5, 0.5);
        this.add(mainLbl);

        // NO corner badges (⚠ / ✓) — they were colour-based shortcuts.
        // NO "danger bars" pattern on bad targets.
    }

    // All icons use the same brass/gold colour — shape conveys meaning, not colour.
    _drawIcon(icon, color, accent) {
        const g = this.scene.add.graphics();
        const ix = 0, iy = -6;     // icon centre (leaves room for label at bottom)
        const ia = 0.9;

        // Icon background circle (unified)
        g.fillStyle(color, 0.12);
        g.fillCircle(ix, iy, 22);
        g.lineStyle(2, color, ia);
        g.strokeCircle(ix, iy, 22);

        g.lineStyle(2, color, ia);
        g.fillStyle(color, 0.85);

        switch (icon) {
            // ── BAD ICONS ──────────────────────────────────────────────────────
            case 'lock_broken': {
                // Broken open padlock
                g.strokeRect(ix - 10, iy - 5, 20, 15);
                g.beginPath();
                g.moveTo(ix - 7, iy - 5);
                g.lineTo(ix - 7, iy - 14);
                g.lineTo(ix + 4, iy - 14);
                g.strokePath();
                // Crack in brass
                g.lineStyle(2, accent, 0.9);
                g.beginPath();
                g.moveTo(ix,     iy - 2);
                g.lineTo(ix + 3, iy + 3);
                g.lineTo(ix - 1, iy + 8);
                g.strokePath();
                break;
            }
            case 'email_evil': {
                // Envelope with skull
                g.strokeRect(ix - 14, iy - 9, 28, 18);
                g.beginPath();
                g.moveTo(ix - 14, iy - 9);
                g.lineTo(ix,      iy + 2);
                g.lineTo(ix + 14, iy - 9);
                g.strokePath();
                // Skull (brass, not red — shape is the threat cue)
                g.fillStyle(color, 0.7);
                g.fillCircle(ix, iy + 3, 6);
                g.fillStyle(0x1E0E05, 1);
                g.fillCircle(ix - 2, iy + 2, 1.5);
                g.fillCircle(ix + 2, iy + 2, 1.5);
                g.fillRect(ix - 3, iy + 5, 6, 2);
                break;
            }
            case 'usb_skull': {
                // USB drive with skull
                g.fillRect(ix - 4, iy - 14, 8, 20);
                g.fillRect(ix - 8, iy - 14, 16, 5);
                g.fillRect(ix - 5, iy - 3,  4,  4);
                g.fillRect(ix + 1, iy - 3,  4,  4);
                g.fillStyle(color, 0.65);
                g.fillCircle(ix, iy + 8, 7);
                g.fillStyle(0x1E0E05, 1);
                g.fillCircle(ix - 2, iy + 7, 1.5);
                g.fillCircle(ix + 2, iy + 7, 1.5);
                g.fillRect(ix - 3, iy + 11, 2, 2);
                g.fillRect(ix,     iy + 11, 2, 2);
                g.fillRect(ix + 3, iy + 11, 2, 2);
                break;
            }
            case 'popup': {
                // Fake alert popup
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 16, iy - 12, 32, 22);
                g.lineStyle(2, color, 1);
                g.strokeRect(ix - 16, iy - 12, 32, 22);
                g.fillStyle(color, 0.8);
                g.fillRect(ix - 16, iy - 12, 32, 7);
                // Warning triangle
                g.fillStyle(accent, 1);
                g.fillTriangle(ix, iy - 1, ix - 5, iy + 8, ix + 5, iy + 8);
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 1, iy + 1, 2, 4);
                g.fillCircle(ix, iy + 8, 1);
                break;
            }
            case 'file_evil': {
                // Malicious executable file
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 11, iy - 15, 22, 26);
                g.lineStyle(2, color, ia);
                g.strokeRect(ix - 11, iy - 15, 22, 26);
                g.fillStyle(color, 1);
                g.fillTriangle(ix, iy - 8, ix - 5, iy + 2, ix + 5, iy + 2);
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 1, iy - 6, 2, 5);
                g.fillRect(ix - 1, iy + 3, 2, 2);
                break;
            }
            case 'qr_evil': {
                // Malicious QR code
                const s = 5;
                const pat = [[1,1,0,1,1],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[1,1,0,1,1]];
                pat.forEach((row, r) => row.forEach((v, c) => {
                    if (v) {
                        g.fillStyle(color, 0.9);
                        g.fillRect(ix - 12 + c * s, iy - 12 + r * s, s - 1, s - 1);
                    }
                }));
                // Skull overlay
                g.fillStyle(color, 0.7);
                g.fillCircle(ix, iy, 5);
                g.fillStyle(0x1E0E05, 1);
                g.fillCircle(ix - 2, iy - 1, 1.5);
                g.fillCircle(ix + 2, iy - 1, 1.5);
                g.fillRect(ix - 3, iy + 2, 6, 2);
                break;
            }
            case 'money_skull': {
                // Scam / money with skull
                g.fillStyle(color, 0.7);
                g.fillCircle(ix, iy, 14);
                g.fillStyle(0x1E0E05, 1);
                g.fillText('$', ix - 5, iy - 8);
                // Skull
                g.fillStyle(color, 0.5);
                g.fillCircle(ix, iy + 2, 8);
                g.fillStyle(0x1E0E05, 1);
                g.fillCircle(ix - 2, iy + 1, 1.5);
                g.fillCircle(ix + 2, iy + 1, 1.5);
                g.fillRect(ix - 3, iy + 5, 2, 2);
                g.fillRect(ix,     iy + 5, 2, 2);
                g.fillRect(ix + 3, iy + 5, 2, 2);
                break;
            }
            case 'shield_broken': {
                // Cracked shield (broken security)
                g.beginPath();
                g.moveTo(ix,      iy - 14);
                g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4);
                g.lineTo(ix,      iy + 14);
                g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8);
                g.closePath();
                g.strokePath();
                // Cracks (same brass, thicker for visibility)
                g.lineStyle(3, accent, 0.95);
                g.beginPath();
                g.moveTo(ix - 3, iy - 14);
                g.lineTo(ix + 3, iy + 14);
                g.strokePath();
                g.lineStyle(2, color, 0.7);
                g.beginPath();
                g.moveTo(ix - 8, iy - 4);
                g.lineTo(ix + 4, iy + 10);
                g.strokePath();
                break;
            }
            case 'phone_evil': {
                // Evil phone / scam call
                g.fillStyle(0x1E0E05, 1);
                g.fillRoundedRect(ix - 8, iy - 14, 16, 26, 3);
                g.lineStyle(2, color, 0.9);
                g.strokeRoundedRect(ix - 8, iy - 14, 16, 26, 3);
                g.fillStyle(color, 1);
                g.fillTriangle(ix, iy - 6, ix - 5, iy + 4, ix + 5, iy + 4);
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 1, iy - 4, 2, 5);
                g.fillRect(ix - 1, iy + 5, 2, 2);
                break;
            }
            case 'wifi_evil': {
                // Evil twin / rogue AP
                [14, 10, 6].forEach((r, i) => {
                    g.lineStyle(2, color, ia - i * 0.1);
                    g.beginPath();
                    g.arc(ix, iy + 2, r, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330));
                    g.strokePath();
                });
                // Centre dot (same brass — not red)
                g.fillStyle(color, 1);
                g.fillCircle(ix, iy + 2, 3);
                break;
            }
            case 'clown': {
                // Threat actor clown face (brass/wood palette)
                g.fillStyle(0xD4A96A, 0.9);    // warm tan face
                g.fillCircle(ix, iy, 14);
                g.fillStyle(color, 1);           // brass nose
                g.fillCircle(ix, iy + 4, 4);
                g.fillStyle(0x8B5A30, 1);        // dark cheeks
                g.fillCircle(ix - 8, iy + 1, 3);
                g.fillCircle(ix + 8, iy + 1, 3);
                g.fillStyle(0x1E0E05, 1);        // dark eyes
                g.fillCircle(ix - 5, iy - 4, 2);
                g.fillCircle(ix + 5, iy - 4, 2);
                // Evil grin
                g.lineStyle(2, 0x1E0E05, 1);
                g.beginPath();
                g.arc(ix, iy + 3, 7, Phaser.Math.DegToRad(15), Phaser.Math.DegToRad(165));
                g.strokePath();
                // Hat (dark wood colour)
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 12, iy - 18, 24, 5);
                g.fillRect(ix - 7,  iy - 28, 14, 12);
                break;
            }

            // ── GOOD ICONS ─────────────────────────────────────────────────────
            case 'shield_ok': {
                // Intact shield with checkmark
                g.beginPath();
                g.moveTo(ix,      iy - 14);
                g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4);
                g.lineTo(ix,      iy + 14);
                g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8);
                g.closePath();
                g.fillStyle(color, 0.15);
                g.fillPath();
                g.lineStyle(2, color, 1);
                g.strokePath();
                // Checkmark (brass — same colour, shape is the cue)
                g.lineStyle(3, accent, 1);
                g.beginPath();
                g.moveTo(ix - 6, iy);
                g.lineTo(ix - 1, iy + 6);
                g.lineTo(ix + 7, iy - 6);
                g.strokePath();
                break;
            }
            case 'vault': {
                // Password vault / safe
                g.fillStyle(0x1E0E05, 1);
                g.fillRoundedRect(ix - 14, iy - 12, 28, 22, 4);
                g.lineStyle(2, color, 1);
                g.strokeRoundedRect(ix - 14, iy - 12, 28, 22, 4);
                g.lineStyle(1, color, 0.5);
                [0, 1, 2, 3].forEach(i => g.strokeCircle(ix, iy, 3 + i * 3));
                g.fillStyle(color, 1);
                g.fillCircle(ix, iy, 3);
                g.fillStyle(accent, 1);
                g.fillRect(ix + 3, iy - 3, 10, 3);
                break;
            }
            case 'lock_ok': {
                // Locked padlock (intact)
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 10, iy - 3, 20, 14);
                g.lineStyle(2, color, 1);
                g.strokeRect(ix - 10, iy - 3, 20, 14);
                g.arc(ix, iy - 3, 8, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0));
                g.strokePath();
                g.fillStyle(color, 1);
                g.fillCircle(ix, iy + 4, 3);
                g.fillRect(ix - 1, iy + 4, 2, 5);
                // Checkmark below (brass)
                g.lineStyle(3, accent, 1);
                g.beginPath();
                g.moveTo(ix - 5, iy + 18);
                g.lineTo(ix,     iy + 24);
                g.lineTo(ix + 7, iy + 14);
                g.strokePath();
                break;
            }
            case 'flag': {
                // Report flag
                g.fillStyle(0x1E0E05, 1);
                g.fillRect(ix - 1, iy - 14, 2, 26);
                g.lineStyle(2, color, 1);
                g.strokeRect(ix - 1, iy - 14, 2, 26);
                g.fillStyle(color, 0.9);
                g.fillTriangle(ix + 1, iy - 14, ix + 14, iy - 7, ix + 1, iy);
                break;
            }
            case 'update_shield': {
                // Patched / updated shield
                g.beginPath();
                g.moveTo(ix,      iy - 14);
                g.lineTo(ix + 12, iy - 8);
                g.lineTo(ix + 12, iy + 4);
                g.lineTo(ix,      iy + 14);
                g.lineTo(ix - 12, iy + 4);
                g.lineTo(ix - 12, iy - 8);
                g.closePath();
                g.lineStyle(2, color, 1);
                g.strokePath();
                // Circular update arrow
                g.lineStyle(2, color, 0.9);
                g.beginPath();
                g.arc(ix, iy, 7, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(300));
                g.strokePath();
                g.fillStyle(color, 1);
                g.fillTriangle(ix + 6, iy - 4, ix + 2, iy - 9, ix + 10, iy - 8);
                break;
            }
            case 'zero_trust': {
                // Zero-trust policy (access control — deny by default)
                g.lineStyle(2, color, 0.8);
                g.strokeRect(ix - 10, iy - 10, 20, 20);
                // X cross (brass — same colour as shield_ok checkmark; shape is the distinction)
                g.fillStyle(color, 0.6);
                g.fillCircle(ix, iy, 6);
                g.lineStyle(2, 0x1E0E05, 1);
                g.beginPath();
                g.moveTo(ix - 4, iy - 4); g.lineTo(ix + 4, iy + 4);
                g.strokePath();
                g.beginPath();
                g.moveTo(ix + 4, iy - 4); g.lineTo(ix - 4, iy + 4);
                g.strokePath();
                break;
            }
            case 'team': {
                // Security team / SOC
                [{ x: -8, y: -2 }, { x: 0, y: -6 }, { x: 8, y: -2 }].forEach(p => {
                    g.fillStyle(color, 0.8);
                    g.fillCircle(ix + p.x, iy + p.y, 5);
                });
                g.lineStyle(1, color, 0.5);
                g.strokeCircle(ix - 8, iy - 2, 5);
                break;
            }
            default: {
                // Generic diamond
                g.fillStyle(color, 0.8);
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
        this._hpBg.fillStyle(0x3D2000, 1);
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
        // Neutral brass bar — not colour-coded good/bad
        this._hpBar.fillStyle(pct > 0.5 ? 0xC8941A : pct > 0.25 ? 0xE8C050 : 0x8B5A10, 1);
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
        if (!this.alive || this._destroying) return;
        const dt = delta / 1000;
        this._time += dt;
        this._hitFlash = Math.max(0, this._hitFlash - dt * 4);

        // Hit flash tint (brief white flash on damage)
        if (this._hitFlash > 0) {
            this.list.forEach(c => { if (c.setTint) c.setTint(0xffffff); });
        } else {
            this.list.forEach(c => { if (c.clearTint) c.clearTint(); });
        }

        // Movement
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
                    if (this._time > 2.5) this.y -= this._velY * dt * 0.5;
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

        // Gentle sway
        this.rotation = Math.sin(this._time * 2 + this._baseX) * 0.05;

        // Out-of-bounds check
        if (this.x < -200 || this.x > 1480 || this.y > 820) {
            this.scene.events.emit('targetEscaped', this);
            this._safeDestroy();
        }
    }

    // ── HIT ───────────────────────────────────────────────────────────────────
    hit() {
        if (!this.alive || this._destroying) return false;
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
        if (this._destroying) return;
        this._destroying = true;
        this.disableInteractive();
        if (!this.scene || !this.scene.tweens) {
            this._safeDestroy();
            return;
        }
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.4, scaleY: 0,
            alpha: 0,
            duration: 180,
            ease: 'Power2',
            onComplete: () => this._safeDestroy(),
        });
    }

    _safeDestroy() {
        if (!this.active) return;
        try { this.destroy(); } catch (e) {}
    }

    /** Returns true if the click y is in the top 25% (headshot zone) */
    isHeadshot(worldY) {
        return worldY < this.y - this.H * 0.25;
    }
}
