// =============================================================================
// MenuScene — animated neon carnival main menu
// =============================================================================
export class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = 1280, H = 720;
        this._time = 0;

        // Cursor must always be visible in menus — restore unconditionally.
        document.body.style.cursor = 'default';
        try { this.input.setDefaultCursor('default'); } catch (e) {}
        // Release pointer lock if it was held from a previous gameplay session.
        try {
            if (this.input.mouse && this.input.mouse.locked) {
                this.input.mouse.releasePointerLock();
            }
        } catch (e) {}

        // ── Background ────────────────────────────────────────────────────────
        this.add.image(W/2, H/2, 'background').setDisplaySize(W, H).setAlpha(0.4);

        // Dark overlay
        this.add.rectangle(W/2, H/2, W, H, 0x050510, 0.6);

        // Animated lights strip (top & bottom)
        this._lightsG = this.add.graphics();
        this._drawLights();

        // ── Booth silhouettes ─────────────────────────────────────────────────
        this._buildBooth(80,  H - 200, 0xff00ff);
        this._buildBooth(1160, H - 200, 0x00ffff);

        // ── Rain effect ───────────────────────────────────────────────────────
        this._rain = [];
        for (let i = 0; i < 80; i++) {
            this._rain.push({
                x: Math.random() * W, y: Math.random() * H,
                speed: 200 + Math.random() * 300,
                alpha: 0.1 + Math.random() * 0.3,
            });
        }
        this._rainG = this.add.graphics().setAlpha(0.5);

        // ── Title ─────────────────────────────────────────────────────────────
        const title1 = this.add.text(W/2, 160, '⚡ CYBER CARNIVAL ⚡', {
            fontFamily: '"Courier New", monospace',
            fontSize: '68px', fontStyle: 'bold', color: '#ff00ff',
            stroke: '#220044', strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, blur: 40, color: '#ff00ff', fill: true },
        }).setOrigin(0.5);

        const title2 = this.add.text(W/2, 248, 'T H R E A T   H U N T', {
            fontFamily: '"Courier New", monospace',
            fontSize: '32px', letterSpacing: 12, color: '#00ffff',
            shadow: { blur: 20, color: '#00ffff', fill: true },
        }).setOrigin(0.5);

        const sub = this.add.text(W/2, 294, 'SAGP  •  SECURITY AWARENESS GAMIFICATION PLATFORM', {
            fontFamily: '"Courier New", monospace',
            fontSize: '13px', color: '#aa88ff',
        }).setOrigin(0.5);

        // Floating title
        this.tweens.add({ targets: title1, y: 155, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

        // ── Info cards ────────────────────────────────────────────────────────
        const cards = [
            { icon: '🎯', title: 'SHOOT THREATS',  body: 'Phishing, malware,\nweak passwords & more' },
            { icon: '🛡️', title: 'PROTECT ALLIES', body: 'MFA, HTTPS, updates\nare your friends!' },
            { icon: '💥', title: 'BUILD COMBOS',   body: '10× combo unlocks\n★ FOCUS MODE ★' },
        ];
        cards.forEach((c, i) => {
            const cx = W/2 - 280 + i * 280;
            const cy = 430;
            const bg = this.add.graphics();
            bg.fillStyle(0x0a0520, 0.85);
            bg.lineStyle(1, [0xff00ff, 0x00ffff, 0xff6600][i], 0.8);
            bg.fillRoundedRect(cx - 100, cy - 70, 200, 140, 8);
            bg.strokeRoundedRect(cx - 100, cy - 70, 200, 140, 8);
            this.add.text(cx, cy - 42, c.icon, { fontSize: '30px' }).setOrigin(0.5);
            this.add.text(cx, cy - 6, c.title, {
                fontFamily: '"Courier New", monospace', fontSize: '16px', fontStyle: 'bold',
                color: ['#ff00ff','#00ffff','#ff6600'][i],
                shadow: { blur: 8, color: ['#ff00ff','#00ffff','#ff6600'][i], fill: true },
            }).setOrigin(0.5);
            this.add.text(cx, cy + 26, c.body, {
                fontFamily: '"Courier New", monospace', fontSize: '12px',
                color: '#aaaaaa', align: 'center',
            }).setOrigin(0.5);

            this.tweens.add({ targets: bg, y: -3, duration: 1500 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        });

        // ── Highscore display ─────────────────────────────────────────────────
        const hs = parseInt(localStorage.getItem('cc_highscore') || '0');
        if (hs > 0) {
            const hsG = this.add.graphics();
            hsG.fillStyle(0x0a0520, 0.7);
            hsG.lineStyle(1, 0xffff00, 0.6);
            hsG.fillRoundedRect(W/2 - 110, 310, 220, 40, 6);
            hsG.strokeRoundedRect(W/2 - 110, 310, 220, 40, 6);
            this.add.text(W/2, 330, `★ HIGH SCORE: ${hs.toLocaleString()}`, {
                fontFamily: '"Courier New", monospace', fontSize: '16px',
                color: '#ffff00', shadow: { blur: 8, color: '#ffff00', fill: true },
            }).setOrigin(0.5);
        }

        // ── Play button ───────────────────────────────────────────────────────
        const btnG = this.add.graphics();
        const drawBtn = (hover) => {
            btnG.clear();
            btnG.fillStyle(hover ? 0x4400aa : 0x220066, hover ? 1 : 0.9);
            btnG.lineStyle(hover ? 3 : 2, 0xff00ff, 1);
            btnG.fillRoundedRect(W/2 - 140, 580, 280, 65, 10);
            btnG.strokeRoundedRect(W/2 - 140, 580, 280, 65, 10);
        };
        drawBtn(false);

        const btnTxt = this.add.text(W/2, 612, '► START HUNT', {
            fontFamily: '"Courier New", monospace',
            fontSize: '28px', fontStyle: 'bold', color: '#ff00ff',
            shadow: { blur: 16, color: '#ff00ff', fill: true },
        }).setOrigin(0.5);

        const btnZone = this.add.zone(W/2, 612, 280, 65).setInteractive();
        btnZone.on('pointerover', () => { drawBtn(true); btnTxt.setScale(1.05); try { this.sound.play('sfx_click', { volume: 0.4 }); } catch(e){} });
        btnZone.on('pointerout',  () => { drawBtn(false); btnTxt.setScale(1); });
        btnZone.on('pointerdown', () => {
            try { this.sound.play('sfx_confirm', { volume: 0.6 }); } catch(e){}
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => this.scene.start('GameScene'));
        });

        // Pulsing button
        this.tweens.add({ targets: btnTxt, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });

        // ── Mute button ───────────────────────────────────────────────────────
        const muteBtn = this.add.text(W - 30, 30, '🔊', { fontSize: '24px' })
            .setOrigin(1, 0).setInteractive().setDepth(300);
        muteBtn.on('pointerdown', () => {
            this.sound.mute = !this.sound.mute;
            muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
        });

        // Fade in
        this.cameras.main.fadeIn(600, 0, 0, 0);
    }

    _buildBooth(x, y, color) {
        const g = this.add.graphics().setAlpha(0.5);
        g.lineStyle(2, color, 0.8);
        g.fillStyle(color, 0.1);
        g.fillRect(x - 60, y - 120, 120, 120);
        g.strokeRect(x - 60, y - 120, 120, 120);
        // roof
        g.fillStyle(color, 0.3);
        g.fillTriangle(x - 70, y - 120, x + 70, y - 120, x, y - 175);
        g.strokeTriangle(x - 70, y - 120, x + 70, y - 120, x, y - 175);
        // stripes
        for (let i = 0; i < 5; i++) {
            g.fillStyle(i % 2 ? color : 0x000000, 0.3);
            g.fillRect(x - 70 + i * 28, y - 120, 28, 55);
        }
        // sign
        g.lineStyle(1, color, 0.9);
        g.strokeRect(x - 45, y - 100, 90, 25);
    }

    _drawLights() {
        const g = this._lightsG;
        const W = 1280;
        g.clear();
        const t = Date.now();
        for (let i = 0; i < 42; i++) {
            const x = i * 31 + 15;
            const colors = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00, 0x00ff88];
            const col = colors[i % colors.length];
            const on  = Math.sin(t / 300 + i * 0.7) > 0.2;
            g.fillStyle(col, on ? 0.9 : 0.15);
            g.fillCircle(x, 18, 7);
            if (on) {
                g.fillStyle(col, 0.2);
                g.fillCircle(x, 18, 14);
            }
        }
        // bottom row
        for (let i = 0; i < 42; i++) {
            const x = i * 31 + 15;
            const colors = [0x00ff88, 0xff6600, 0x00ffff, 0xff00ff];
            const col = colors[i % colors.length];
            const on  = Math.sin(t / 300 + i * 0.9 + 2) > 0.2;
            g.fillStyle(col, on ? 0.8 : 0.12);
            g.fillCircle(x, 705, 6);
        }
    }

    update(time, delta) {
        this._time += delta;
        this._drawLights();

        // Rain
        const W = 1280, H = 720;
        this._rainG.clear();
        this._rainG.lineStyle(1, 0x00ccff, 0.4);
        const dt = delta / 1000;
        this._rain.forEach(r => {
            r.y += r.speed * dt;
            if (r.y > H) { r.y = -20; r.x = Math.random() * W; }
            this._rainG.fillStyle(0x00aaff, r.alpha);
            this._rainG.fillRect(r.x, r.y, 1, 8);
        });
    }
}
