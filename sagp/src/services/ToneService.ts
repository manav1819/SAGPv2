'use client';

/**
 * Generates simple phone-style tones (incoming ringtone, end-of-call beeps)
 * with the Web Audio API — no audio assets required.
 */
export class ToneService {
  private ctx: AudioContext | null = null;
  private ringTimer: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextCtor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AudioContextCtor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, startAt: number, durationSecs: number, gainPeak = 0.12): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(gainPeak, startAt + 0.02);
    gain.gain.setValueAtTime(gainPeak, Math.max(startAt + 0.02, startAt + durationSecs - 0.03));
    gain.gain.linearRampToValueAtTime(0, startAt + durationSecs);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + durationSecs + 0.02);
  }

  /** Classic dual-tone "brrring... brrring..." ring, repeating until stopped. */
  startRingtone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    this.stopRingtone();

    const playPulse = () => {
      const now = this.getContext()?.currentTime;
      if (now === undefined) return;
      this.tone(440, now, 0.4);
      this.tone(480, now, 0.4);
      this.tone(440, now + 0.6, 0.4);
      this.tone(480, now + 0.6, 0.4);
    };
    playPulse();
    this.ringTimer = setInterval(playPulse, 3000);
  }

  stopRingtone(): void {
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
  }

  /** Three short beeps signalling the call has ended. */
  playEndTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(600, now, 0.15, 0.15);
    this.tone(600, now + 0.22, 0.15, 0.15);
    this.tone(600, now + 0.44, 0.15, 0.15);
  }

  destroy(): void {
    this.stopRingtone();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.ctx = null;
  }
}
