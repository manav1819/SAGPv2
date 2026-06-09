// =============================================================================
// AmmoSystem — magazine, reload state, auto-reload
// =============================================================================
import { AMMO_MAX, RELOAD_TIME } from '../config.js';

export class AmmoSystem {
    constructor() { this.reset(); }

    reset() {
        this.ammo       = AMMO_MAX;
        this.maxAmmo    = AMMO_MAX;
        this.reloading  = false;
        this.reloadPct  = 0;       // 0..1
        this._reloadStart = 0;
        this.onReloadComplete = null;
        this.onReloadStart    = null;
        this.onEmpty          = null;
    }

    canShoot() { return this.ammo > 0 && !this.reloading; }

    shoot() {
        if (!this.canShoot()) return false;
        this.ammo--;
        if (this.ammo === 0) {
            if (this.onEmpty) this.onEmpty();
            this.startReload();
        }
        return true;
    }

    startReload() {
        if (this.reloading || this.ammo === this.maxAmmo) return;
        this.reloading    = true;
        this._reloadStart = Date.now();
        this.reloadPct    = 0;
        if (this.onReloadStart) this.onReloadStart();
    }

    update() {
        if (!this.reloading) return;
        const elapsed = Date.now() - this._reloadStart;
        this.reloadPct = Math.min(1, elapsed / RELOAD_TIME);
        if (this.reloadPct >= 1) {
            this.ammo      = this.maxAmmo;
            this.reloading = false;
            this.reloadPct = 0;
            if (this.onReloadComplete) this.onReloadComplete();
        }
    }

    get display() { return `${this.ammo} / ${this.maxAmmo}`; }
}
