// =============================================================================
// AudioManager — loads WAV assets + Web Audio fallback synth effects
// =============================================================================
export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.muted = false;
        this.sfxVol = 0.7;
        this.music = null;
    }

    /** Call inside scene preload() — loads all audio assets */
    static preloadAssets(scene) {
        scene.load.audio('sfx_shoot',       'assets/Gun/762x39 Single WAV.wav');
        scene.load.audio('sfx_reload',      'assets/Gun/Reload/AR Reload Full WAV.wav');
        scene.load.audio('sfx_empty',       'assets/Interface_Bleeps_Wav/Denied_01.wav');
        scene.load.audio('sfx_hit_bad',     'assets/Interface_Bleeps_Wav/Execute_01.wav');
        scene.load.audio('sfx_hit_good',    'assets/Interface_Bleeps_Wav/Denied_02.wav');
        scene.load.audio('sfx_combo',       'assets/Interface_Bleeps_Wav/Confirm_01.wav');
        scene.load.audio('sfx_focus_start', 'assets/Interface_Bleeps_Wav/Complete_01.wav');
        scene.load.audio('sfx_boss_spawn',  'assets/MenuSFX/Miscellaneous/misc-cinematic-buildup.wav');
        scene.load.audio('sfx_boss_hit',    'assets/Interface_Bleeps_Wav/Execute_02.wav');
        scene.load.audio('sfx_boss_die',    'assets/MenuSFX/Miscellaneous/misc-explode-retro-1.wav');
        scene.load.audio('sfx_event',       'assets/MenuSFX/Miscellaneous/misc-bassdrop.wav');
        scene.load.audio('sfx_click',       'assets/Interface_Bleeps_Wav/Click_01.wav');
        scene.load.audio('sfx_confirm',     'assets/Interface_Bleeps_Wav/Confirm_03.wav');
        scene.load.audio('sfx_denied',      'assets/Interface_Bleeps_Wav/Denied_03.wav');
    }

    play(key, cfg = {}) {
        if (this.muted) return;
        try {
            this.scene.sound.play(key, { volume: this.sfxVol, ...cfg });
        } catch (e) { /* audio not loaded — skip */ }
    }

    shoot()       { this.play('sfx_shoot',       { volume: 0.5 }); }
    emptyClick()  { this.play('sfx_empty',        { volume: 0.6 }); }
    reload()      { this.play('sfx_reload',       { volume: 0.55 }); }
    hitBad()      { this.play('sfx_hit_bad',      { volume: 0.65 }); }
    hitGood()     { this.play('sfx_hit_good',     { volume: 0.8 }); }
    combo(n)      { this.play('sfx_combo',        { volume: Math.min(1, 0.3 + n * 0.07), detune: n * 50 }); }
    focusStart()  { this.play('sfx_focus_start',  { volume: 0.8 }); }
    bossSpawn()   { this.play('sfx_boss_spawn',   { volume: 0.7 }); }
    bossHit()     { this.play('sfx_boss_hit',     { volume: 0.6 }); }
    bossDie()     { this.play('sfx_boss_die',     { volume: 0.9 }); }
    randomEvent() { this.play('sfx_event',        { volume: 0.7 }); }
    click()       { this.play('sfx_click',        { volume: 0.5 }); }
    confirm()     { this.play('sfx_confirm',      { volume: 0.6 }); }
    denied()      { this.play('sfx_denied',       { volume: 0.6 }); }

    toggleMute() {
        this.muted = !this.muted;
        this.scene.sound.mute = this.muted;
        return this.muted;
    }
}
