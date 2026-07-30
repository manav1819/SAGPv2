'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ToneService } from '@/services/ToneService';

/** React hook exposing the phone-style ringtone / end-of-call beep synthesizer. */
export function useCallTones() {
  const ref = useRef<ToneService | null>(null);

  useEffect(() => {
    ref.current = new ToneService();
    return () => {
      ref.current?.destroy();
      ref.current = null;
    };
  }, []);

  const startRingtone = useCallback(() => ref.current?.startRingtone(), []);
  const stopRingtone = useCallback(() => ref.current?.stopRingtone(), []);
  const playEndTone = useCallback(() => ref.current?.playEndTone(), []);

  return { startRingtone, stopRingtone, playEndTone };
}
