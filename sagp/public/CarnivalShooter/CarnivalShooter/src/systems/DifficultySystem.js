// =============================================================================
// DifficultySystem — wave progression, spawn rate, speed scaling
// =============================================================================
import { ROUND_DURATION } from '../config.js';

export class DifficultySystem {
    constructor() { this.reset(); }

    reset() {
        this.wave          = 1;
        this.elapsed       = 0;      // seconds elapsed in round
        this.spawnInterval = 2200;   // ms between target spawns (decreases)
        this.speedMult     = 1.0;    // target speed multiplier
        this.maxTargets    = 6;      // max simultaneous targets on screen
    }

    /** Called every game update tick with delta in ms */
    tick(deltaMs) {
        this.elapsed += deltaMs / 1000;
        // Recalculate difficulty based on elapsed time
        const pct = Math.min(1, this.elapsed / ROUND_DURATION);
        this.wave          = 1 + Math.floor(pct * 5);         // waves 1–6
        this.spawnInterval = Math.max(700, 2200 - pct * 1500); // 2200 → 700 ms
        this.speedMult     = 1 + pct * 1.8;                   // 1x → 2.8x
        this.maxTargets    = 6 + Math.floor(pct * 8);         // 6 → 14
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
