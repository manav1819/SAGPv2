'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp } from 'lucide-react';
import { useScoreTracker } from '@/lib/hooks/useScoreTracker';
import { RANK_THRESHOLDS } from '@/lib/stores/useGameStore';

export function PlayerProfile() {
  const { score, currentRank, rankProgress, xpToNext } = useScoreTracker();

  const nextRank = RANK_THRESHOLDS.find((r) => r.minXP > score.totalXP);

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header">
        <p className="sagp-eyebrow">AGENT PROFILE</p>
      </div>
      <div className="sagp-card-content">
        <div className="flex items-center gap-3 mb-4">
          <div className="sagp-icon-tile" style={{ width: 52, height: 52 }}>
            <Shield size={24} style={{ color: 'var(--sagp-cyan)' }} />
          </div>
          <div>
            <p className="sagp-heading-font text-lg font-bold text-white">{currentRank}</p>
            <p className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>
              {score.totalXP.toLocaleString()} XP total
            </p>
          </div>
        </div>

        {/* Rank progress */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>
              Progress to {nextRank?.rank ?? 'MAX'}
            </span>
            <span className="sagp-mono text-xs" style={{ color: 'var(--sagp-cyan)' }}>
              {rankProgress}%
            </span>
          </div>
          <div className="sagp-progress">
            <motion.div
              className="sagp-progress-bar"
              style={{ '--progress': `${rankProgress}%` } as React.CSSProperties}
              animate={{ width: `${rankProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          {xpToNext && (
            <p className="mt-1 text-xs" style={{ color: 'var(--sagp-text-soft)' }}>
              <TrendingUp size={10} className="inline mr-1" />
              {xpToNext.toLocaleString()} XP to next rank
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="sagp-grid-2 gap-2">
          <div className="sagp-cyan-row text-center">
            <p className="sagp-stat-value text-lg">{score.redFlagsIdentified}</p>
            <p className="sagp-stat-label text-[10px]">Red Flags</p>
          </div>
          <div className="sagp-cyan-row text-center">
            <p className="sagp-stat-value text-lg">{score.cluesFound.length}</p>
            <p className="sagp-stat-label text-[10px]">Clues Found</p>
          </div>
        </div>
      </div>
    </div>
  );
}
