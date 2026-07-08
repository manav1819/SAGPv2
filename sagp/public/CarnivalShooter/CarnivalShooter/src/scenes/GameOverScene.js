// =============================================================================
// GameOverScene — results screen with grade, stats, leaderboard
// =============================================================================
export class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.summary = data.summary || {};
    }

    create() {
        const W = 1280, H = 720;
        const s = this.summary;

        // Cursor must always be visible on the results screen.
        document.body.style.cursor = 'default';
        try { this.input.setDefaultCursor('default'); } catch (e) {}
        try {
            if (this.input.mouse && this.input.mouse.locked) {
                this.input.mouse.releasePointerLock();
            }
        } catch (e) {}

        // ── SAGP Integration Bridge ────────────────────────────────────────────
        // Fire immediately so the parent Next.js IframeGame host receives the
        // completed session result and can run the full engine pipeline.
        if (window.parent !== window && !window.__sagpCarnivalResultSent) {
            window.__sagpCarnivalResultSent = true;
            const maxScore = 10000;
            // grade D (score < 1500 or accuracy < 45%) is considered a fail
            const passed = (s.score || 0) >= 1500;
            window.parent.postMessage({
                type:          'GAME_COMPLETE',
                score:         s.score         || 0,
                maxScore,
                passed,
                accuracy:      s.accuracy      || 0,
                combo:         s.combo         || 1,
                threatsKilled: s.threatsKilled || 0,
                shotsFired:    s.shotsFired    || 0,
                shotsHit:      s.shotsHit      || 0,
                friendlyFire:  s.friendlyFire  || 0,
                grade:         (s.grade && s.grade.label) || 'D',
            }, window.location.origin || '*');
        }
        // ──────────────────────────────────────────────────────────────────────

        // ── Background ─────────────────────────────────────────────────────────
        this.add.image(W/2, H/2, 'background').setDisplaySize(W, H).setAlpha(0.3);
        this.add.rectangle(W/2, H/2, W, H, 0x050510, 0.75);

        // Animated lights
        this._lightsG = this.add.graphics();
        this._phase   = 0;

        // ── Central panel ──────────────────────────────────────────────────────
        const panelG = this.add.graphics();
        panelG.fillStyle(0x0a0520, 0.9);
        panelG.lineStyle(2, 0xff00ff, 1);
        panelG.fillRoundedRect(W/2 - 380, 60, 760, 590, 14);
        panelG.strokeRoundedRect(W/2 - 380, 60, 760, 590, 14);

        // ── Grade badge ────────────────────────────────────────────────────────
        const grade = s.grade || { label: 'C', color: '#ffff00' };
        const gradeG = this.add.graphics();
        gradeG.fillStyle(Phaser.Display.Color.HexStringToColor(grade.color).color, 0.2);
        gradeG.lineStyle(5, Phaser.Display.Color.HexStringToColor(grade.color).color, 1);
        gradeG.fillCircle(W/2 - 240, 190, 70);
        gradeG.strokeCircle(W/2 - 240, 190, 70);

        this.add.text(W/2 - 240, 190, grade.label, {
            fontFamily: '"Courier New", monospace',
            fontSize: '70px', fontStyle: 'bold', color: grade.color,
            shadow: { blur: 30, color: grade.color, fill: true },
        }).setOrigin(0.5);

        this.add.text(W/2 - 240, 268, 'GRADE', {
            fontFamily: '"Courier New", monospace',
            fontSize: '14px', color: '#888888',
        }).setOrigin(0.5);

        // ── Title ──────────────────────────────────────────────────────────────
        this.add.text(W/2 + 60, 105, 'OPERATION COMPLETE', {
            fontFamily: '"Courier New", monospace',
            fontSize: '13px', color: '#aa88ff', letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(W/2 + 60, 145, 'MISSION DEBRIEF', {
            fontFamily: '"Courier New", monospace',
            fontSize: '36px', fontStyle: 'bold', color: '#ffffff',
            shadow: { blur: 15, color: '#ffffff', fill: true },
        }).setOrigin(0.5);

        // ── Score ──────────────────────────────────────────────────────────────
        const scoreColor = '#ffff00';
        this.add.text(W/2 + 60, 210, 'FINAL SCORE', {
            fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#aaaaaa',
        }).setOrigin(0.5);

        const scoreNum = this.add.text(W/2 + 60, 248, '0', {
            fontFamily: '"Courier New", monospace',
            fontSize: '58px', fontStyle: 'bold', color: scoreColor,
            shadow: { blur: 25, color: scoreColor, fill: true },
        }).setOrigin(0.5);

        // Score count-up animation
        this.tweens.addCounter({
            from: 0, to: s.score || 0, duration: 1800, ease: 'Power2',
            onUpdate: (t) => scoreNum.setText(Math.floor(t.getValue()).toLocaleString()),
        });

        // ── Stats grid ─────────────────────────────────────────────────────────
        const stats = [
            { label: 'ACCURACY',      value: `${s.accuracy || 0}%`,      color: s.accuracy >= 80 ? '#00ff88' : s.accuracy >= 60 ? '#ffff00' : '#ff4444' },
            { label: 'THREATS KILLED',value: String(s.threatsKilled || 0), color: '#ff4444' },
            { label: 'SHOTS FIRED',   value: String(s.shotsFired || 0),    color: '#aaaaaa' },
            { label: 'SHOTS HIT',     value: String(s.shotsHit || 0),      color: '#00ff88' },
            { label: 'FRIENDLY FIRE', value: String(s.friendlyFire || 0),  color: s.friendlyFire > 0 ? '#ff8800' : '#aaaaaa' },
            { label: 'MAX COMBO',     value: `×${s.combo || 1}`,           color: '#ff00ff' },
        ];

        const cols = 3, rows = 2;
        stats.forEach((st, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const sx  = W/2 - 370 + 90 + col * 250;
            const sy  = 330 + row * 80;

            const bg = this.add.graphics();
            bg.fillStyle(0x110022, 0.8);
            bg.lineStyle(1, 0x440066, 0.7);
            bg.fillRoundedRect(sx - 100, sy - 24, 200, 48, 6);
            bg.strokeRoundedRect(sx - 100, sy - 24, 200, 48, 6);

            this.add.text(sx, sy - 8, st.label, {
                fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#888888',
            }).setOrigin(0.5);
            this.add.text(sx, sy + 12, st.value, {
                fontFamily: '"Courier New", monospace',
                fontSize: '22px', fontStyle: 'bold', color: st.color,
                shadow: { blur: 8, color: st.color, fill: true },
            }).setOrigin(0.5);
        });

        // ── Tip / debrief ──────────────────────────────────────────────────────
        const tips = [
            'Always verify sender addresses before clicking links.',
            'MFA blocks 99.9% of automated account attacks.',
            'Found a USB? Report it — never plug in unknown drives.',
            'Software updates patch known vulnerabilities. Update often!',
            'Urgency + link = phishing. Pause before you click.',
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];

        const tipBg = this.add.graphics();
        tipBg.fillStyle(0x001133, 0.8);
        tipBg.lineStyle(1, 0x0066ff, 0.6);
        tipBg.fillRoundedRect(W/2 - 370, 510, 740, 50, 8);
        tipBg.strokeRoundedRect(W/2 - 370, 510, 740, 50, 8);
        this.add.text(W/2, 535, `💡 ${tip}`, {
            fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#aaddff',
            align: 'center', wordWrap: { width: 720 },
        }).setOrigin(0.5);

        // ── Highscore note ─────────────────────────────────────────────────────
        const hs = parseInt(localStorage.getItem('cc_highscore') || '0');
        if (s.score >= hs && hs > 0) {
            const newHS = this.add.text(W/2, 575, '★ NEW HIGH SCORE! ★', {
                fontFamily: '"Courier New", monospace',
                fontSize: '22px', fontStyle: 'bold', color: '#ffff00',
                shadow: { blur: 16, color: '#ffff00', fill: true },
            }).setOrigin(0.5);
            this.tweens.add({ targets: newHS, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
        }

        // ── Buttons ────────────────────────────────────────────────────────────
        // When running inside the SAGP IframeGame host, show a "Dashboard" button.
        // Otherwise fall back to the standard two-button layout.
        const inSAGP = window.parent !== window;
        if (inSAGP) {
            this._makeButton(W/2 - 260, 618, 230, 52, '► PLAY AGAIN', '#00ff88', () => {
                try { this.sound.play('sfx_confirm', { volume: 0.5 }); } catch(e) {}
                window.__sagpCarnivalResultSent = false; // allow re-submission
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.time.delayedCall(400, () => this.scene.start('GameScene'));
            });
            this._makeButton(W/2, 618, 230, 52, '◀ MORE GAMES', '#ff00ff', () => {
                try { this.sound.play('sfx_click', { volume: 0.5 }); } catch(e) {}
                // Re-fire postMessage so IframeGame overlay is triggered if missed
                if (!window.__sagpCarnivalResultSent) {
                    window.__sagpCarnivalResultSent = true;
                    const maxScore = 10000;
                    const passed = (this.summary.score || 0) >= 1500;
                    window.parent.postMessage({
                        type: 'GAME_COMPLETE',
                        score: this.summary.score || 0,
                        maxScore, passed,
                    }, window.location.origin || '*');
                }
            });
            this._makeButton(W/2 + 260, 618, 230, 52, '🏠 DASHBOARD', '#00ccff', () => {
                try { this.sound.play('sfx_click', { volume: 0.5 }); } catch(e) {}
                // Re-fire if the overlay was somehow dismissed
                if (!window.__sagpCarnivalResultSent) {
                    window.__sagpCarnivalResultSent = true;
                    const maxScore = 10000;
                    const passed = (this.summary.score || 0) >= 1500;
                    window.parent.postMessage({
                        type: 'GAME_COMPLETE',
                        score: this.summary.score || 0,
                        maxScore, passed,
                    }, window.location.origin || '*');
                }
            });
        } else {
            this._makeButton(W/2 - 140, 618, 250, 52, '► PLAY AGAIN', '#00ff88', () => {
                try { this.sound.play('sfx_confirm', { volume: 0.5 }); } catch(e) {}
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.time.delayedCall(400, () => this.scene.start('GameScene'));
            });

            this._makeButton(W/2 + 140, 618, 250, 52, '◀ MAIN MENU', '#ff00ff', () => {
                try { this.sound.play('sfx_click', { volume: 0.5 }); } catch(e) {}
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.time.delayedCall(400, () => this.scene.start('MenuScene'));
            });
        } // end else (standalone mode)

        // Fade in
        this.cameras.main.fadeIn(600, 0, 0, 0);
        try { this.sound.play('sfx_confirm', { volume: 0.4 }); } catch(e) {}
    }

    _makeButton(cx, cy, w, h, label, color, cb) {
        const g = this.add.graphics();
        const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
        const draw = (hover) => {
            g.clear();
            g.fillStyle(hover ? hexColor : 0x110022, hover ? 0.4 : 0.8);
            g.lineStyle(hover ? 3 : 2, hexColor, 1);
            g.fillRoundedRect(cx - w/2, cy - h/2, w, h, 8);
            g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, 8);
        };
        draw(false);
        const txt = this.add.text(cx, cy, label, {
            fontFamily: '"Courier New", monospace', fontSize: '18px', fontStyle: 'bold',
            color, shadow: { blur: 10, color, fill: true },
        }).setOrigin(0.5);
        const zone = this.add.zone(cx, cy, w, h).setInteractive();
        zone.on('pointerover', () => { draw(true); txt.setScale(1.05); });
        zone.on('pointerout',  () => { draw(false); txt.setScale(1); });
        zone.on('pointerdown', cb);
    }

    update(time, delta) {
        this._phase += delta / 300;
        const g = this._lightsG;
        g.clear();
        for (let i = 0; i < 44; i++) {
            const x   = i * 29 + 14;
            const col = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00][i % 4];
            const on  = Math.sin(this._phase + i * 0.6) > 0.2;
            g.fillStyle(col, on ? 0.7 : 0.1);
            g.fillCircle(x, 16, 6);
        }
    }
}
