'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '@/services/AudioManager';
import { SpeechService } from '@/services/SpeechService';
import { useGameStore } from '@/lib/stores/useGameStore';
import type { DialogueNode, Speaker, SubtitleSegment } from '@/types/game';

// Rough per-speaker voice hints so the attacker and system voices don't
// sound identical when the browser has multiple TTS voices installed.
const VOICE_HINTS: Partial<Record<Speaker, string>> = {
  attacker: 'male',
  system: 'female',
};

export function useAudio() {
  const { setAudioTrack, setActiveSubtitle, setAudioTime } = useGameStore();
  const managerRef = useRef<AudioManager | null>(null);
  const speechRef = useRef<SpeechService | null>(null);

  useEffect(() => {
    managerRef.current = new AudioManager(
      (text) => setActiveSubtitle(text),
      (t) => setAudioTime(t),
    );
    speechRef.current = new SpeechService(() => {
      setActiveSubtitle(null);
      setAudioTrack({ playbackState: 'ended' });
    });
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
      speechRef.current?.destroy();
      speechRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAndPlay = useCallback(
    async (url: string, subtitles: SubtitleSegment[], scenarioId: string, nodeId: string) => {
      const mgr = managerRef.current;
      if (!mgr) return;
      speechRef.current?.cancel();
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

  /**
   * Speaks a dialogue node's text aloud via the Web Speech API. This is the
   * fallback "voice" for a call when the scenario node has no pre-recorded
   * `audioUrl` asset — without it, calls only ever show static text.
   */
  const speakNode = useCallback(
    (node: DialogueNode, scenarioId: string) => {
      const speech = speechRef.current;
      if (!speech || !SpeechService.isSupported() || !node.text) return;
      managerRef.current?.destroy();
      setAudioTrack({
        url: '', scenarioId, nodeId: node.id,
        playbackState: 'playing', currentTimeSecs: 0, durationSecs: 0,
      });
      setActiveSubtitle(node.text);
      speech.speak(node.text, { voiceNameHint: VOICE_HINTS[node.speaker] });
    },
    [setAudioTrack, setActiveSubtitle],
  );

  /**
   * Plays a dialogue node's spoken line, preferring a pre-recorded audio
   * asset (`node.audioUrl`) when present and falling back to text-to-speech.
   */
  const playNode = useCallback(
    (node: DialogueNode | null, scenarioId: string) => {
      if (!node) return;
      if (node.audioUrl) {
        void loadAndPlay(node.audioUrl, node.subtitles, scenarioId, node.id);
      } else {
        speakNode(node, scenarioId);
      }
    },
    [loadAndPlay, speakNode],
  );

  const pause = useCallback(() => {
    managerRef.current?.pause();
    speechRef.current?.pause();
    setAudioTrack({ playbackState: 'paused' });
  }, [setAudioTrack]);

  const resume = useCallback(() => {
    managerRef.current?.resume();
    speechRef.current?.resume();
    setAudioTrack({ playbackState: 'playing' });
  }, [setAudioTrack]);

  const stop = useCallback(() => {
    managerRef.current?.destroy();
    speechRef.current?.cancel();
    setActiveSubtitle(null);
    setAudioTrack({ playbackState: 'idle' });
  }, [setAudioTrack, setActiveSubtitle]);

  return { loadAndPlay, playNode, pause, resume, stop };
}
