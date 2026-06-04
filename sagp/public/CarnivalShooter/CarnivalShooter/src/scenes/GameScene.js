// =============================================================================
// GameScene — main gameplay loop
// =============================================================================
import { TARGET_TYPES, BOSS_TYPES, RANDOM_EVENTS,
         ROUND_DURATION, BOSS_INTERVAL, EVENT_INTERVAL,
         FOCUS_DURATION, COLORS } from '../config.js';
import { Target }           from '../entities/Target.js';
import { BossTarget }       from '../entities/BossTarget.js';
import { HUD }              from '../ui/HUD.js';
import { Crosshair }        from '../ui/Crosshair.js';
import { ScoreSystem }      from '../systems/ScoreSystem.js';
import { AmmoSystem }       from '../systems/AmmoSystem.js';
import { DifficultySystem } from '../systems/DifficultySystem.js';
import { Effects }          from '../effects/Effects.js';
import { AudioManager }     from '../audio/AudioManager.js';

export class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const W = 1280, H = 720;
        this._time    = 0;
        this._over    = false;
        this._paused  = false;
        this._targets = [];
        this._boss    = null;
        this._bulletHoles = [];
        this._spawnTimer  = 0;
        this._bossTimer   = 0;
        this._eventTimer  = 0;
        this._focusTimer  = 0;
        this._timeLeft    = ROUND_DURATION;
        this._eventActive = false;
        this._currentEvent= null;
        this._focusActive = false;
        this._spawnBurst  = 0;

        // ── Systems ────────────────────────────────────────────────────────────
        this.score  = new ScoreSystem();
        this.ammo   = new AmmoSystem();
        this.diff   = new DifficultySystem();
        this.fx     = new Effects(this);
        this.audio  = new AudioManager(this);

        this._wireScoreEvents();
        this._wireAmmoEvents();

        // ── Background ─────────────────────────────────────────────────────────
        this.add.image(W/2, H/2, 'background').setDisplaySize(W, H).setAlpha(0.55);
        this._buildCarnivalBg();

        // ── Bullet hole layer ──────────────────────────────────────────────────
        this._holeLayer = this.add.graphics().setDepth(10);

        // ── Foreground overlay ─────────────────────────────────────────────────
        this._fgImg = this.add.image(W/2, H/2, 'foreground')
            .setDisplaySize(W, H).setAlpha(0.45).setDepth(45);

        // ── Rain ───────────────────────────────────────────────────────────────
        this._rain = [];
        for (let i = 0; i < 60; i++) {
            this._rain.push({ x: Math.random()*W, y: Math.random()*H, speed: 250 + Math.random()*250, a: 0.08 + Math.random()*0.18 });
        }
        this._rainG = this.add.graphics().setDepth(3).setAlpha(0.6);

        // ── UI ─────────────────────────────────────────────────────────────────
        this.hud       = new HUD(this, this.score, this.ammo, this.diff);
        this.crosshair = new Crosshair(this);

        // ── Input ──────────────────────────────────────────────────────────────
        this.input.on('pointerdown', (p) => this._onFire(p));
        this.input.keyboard.on('keydown-R', () => this.ammo.startReload());
        this.input.keyboard.on('keydown-ESC', () => this._togglePause());
        this.input.keyboard.on('keydown-M', () => {
            this.audio.toggleMute();
        });

        // ── Mute button ────────────────────────────────────────────────────────
        const muteBtn = this.add.text(W - 30, 30, '🔊', { fontSize: '22px' })
            .setOrigin(1, 0).setInteractive().setDepth(310).setScrollFactor(0);
        muteBtn.on('pointerdown', () => {
            const m = this.audio.toggleMute();
            muteBtn.setText(m ? '🔇' : '🔊');
        });

        // ── Wave label ─────────────────────────────────────────────────────────
        this._waveAnnounce();

        // ── Boss & event timers ────────────────────────────────────────────────
        this.time.addEvent({ delay: BOSS_INTERVAL,  repeat: -1, callback: this._spawnBoss,  callbackScope: this });
        this.time.addEvent({ delay: EVENT_INTERVAL, repeat: -1, callback: this._triggerEvent, callbackScope: this });

        // ── Target escape listener ─────────────────────────────────────────────
        this.events.on('targetEscaped', t => {
            if (t.isGood) return;
            this.score.threatEscaped();
            this._targets = this._targets.filter(x => x !== t);
        });

        // Fade in
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    // ── WIRING ─────────────────────────────────────────────────────────────────
    _wireScoreEvents() {
        this.score.on('focusReady', () => this._activateFocus());
        this.score.on('comboBreak', () => {
            this.crosshair.setFocus(false);
            this.hud.showFocusBanner(false);
            this._focusActive = false;
        });
    }

    _wireAmmoEvents() {
        this.ammo.onReloadStart    = () => { this.audio.reload(); this.crosshair.setReloading(true); };
        this.ammo.onReloadComplete = () => { this.crosshair.setReloading(false); };
        this.ammo.onEmpty          = () => { this.audio.emptyClick(); };
    }

    // ── BACKGROUND ────────────────────────────────────────────────────────────
    _buildCarnivalBg() {
        const g = this.add.graphics().setDepth(2);
        const W = 1280, H = 720;

        // Ground
        g.fillStyle(0x0a0530, 1);
        g.fillRect(0, H - 130, W, 130);
        g.lineStyle(2, COLORS.neonPink, 0.6);
        g.strokeRect(0, H - 130, W, 130);

        // Booth silhouettes (background)
        const boothX = [50, 230, 1050, 1230];
        boothX.forEach((bx, i) => {
            const col = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00][i % 4];
            g.fillStyle(col, 0.08);
            g.fillRect(bx - 55, H - 300, 110, 170);
            g.lineStyle(1, col, 0.4);
            g.strokeRect(bx - 55, H - 300, 110, 170);
            g.fillStyle(col, 0.25);
            g.fillTriangle(bx - 65, H - 300, bx + 65, H - 300, bx, H - 358);
        });

        // Animated lights
        this._bgLightsG = this.add.graphics().setDepth(4);
        this._lightPhase = 0;
    }

    _updateBgLights(dt) {
        this._lightPhase += dt * 3;
        const g = this._bgLightsG;
        g.clear();
        const W = 1280;
        for (let i = 0; i < 44; i++) {
            const x   = i * 29 + 14;
            const col = [0xff00ff, 0x00ffff, 0xff6600, 0xffff00][i % 4];
            const on  = Math.sin(this._lightPhase + i * 0.6) > 0.1;
            g.fillStyle(col, on ? 0.85 : 0.12);
            g.fillCircle(x, 14, 6);
            if (on) { g.fillStyle(col, 0.2); g.fillCircle(x, 14, 11); }
        }
        // string lines
        g.lineStyle(1, 0x333355, 0.6);
        for (let i = 0; i < 44; i++) {
            const x = i * 29 + 14;
            g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 14, 14); g.strokePath();
        }
    }

    // ── INPUT ──────────────────────────────────────────────────────────────────
    _onFire(pointer) {
        if (this._over || this._paused) return;

        // Animate crosshair
        this.crosshair.shootFX();

        if (!this.ammo.canShoot()) {
            if (!this.ammo.reloading) {
                this.audio.emptyClick();
                this.fx.floatText(pointer.x, pointer.y, '⟳ EMPTY!', '#ff8800', 22);
            }
            return;
        }

        // Consume ammo
        this.ammo.shoot();
        this.score.shot();
        this.audio.shoot();

        // Bullet hole on background
        this._addBulletHole(pointer.x, pointer.y);

        // Hit test
        const hitTarget = this._getHitTarget(pointer.x, pointer.y);
        if (!hitTarget) {
            this.score.miss();
            this.fx.sparks(pointer.x, pointer.y, 0x888888);
            return;
        }

        const isHead = hitTarget.isHeadshot(pointer.y);
        this._processHit(hitTarget, pointer.x, pointer.y, isHead);
    }

    _getHitTarget(px, py) {
        // Check boss first
        if (this._boss && this._boss.alive) {
            const b = this._boss;
            if (Math.abs(px - b.x) < b.W/2 && Math.abs(py - b.y) < b.H/2) return b;
        }
        // Check regular targets (topmost first)
        for (let i = this._targets.length - 1; i >= 0; i--) {
            const t = this._targets[i];
            if (!t.alive) continue;
            if (Math.abs(px - t.x) < t.W/2 && Math.abs(py - t.y) < t.H/2) return t;
        }
        return null;
    }

    _processHit(target, px, py, isHead) {
        if (target.isGood) {
            const pen = this.score.hitFriendly();
            this.fx.friendlyFire(px, py);
            this.fx.burstGood(px, py);
            this.audio.hitGood();
            this.audio.denied();
            target.hit();
            this.hud.showTip(target.typeData?.tip || 'Protect your allies!');
            this._targets = this._targets.filter(x => x !== target);
            return;
        }

        const killed = target.hit(isHead);

        if (isHead) {
            this.fx.headshot(px, py);
            this.audio.hitBad();
        } else {
            this.fx.burstBad(px, py);
            this.fx.sparks(px, py, target.bossData ? 0xff0000 : target.typeData?.primaryColor || 0xff4444);
            this.audio.hitBad();
        }

        if (!killed) {
            // Boss / multi-hit target damaged
            this.audio.bossHit();
            this.fx.ring(px, py, 0xff4444);
            return;
        }

        // Target killed
        if (target === this._boss) {
            this._boss = null;
            const gained = this.score.hitThreat(isHead);
            const bonus  = target.bossData.points;
            this.score.score += bonus;
            this.audio.bossDie();
            this.fx.screenShake(18, 600);
            this.fx.flashWhite();
            this.fx.announce(`💀 ${target.bossData.label} DEFEATED!`, '#ff0000', `+${(gained + bonus).toLocaleString()} PTS`);
            this.fx.burst(px, py, 0xff0000, 60);
            this.hud.showTip(target.bossData.tip);
        } else {
            const gained = this.score.hitThreat(isHead);
            this.fx.scorePopup(px, py - 20, gained, this.score.combo);
            this.fx.ring(px, py, target.typeData?.primaryColor || 0xff4444);
            if (this.score.combo > 1) {
                this.audio.combo(this.score.combo);
                if (this.score.combo % 5 === 0) {
                    this.fx.announce(`🔥 ×${this.score.combo} COMBO!`, '#ffff00', 'THREAT NEUTRALISED');
                }
            }
            this.hud.showTip(target.typeData?.tip || '');
            this._targets = this._targets.filter(x => x !== target);
        }
    }

    _addBulletHole(x, y) {
        this._holeLayer.fillStyle(0x000000, 0.6);
        this._holeLayer.fillCircle(x, y, 4);
        this._holeLayer.lineStyle(1, 0x555555, 0.5);
        this._holeLayer.strokeCircle(x, y, 6);
        // Limit count
        this._bulletHoles.push({ x, y });
        if (this._bulletHoles.length > 80) {
            this._bulletHoles.shift();
            this._holeLayer.clear();
            this._bulletHoles.forEach(h => {
                this._holeLayer.fillStyle(0x000000, 0.6);
                this._holeLayer.fillCircle(h.x, h.y, 4);
                this._holeLayer.lineStyle(1, 0x555555, 0.5);
                this._holeLayer.strokeCircle(h.x, h.y, 6);
            });
        }
    }

    // ── SPAWNING ───────────────────────────────────────────────────────────────
    _spawnTarget() {
        if (this._targets.length >= this.diff.maxTargets) return;
        const typeData = this.diff.pickTarget(TARGET_TYPES);
        const t = new Target(this, typeData, this.diff.speedMult);
        this._targets.push(t);
    }

    _spawnBoss() {
        if (this._boss || this._over) return;
        const data = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        this._boss = new BossTarget(this, data);
        this.audio.bossSpawn();
        this.fx.screenShake(12, 500);
        this.fx.flashPurple();
        this.fx.announce(`⚠ ${data.label} INCOMING!`, '#ff0000', 'BOSS ENCOUNTER');
    }

    // ── RANDOM EVENTS ─────────────────────────────────────────────────────────
    _triggerEvent() {
        if (this._eventActive || this._over) return;
        const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        this._eventActive = true;
        this._currentEvent = ev;
        this.audio.randomEvent();
        this.fx.announce(ev.label, '#ff6600', 'RANDOM EVENT!');

        switch (ev.id) {
            case 'usb_rain':
            case 'phish_storm': {
                // Burst-spawn 8-12 bad targets
                let count = 0;
                const iv = this.time.addEvent({
                    delay: 350, repeat: 10,
                    callback: () => {
                        const pool = TARGET_TYPES.filter(t => !t.isGood);
                        const td   = pool[Math.floor(Math.random() * pool.length)];
                        new Target(this, td, this.diff.speedMult * 1.4);
                        this._targets.push(new Target(this, td, this.diff.speedMult * 1.2));
                    }
                });
                break;
            }
            case 'popup_invasion': {
                const pool = TARGET_TYPES.filter(t => !t.isGood && t.id.includes('popup') || t.id.includes('fake'));
                for (let i = 0; i < 6; i++) {
                    this.time.delayedCall(i * 300, () => {
                        const td = pool[Math.floor(Math.random() * pool.length)] || TARGET_TYPES.find(t => !t.isGood);
                        this._targets.push(new Target(this, td, this.diff.speedMult * 1.1));
                    });
                }
                break;
            }
            case 'ddos_mode': {
                this.fx.announce('💥 DDoS MODE!', '#ff0000', 'OVERLOAD!');
                // Slow motion + tons of targets
                this.time.timeScale = 0.6;
                this.time.delayedCall(ev.duration, () => { this.time.timeScale = 1.0; });
                for (let i = 0; i < 14; i++) {
                    this.time.delayedCall(i * 200, () => {
                        const pool = TARGET_TYPES.filter(t => !t.isGood);
                        this._targets.push(new Target(this, pool[Math.floor(Math.random() * pool.length)], this.diff.speedMult));
                    });
                }
                break;
            }
            case 'lights_flicker': {
                let flickers = 0;
                const flick = this.time.addEvent({
                    delay: 120, repeat: 16,
                    callback: () => {
                        this.cameras.main.setAlpha(this.cameras.main.alpha < 0.5 ? 1 : 0.3);
                        flickers++;
                        if (flickers >= 16) this.cameras.main.setAlpha(1);
                    }
                });
                break;
            }
        }

        this.time.delayedCall(ev.duration, () => {
            this._eventActive = false;
            this._currentEvent = null;
        });
    }

    // ── FOCUS MODE ────────────────────────────────────────────────────────────
    _activateFocus() {
        if (this._focusActive) return;
        this._focusActive = true;
        this._focusTimer  = FOCUS_DURATION / 1000;
        this.score.activateFocus();
        this.audio.focusStart();
        this.fx.focusModeStart();
        this.crosshair.setFocus(true);
        this.hud.showFocusBanner(true);
        this.fx.announce('★ FOCUS MODE ACTIVATED ★', '#ff00ff', 'TIME SLOWS — GO!');
        // Slow time slightly
        this.time.timeScale = 0.7;
        this.tweens.timeScale = 0.7;
    }

    _deactivateFocus() {
        this._focusActive = false;
        this._focusTimer  = 0;
        this.score.deactivateFocus();
        this.fx.focusModeEnd();
        this.crosshair.setFocus(false);
        this.hud.showFocusBanner(false);
        this.time.timeScale = 1.0;
        this.tweens.timeScale = 1.0;
    }

    // ── PAUSE ─────────────────────────────────────────────────────────────────
    _togglePause() {
        this._paused = !this._paused;
        if (this._paused) {
            this.physics.pause();
            const W = 1280, H = 720;
            this._pauseOverlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setDepth(500);
            this._pauseTxt = this.add.text(W/2, H/2, '⏸ PAUSED\n[ESC to resume]', {
                fontFamily: '"Courier New", monospace',
                fontSize: '44px', fontStyle: 'bold', color: '#ff00ff',
                align: 'center',
                shadow: { blur: 20, color: '#ff00ff', fill: true },
            }).setOrigin(0.5).setDepth(501);
        } else {
            this._pauseOverlay?.destroy();
            this._pauseTxt?.destroy();
            this.physics.resume();
        }
    }

    _waveAnnounce() {
        this.fx.announce(`WAVE ${this.diff.wave} — HUNT BEGINS`, '#00ffff', 'IDENTIFY AND ELIMINATE THREATS');
    }

    // ── GAME OVER ─────────────────────────────────────────────────────────────
    _endGame() {
        this._over = true;
        if (this._focusActive) this._deactivateFocus();

        // Destroy remaining targets
        this._targets.forEach(t => { try { t.destroy(); } catch(e){} });
        this._boss?.destroy();

        // Save highscore
        const hs = parseInt(localStorage.getItem('cc_highscore') || '0');
        if (this.score.score > hs) {
            localStorage.setItem('cc_highscore', String(this.score.score));
        }

        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.time.delayedCall(700, () => {
            this.scene.start('GameOverScene', { summary: this.score.summary });
        });
    }

    // ── MAIN UPDATE ────────────────────────────────────────────────────────────
    update(time, delta) {
        if (this._over || this._paused) return;

        const dt = delta / 1000;

        // Timer
        this._timeLeft -= dt * (this.time.timeScale);
        if (this._timeLeft <= 0) {
            this._timeLeft = 0;
            this._endGame();
            return;
        }

        // Difficulty
        this.diff.tick(delta);

        // Wave announce on new wave
        if (this.diff.wave !== this._lastWave) {
            this._lastWave = this.diff.wave;
            if (this.diff.wave > 1) {
                this.fx.announce(`⚡ WAVE ${this.diff.wave} ⚡`, '#ffff00', `SPEED ×${this.diff.speedMult.toFixed(1)}`);
            }
        }

        // Focus mode timer
        if (this._focusActive) {
            this._focusTimer -= dt;
            if (this._focusTimer <= 0) this._deactivateFocus();
        }

        // Ammo system
        this.ammo.update();

        // Spawn targets
        this._spawnTimer -= delta;
        if (this._spawnTimer <= 0) {
            const burst = this._spawnBurst > 0 ? 2 : 1;
            for (let i = 0; i < burst; i++) this._spawnTarget();
            this._spawnTimer = this.diff.spawnInterval;
            if (this._spawnBurst > 0) this._spawnBurst--;
        }

        // Update targets
        this._targets = this._targets.filter(t => t.active);
        this._targets.forEach(t => t.update(time, delta));

        // Update boss
        if (this._boss) {
            if (!this._boss.active) { this._boss = null; }
            else this._boss.update(time, delta);
        }

        // Rain
        this._updateRain(dt);

        // Background lights
        this._updateBgLights(dt);

        // HUD
        this.hud.update(this._timeLeft);
    }

    _updateRain(dt) {
        const W = 1280, H = 720;
        this._rainG.clear();
        this._rain.forEach(r => {
            r.y += r.speed * dt;
            if (r.y > H) { r.y = -10; r.x = Math.random() * W; }
            this._rainG.fillStyle(0x00aaff, r.a);
            this._rainG.fillRect(r.x, r.y, 1, 6);
        });
    }
}
