'use client';

import type { SubtitleSegment } from '@/types/game';

type SubtitleCallback = (text: string | null) => void;
type TimeCallback = (t: number) => void;

export class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private subtitles: SubtitleSegment[] = [];
  private rafId: number | null = null;
  private onSubtitle: SubtitleCallback;
  private onTime: TimeCallback;

  constructor(onSubtitle: SubtitleCallback, onTime: TimeCallback) {
    this.onSubtitle = onSubtitle;
    this.onTime = onTime;
  }

  load(url: string, subtitles: SubtitleSegment[]): void {
    this.destroy();
    this.subtitles = subtitles;
    this.audio = new Audio(url);
    this.audio.preload = 'auto';
  }

  async play(): Promise<void> {
    if (!this.audio) return;
    await this.audio.play();
    this.startRaf();
  }

  pause(): void {
    this.audio?.pause();
    this.stopRaf();
  }

  resume(): void {
    this.audio?.play();
    this.startRaf();
  }

  seek(seconds: number): void {
    if (this.audio) this.audio.currentTime = seconds;
  }

  get currentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  get duration(): number {
    return this.audio?.duration ?? 0;
  }

  destroy(): void {
    this.stopRaf();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  private startRaf(): void {
    const tick = () => {
      if (!this.audio) return;
      const t = this.audio.currentTime;
      this.onTime(t);

      const active = this.subtitles.find((s) => t >= s.start && t < s.end);
      this.onSubtitle(active?.text ?? null);

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
