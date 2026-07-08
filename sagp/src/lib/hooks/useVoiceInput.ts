'use client';

import { useEffect, useRef, useCallback } from 'react';
import { VoiceRecognitionService } from '@/services/VoiceRecognition';
import { useGameStore } from '@/lib/stores/useGameStore';

export function useVoiceInput() {
  const { setVoiceState } = useGameStore();
  const svcRef = useRef<VoiceRecognitionService | null>(null);

  useEffect(() => {
    const available = VoiceRecognitionService.isSupported();
    setVoiceState({ available });
    return () => { svcRef.current?.stop(); };
  }, [setVoiceState]);

  const startListening = useCallback(() => {
    svcRef.current = new VoiceRecognitionService(
      (final, interim) => setVoiceState({ transcript: final, interimTranscript: interim, listening: true }),
      (err) => setVoiceState({ error: err, listening: false }),
    );
    svcRef.current.start();
    setVoiceState({ listening: true, transcript: '', interimTranscript: '', error: null });
  }, [setVoiceState]);

  const stopListening = useCallback(() => {
    svcRef.current?.stop();
    setVoiceState({ listening: false });
  }, [setVoiceState]);

  return { startListening, stopListening };
}
