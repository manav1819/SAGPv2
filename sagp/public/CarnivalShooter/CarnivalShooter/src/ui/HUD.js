// =============================================================================
// HUD — Heads-Up Display (score, ammo, timer, combo, accuracy, wave)
// =============================================================================
import { AMMO_MAX, ROUND_DURATION, FOCUS_COMBO } from '../config.js';

export class HUD {
    constructor(scene, scoreSystem, ammoSystem, difficultySystem) {
        this.scene   = scene;
        this.score   = scoreSystem;
        this.ammo    = ammoSystem;
        this.diff    = difficultySystem;

        this._build();
    }

    _txt(x, y, str, size = 18, color = '#ffffff', depth = 250) {
        return this.scene.add.text(x, y, str, {
            fontFamily: '"Courier New", monospace',
            fontSize:   `${size}px`,
            color,
            stroke:      '#000000',
            strokeThickness: 2,
            shadow: { blur: 6, color, fill: true },
        }).setScrollFactor(0).setDepth(depth).setOrigin(0, 0.5);
    }

    _panel(x, y, w, h, alpha = 0.7) {
        const g = this.scene.add.graphics().setScrollFactor(0).setDepth(249);
        g.fillStyle(0x050510, alpha);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(1, 0x4400aa, 0.8);
        g.strokeRoundedRect(x, y, w, h, 6);
        return g;
    }

    _build() {
        const s = this.scene;
        const W = 1280, H = 720;

        // ── TOP LEFT: Score & Combo ──────────────────────────────────────────
        this._panel(8, 8, 220, 70);
        this._scoreLbl = this._txt(18, 32, 'SCORE', 11, '#aaaaaa');
        this._scoreVal = this._txt(18, 52, '0', 26, '#ffff00');

        this._comboLbl = this._txt(130, 32, 'COMBO', 11, '#aaaaaa');
        this._comboVal = this._txt(130, 52, '×1', 24, '#ffffff');

        // ── TOP CENTER: Timer ────────────────────────────────────────────────
        this._panel(W/2 - 70, 8, 140, 55);
        this._timerLbl = this._txt(W/2 - 60, 25, 'TIME', 11, '#aaaaaa').setOrigin(0.5, 0.5).setX(W/2);
        this._timerVal = this._txt(W/2, 46, '1:30', 30, '#00ffff').setOrigin(0.5, 0.5);

        // ── TOP RIGHT: Accuracy & Wave ───────────────────────────────────────
        this._panel(W - 230, 8, 222, 70);
        this._accLbl  = this._txt(W - 220, 32, 'ACC', 11, '#aaaaaa');
        this._accVal  = this._txt(W - 220, 52, '100%', 26, '#00ff88');
        this._waveLbl = this._txt(W - 100, 32, 'WAVE', 11, '#aaaaaa');
        this._waveVal = this._txt(W - 100, 52, '1', 26, '#ff8800');

        // ── BOTTOM LEFT: Ammo ────────────────────────────────────────────────
        this._panel(8, H - 80, 300, 72);
        this._ammoLbl    = this._txt(18, H - 62, 'AMMO', 11, '#aaaaaa');
        this._ammoVal    = this._txt(18, H - 42, `${AMMO_MAX}`, 28, '#ffffff');
        this._ammoMax    = this._txt(80, H - 38, `/ ${AMMO_MAX}`, 18, '#888888');
        this._reloadBar  = null;
        this._reloadTxt  = null;
        this._buildAmmoIcons();

        // ── BOTTOM CENTER: Combo meter ────────────────────────────────────────
        this._panel(W/2 - 140, H - 50, 280, 42);
        this._meterLbl = this._txt(W/2, H - 36, 'FOCUS METER', 10, '#aa88ff').setOrigin(0.5, 0.5);
        this._buildComboMeter();

        // ── BOTTOM RIGHT: Threats / Friendly ─────────────────────────────────
        this._panel(W - 210, H - 80, 202, 72);
        this._killLbl = this._txt(W - 200, H - 62, 'THREATS', 11, '#aaaaaa');
        this._killVal = this._txt(W - 200, H - 42, '0', 26, '#ff4444');
        this._ffLbl   = this._txt(W - 110, H - 62, 'FF', 11, '#aaaaaa');
        this._ffVal   = this._txt(W - 110, H - 42, '0', 26, '#ffaa00');

        // ── RELOAD indicator ─────────────────────────────────────────────────
        this._reloadBg = this._panel(W/2 - 100, H/2 + 60, 200, 40, 0.9);
        this._reloadBg.setVisible(false);
        this._reloadTxt = s.add.text(W/2, H/2 + 80, '⟳ RELOADING...', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px', color: '#ff8800',
            shadow: { blur: 10, color: '#ff8800', fill: true },
        }).setScrollFactor(0).setDepth(260).setOrigin(0.5, 0.5).setVisible(false);

        this._reloadFill = s.add.graphics().setScrollFactor(0).setDepth(261);

        // ── FOCUS MODE banner ─────────────────────────────────────────────────
        this._focusBanner = s.add.text(W/2, 90, '★ FOCUS MODE ★', {
            fontFamily: '"Courier New", monospace',
            fontSize: '38px', fontStyle: 'bold', color: '#ff00ff',
            stroke: '#000', strokeThickness: 4,
            shadow: { blur: 20, color: '#ff00ff', fill: true },
        }).setScrollFactor(0).setDepth(260).setOrigin(0.5, 0.5).setAlpha(0);

        // ── Tip ticker ───────────────────────────────────────────────────────
        this._tipBg = this._panel(8, H/2 - 15, 320, 30, 0.6);
        this._tipBg.setVisible(false);
        this._tipTxt = s.add.text(18, H/2, '', {
            fontFamily: '"Courier New", monospace',
            fontSize: '12px', color: '#cccccc',
            wordWrap: { width: 300 },
        }).setScrollFactor(0).setDepth(251).setOrigin(0, 0.5).setVisible(false);
    }

    _buildAmmoIcons() {
        const s = this.scene;
        this._ammoIcons = [];
        for (let i = 0; i < AMMO_MAX; i++) {
            const g = s.add.graphics().setScrollFactor(0).setDepth(252);
            g.fillStyle(0x00ff88, 1);
            g.fillRect(0, 0, 8, 16);
            g.x = 170 + i * 11;
            g.y = this.scene.scale.height - 64;
            this._ammoIcons.push(g);
        }
    }

    _buildComboMeter() {
        const s = this.scene;
        const W = 1280, H = 720;
        this._comboMeterIcons = [];
        for (let i = 0; i < FOCUS_COMBO; i++) {
            const x = W/2 - 125 + i * 26;
            const g = s.add.graphics().setScrollFactor(0).setDepth(252);
            g.x = x; g.y = H - 32;
            this._comboMeterIcons.push(g);
        }
        this._drawComboMeter(0);
    }

    _drawComboMeter(count) {
        this._comboMeterIcons.forEach((g, i) => {
            g.clear();
            const filled = i < count;
            const color = filled ? 0xaa44ff : 0x333355;
            g.lineStyle(1, filled ? 0xff00ff : 0x444466, 1);
            g.fillStyle(color, 1);
            const pts = [{ x: 10, y: 0 },{ x: 20, y: 6 },{ x: 10, y: 12 },{ x: 0, y: 6 }];
            g.fillPoints(pts, true); g.strokePoints(pts, true);
        });
    }

    // ── UPDATE (called every frame) ──────────────────────────────────────────
    update(timeRemaining) {
        const sc = this.score;
        const am = this.ammo;
        const df = this.diff;

        // Score
        this._scoreVal.setText(sc.score.toLocaleString());
        const comboColor = sc.combo >= 8 ? '#ff00ff' : sc.combo >= 5 ? '#ffaa00' : sc.combo >= 3 ? '#ffff00' : '#ffffff';
        this._comboVal.setText(`×${sc.combo}`).setColor(comboColor);

        // Timer
        const secs = Math.max(0, Math.ceil(timeRemaining));
        const mm   = Math.floor(secs / 60);
        const ss   = String(secs % 60).padStart(2, '0');
        const tColor = secs <= 10 ? '#ff2222' : secs <= 20 ? '#ffaa00' : '#00ffff';
        this._timerVal.setText(`${mm}:${ss}`).setColor(tColor);
        if (secs <= 10) this._timerVal.setScale(1 + Math.sin(Date.now() / 200) * 0.05);

        // Accuracy
        const accColor = sc.accuracy >= 80 ? '#00ff88' : sc.accuracy >= 60 ? '#ffff00' : '#ff4444';
        this._accVal.setText(`${sc.accuracy}%`).setColor(accColor);

        // Wave
        this._waveVal.setText(String(df.wave));

        // Ammo icons
        const ammoCount = am.ammo;
        this._ammoIcons.forEach((g, i) => {
            g.clear();
            if (am.reloading) {
                g.fillStyle(0xff8800, 0.4 + Math.sin(Date.now() / 150 + i) * 0.3);
            } else {
                g.fillStyle(i < ammoCount ? 0x00ff88 : 0x333333, 1);
            }
            g.fillRect(0, 0, 8, 16);
            if (i < ammoCount && !am.reloading) {
                g.lineStyle(1, 0x00ffaa, 0.6);
                g.strokeRect(0, 0, 8, 16);
            }
        });

        // Ammo text
        this._ammoVal.setText(String(ammoCount));
        if (ammoCount <= 3 && !am.reloading) {
            const flash = Math.sin(Date.now() / 150) > 0;
            this._ammoVal.setColor(flash ? '#ff2222' : '#ff8800');
        } else if (am.reloading) {
            this._ammoVal.setColor('#ff8800');
        } else {
            this._ammoVal.setColor('#ffffff');
        }

        // Reload overlay
        if (am.reloading) {
            this._reloadBg.setVisible(true);
            this._reloadTxt.setVisible(true);
            const W = 1280, H = 720;
            this._reloadFill.clear();
            this._reloadFill.fillStyle(0xff8800, 1);
            this._reloadFill.fillRect(W/2 - 98, H/2 + 62, 196 * am.reloadPct, 7);
        } else {
            this._reloadBg.setVisible(false);
            this._reloadTxt.setVisible(false);
            this._reloadFill.clear();
        }

        // Combo meter
        this._drawComboMeter(sc.comboCount);

        // Kill / FF counts
        this._killVal.setText(String(sc.threatsKilled));
        this._ffVal.setText(String(sc.friendlyFire));
        if (sc.friendlyFire > 0) this._ffVal.setColor('#ff4444');
    }

    showFocusBanner(show) {
        const b = this._focusBanner;
        if (show) {
            this.scene.tweens.add({ targets: b, alpha: 1, duration: 300 });
            this.scene.tweens.add({
                targets: b, scale: 1.05,
                duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut',
            });
        } else {
            this.scene.tweens.killTweensOf(b);
            this.scene.tweens.add({ targets: b, alpha: 0, scale: 1, duration: 300 });
        }
    }

    showTip(text) {
        this._tipTxt.setText(`💡 ${text}`).setVisible(true);
        this._tipBg.setVisible(true);
        this.scene.time.delayedCall(3500, () => {
            this._tipTxt.setVisible(false);
            this._tipBg.setVisible(false);
        });
    }
}
