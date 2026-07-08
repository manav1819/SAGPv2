'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Web Speech API type shims (not part of standard TS DOM lib)
export interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
}
export interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: { length: number; [i: number]: ISpeechRecognitionResult };
}
export interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

type TranscriptCallback = (final: string, interim: string) => void;
type ErrorCallback = (err: string) => void;

function createRecognition(): ISpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const Ctor = w['SpeechRecognition'] || w['webkitSpeechRecognition'];
  if (!Ctor) return null;
  return new Ctor() as ISpeechRecognition;
}

export class VoiceRecognitionService {
  private recognition: ISpeechRecognition | null = null;
  private onTranscript: TranscriptCallback;
  private onError: ErrorCallback;

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return Boolean(w['SpeechRecognition'] || w['webkitSpeechRecognition']);
  }

  constructor(onTranscript: TranscriptCallback, onError: ErrorCallback) {
    this.onTranscript = onTranscript;
    this.onError = onError;
  }

  start(): void {
    if (!VoiceRecognitionService.isSupported()) {
      this.onError('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition = createRecognition();
    if (!this.recognition) {
      this.onError('Failed to initialise speech recognition.');
      return;
    }

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-GB';

    this.recognition.onresult = (e: ISpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      this.onTranscript(finalText, interimText);
    };

    this.recognition.onerror = (e: ISpeechRecognitionErrorEvent) => {
      this.onError(e.error);
    };

    this.recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }
}
