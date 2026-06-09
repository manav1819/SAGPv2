'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '@/services/AudioManager';
import { useGameStore } from '@/lib/stores/useGameStore';
import type { SubtitleSegment } from '@/types/game';

export function useAudio() {
  const { setAudioTrack, setActiveSubtitle, setAudioTime } = useGameStore();
  const managerRef = useRef<AudioManager | null>(null);

  useEffect(() => {
    managerRef.current = new AudioManager(
      (text) => setActiveSubtitle(text),
      (t) => setAudioTime(t),
    );
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAndPlay = useCallback(
    async (url: string, subtitles: SubtitleSegment[], scenarioId: string, nodeId: string) => {
      const mgr = managerRef.current;
      if (!mgr) return;
      mgr.load(url, subtitles);
      setAudioTrack({ url, scenarioId, nodeId, playbackState: 'loading', currentTimeSecs: 0 });
      try {
        await mgr.play();
        setAudioTrack({ playbackState: 'playing' });
      } catch {
        setAudioTrack({ playbackState: 'error' });
      }
    },
    [setAudioTrack],
  );

  const pause = useCallback(() => {
    managerRef.current?.pause();
    setAudioTrack({ playbackState: 'paused' });
  }, [setAudioTrack]);

  const resume = useCallback(() => {
    managerRef.current?.resume();
    setAudioTrack({ playbackState: 'playing' });
  }, [setAudioTrack]);

  return { loadAndPlay, pause, resume };
}
