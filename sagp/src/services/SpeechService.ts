'use client';

type SpeechEndCallback = () => void;

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  /** Case-insensitive substring match against available voice names (e.g. "male", "female", "UK"). */
  voiceNameHint?: string;
}

/** Splits text into sentence-ish chunks so speech gets natural pauses instead of one flat run-on utterance. */
function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

/** Ranks voices so we prefer higher-fidelity, more natural-sounding ones over robotic default voices. */
function voiceQualityScore(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let score = 0;
  if (!v.localService) score += 3; // cloud/network voices are almost always higher fidelity
  if (/natural|neural|enhanced|premium|studio/.test(name)) score += 5;
  if (/online/.test(name)) score += 2;
  if (v.lang.toLowerCase().startsWith('en')) score += 1;
  return score;
}

/**
 * Thin wrapper around the browser's Web Speech API (SpeechSynthesis), used to
 * simulate a spoken phone call when a scenario's dialogue node has no
 * pre-recorded `audioUrl` asset. Keeps calls from being silent/text-only.
 *
 * Speaks sentence-by-sentence (with brief pauses and slight rate/pitch
 * jitter) rather than one flat utterance, and picks the best available
 * system voice, so it sounds less like a robot reading a script.
 */
export class SpeechService {
  private onEnd: SpeechEndCallback;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: string[] = [];
  private stopped = true;

  constructor(onEnd: SpeechEndCallback) {
    this.onEnd = onEnd;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, opts: SpeakOptions = {}): void {
    if (!SpeechService.isSupported() || !text) return;
    this.cancel();
    this.stopped = false;
    this.queue = splitIntoSentences(text);
    this.speakNextChunk(opts);
  }

  pause(): void {
    if (SpeechService.isSupported()) window.speechSynthesis.pause();
  }

  resume(): void {
    if (SpeechService.isSupported()) window.speechSynthesis.resume();
  }

  cancel(): void {
    this.stopped = true;
    this.queue = [];
    if (this.currentUtterance) {
      // Detach handlers first — some browsers still fire a queued 'end'/'error'
      // event for an utterance after cancel(), which would otherwise resurrect
      // playback state (this was the cause of speech continuing post-call).
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (SpeechService.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  destroy(): void {
    this.cancel();
  }

  private speakNextChunk(opts: SpeakOptions): void {
    if (this.stopped) return;
    const sentence = this.queue.shift();
    if (!sentence) {
      this.currentUtterance = null;
      this.onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    // Small randomized jitter per sentence — a flat, identical rate/pitch on
    // every line is a big part of what makes TTS sound robotic.
    utterance.rate = (opts.rate ?? 1) * (0.96 + Math.random() * 0.08);
    utterance.pitch = (opts.pitch ?? 1) * (0.94 + Math.random() * 0.12);

    const voice = this.pickVoice(opts.voiceNameHint);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (this.stopped || this.currentUtterance !== utterance) return;
      // Brief natural pause between sentences instead of speaking straight
      // through.
      window.setTimeout(() => this.speakNextChunk(opts), 110);
    };
    utterance.onerror = () => {
      if (this.stopped || this.currentUtterance !== utterance) return;
      this.speakNextChunk(opts);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private pickVoice(hint?: string): SpeechSynthesisVoice | undefined {
    if (!SpeechService.isSupported()) return undefined;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return undefined;

    const ranked = [...voices].sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a));
    if (hint) {
      const h = hint.toLowerCase();
      const hinted = ranked.filter((v) => v.name.toLowerCase().includes(h));
      if (hinted.length) return hinted[0];
    }
    return ranked[0];
  }
}
