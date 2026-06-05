// =============================================================================
// ScoreSystem — tracks score, combo, accuracy, grade
// =============================================================================
import { SCORE_HIT_BAD, SCORE_HEADSHOT, SCORE_MISS_PENALTY,
         SCORE_FRIENDLY_FIRE, SCORE_TIMEOUT, FOCUS_COMBO, GRADES } from '../config.js';

export class ScoreSystem {
    constructor() { this.reset(); }

    reset() {
        this.score        = 0;
        this.combo        = 1;           // current multiplier
        this.comboCount   = 0;           // consecutive hits
        this.shotsFired   = 0;
        this.shotsHit     = 0;           // hits on BAD targets
        this.friendlyFire = 0;           // hits on GOOD targets
        this.threatsKilled= 0;
        this.focusReady   = false;
        this.inFocus      = false;
        this._lastHitTime = 0;
        this.events       = [];          // for external listeners
    }

    // ── EVENTS ──────────────────────────────────────────────────────────────
    on(evt, fn) { this.events.push({ evt, fn }); }
    emit(evt, data) { this.events.filter(e => e.evt === evt).forEach(e => e.fn(data)); }

    // ── SCORING ──────────────────────────────────────────────────────────────
    /** Called when player hits a BAD target */
    hitThreat(isHeadshot = false) {
        const base = isHeadshot ? SCORE_HEADSHOT : SCORE_HIT_BAD;
        const gained = base * this.combo;
        this.score = Math.max(0, this.score + gained);
        this.shotsHit++;
        this.threatsKilled++;
        this.comboCount++;
        this.combo = Math.min(15, 1 + Math.floor(this.comboCount / 2));
        this._lastHitTime = Date.now();
        if (this.comboCount >= FOCUS_COMBO && !this.inFocus) {
            this.focusReady = true;
            this.emit('focusReady', null);
        }
        this.emit('hit', { gained, combo: this.combo, isHeadshot });
        return gained;
    }

    /** Called when player hits a GOOD target */
    hitFriendly() {
        this.score = Math.max(0, this.score + SCORE_FRIENDLY_FIRE);
        this.friendlyFire++;
        this.breakCombo();
        this.emit('friendlyFire', { penalty: SCORE_FRIENDLY_FIRE });
        return SCORE_FRIENDLY_FIRE;
    }

    /** Called on a missed shot */
    miss() {
        this.score = Math.max(0, this.score + SCORE_MISS_PENALTY);
        this.shotsFired++;
        this.breakCombo();
        this.emit('miss', { penalty: SCORE_MISS_PENALTY });
    }

    /** Called when player shoots (regardless of hit) */
    shot() { this.shotsFired++; }

    /** Threat escaped off screen */
    threatEscaped() {
        this.score = Math.max(0, this.score + SCORE_TIMEOUT);
        this.breakCombo();
    }

    breakCombo() {
        this.comboCount = 0;
        this.combo = 1;
        this.inFocus = false;
        this.focusReady = false;
        this.emit('comboBreak', null);
    }

    activateFocus() {
        this.inFocus = true;
        this.focusReady = false;
        this.emit('focusActive', null);
    }

    deactivateFocus() {
        this.inFocus = false;
        this.emit('focusEnd', null);
    }

    get accuracy() {
        return this.shotsFired === 0 ? 100
             : Math.round((this.shotsHit / this.shotsFired) * 100);
    }

    get grade() {
        const acc = this.accuracy;
        for (const g of GRADES) {
            if (acc >= g.minAcc && this.score >= g.minScore) return g;
        }
        return GRADES[GRADES.length - 1];
    }

    get summary() {
        return {
            score:         this.score,
            combo:         this.combo,
            accuracy:      this.accuracy,
            shotsFired:    this.shotsFired,
            shotsHit:      this.shotsHit,
            friendlyFire:  this.friendlyFire,
            threatsKilled: this.threatsKilled,
            grade:         this.grade,
        };
    }
}
