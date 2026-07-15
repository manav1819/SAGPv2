// =============================================================================
// DifficultySystem — wave progression, spawn rate, speed scaling
//
// LEVELS — three difficulty presets selected at menu time (see MenuScene).
// Each preset defines the [start, end] range for maxTargets, spawnInterval,
// and speedMult; tick() interpolates within that range over ROUND_DURATION,
// exactly like the original single curve did. 'medium' matches the original
// (pre-level-select) numbers so existing balance/grading is unchanged.
// =============================================================================
import { ROUND_DURATION } from '../config.js';

export const LEVEL_IDS = ['easy', 'medium', 'legendary'];

const LEVEL_PRESETS = {
    easy: {
        maxTargetsRange:    [4, 8],
        spawnIntervalRange: [2600, 1400],  // ms — [start, end], decreases over the round
        speedMultRange:     [0.7, 1.2],
    },
    medium: {
        maxTargetsRange:    [6, 14],
        spawnIntervalRange: [2200, 700],
        speedMultRange:     [1.0, 2.8],
    },
    legendary: {
        maxTargetsRange:    [10, 20],
        spawnIntervalRange: [1400, 450],
        speedMultRange:     [1.6, 3.6],
    },
};

export class DifficultySystem {
    constructor(level = 'medium') {
        this.level  = LEVEL_PRESETS[level] ? level : 'medium';
        this.preset = LEVEL_PRESETS[this.level];
        this.reset();
    }

    reset() {
        this.wave          = 1;
        this.elapsed       = 0;      // seconds elapsed in round
        this.spawnInterval = this.preset.spawnIntervalRange[0];
        this.speedMult     = this.preset.speedMultRange[0];
        this.maxTargets    = this.preset.maxTargetsRange[0];
    }

    /** Called every game update tick with delta in ms */
    tick(deltaMs) {
        this.elapsed += deltaMs / 1000;
        // Recalculate difficulty based on elapsed time, within this level's ranges
        const pct = Math.min(1, this.elapsed / ROUND_DURATION);
        const p   = this.preset;
        this.wave          = 1 + Math.floor(pct * 5);         // waves 1–6 (all levels)
        this.spawnInterval = Math.max(
            p.spawnIntervalRange[1],
            p.spawnIntervalRange[0] - pct * (p.spawnIntervalRange[0] - p.spawnIntervalRange[1])
        );
        this.speedMult  = p.speedMultRange[0] + pct * (p.speedMultRange[1] - p.speedMultRange[0]);
        this.maxTargets = Math.floor(
            p.maxTargetsRange[0] + pct * (p.maxTargetsRange[1] - p.maxTargetsRange[0])
        );
    }

    /** Display label for the current level, e.g. for HUD/results screens. */
    get levelLabel() {
        return { easy: 'EASY', medium: 'MEDIUM', legendary: 'LEGENDARY' }[this.level];
    }

    /** Weighted random selection from TARGET_TYPES filtered for current wave */
    pickTarget(targetTypes) {
        const pool = targetTypes.map(t => ({ t, w: t.weight }));
        const total = pool.reduce((s, e) => s + e.w, 0);
        let r = Math.random() * total;
        for (const e of pool) { r -= e.w; if (r <= 0) return e.t; }
        return pool[0].t;
    }

    /** Speed for a given target base speed */
    applySpeed(baseSpeed) {
        return baseSpeed * this.speedMult;
    }

    get label() { return `WAVE ${this.wave}`; }
}
