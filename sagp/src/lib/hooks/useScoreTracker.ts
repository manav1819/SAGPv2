'use client';

import { useGameStore } from '@/lib/stores/useGameStore';
import { RANK_THRESHOLDS } from '@/lib/stores/useGameStore';
import type { PlayerRank } from '@/types/game';

export function useScoreTracker() {
  const score = useGameStore((s) => s.score);
  const getCompositeScore = useGameStore((s) => s.getCompositeScore);

  const composite = getCompositeScore();

  const nextRankThreshold = RANK_THRESHOLDS.find((r) => r.minXP > score.totalXP);
  const currentRankEntry = [...RANK_THRESHOLDS].reverse().find((r) => score.totalXP >= r.minXP);
  const currentRank: PlayerRank = currentRankEntry?.rank ?? 'Intern';

  const xpToNext = nextRankThreshold
    ? nextRankThreshold.minXP - score.totalXP
    : null;

  const rankProgress = nextRankThreshold && currentRankEntry
    ? Math.round(
        ((score.totalXP - currentRankEntry.minXP) /
          (nextRankThreshold.minXP - currentRankEntry.minXP)) * 100,
      )
    : 100;

  return {
    score,
    composite,
    currentRank,
    xpToNext,
    rankProgress,
    hasLeaks: score.leaksCommitted.length > 0,
    isPerfectSoFar: score.leaksCommitted.length === 0 && composite >= 80,
  };
}
