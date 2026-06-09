'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Search, Zap, Clock } from 'lucide-react';
import { useScoreState, useCallState } from '@/lib/stores/useGameStore';
import { useScoreTracker } from '@/lib/hooks/useScoreTracker';

const CATEGORIES = [
  { key: 'verification' as const, label: 'Verify', icon: <Shield size={12} />, color: 'var(--sagp-cyan)' },
  { key: 'threatDetection' as const, label: 'Detect', icon: <Eye size={12} />, color: 'var(--sagp-purple)' },
  { key: 'informationProtection' as const, label: 'Protect', icon: <Lock size={12} />, color: 'var(--sagp-green)' },
  { key: 'investigation' as const, label: 'Investigate', icon: <Search size={12} />, color: 'var(--sagp-warning)' },
  { key: 'decision' as const, label: 'Decide', icon: <Zap size={12} />, color: 'var(--sagp-danger)' },
];

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ScoreHUD() {
  const score = useScoreState();
  const call = useCallState();
  const { composite, currentRank } = useScoreTracker();

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header">
        <p className="sagp-eyebrow">MISSION STATUS</p>
      </div>
      <div className="sagp-card-content space-y-3">
        {/* XP + Rank row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>TOTAL XP</p>
            <motion.p
              key={score.totalXP}
              initial={{ scale: 1.2, color: '#00f5ff' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="sagp-heading-font text-2xl font-bold"
            >
              {score.totalXP.toLocaleString()}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>RANK</p>
            <p className="sagp-mono text-sm font-bold" style={{ color: 'var(--sagp-cyan)' }}>{currentRank}</p>
          </div>
          {call.status === 'active' && (
            <div className="text-right">
              <p className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>
                <Clock size={10} className="inline mr-1" />TIME
              </p>
              <p className="sagp-mono text-sm font-bold" style={{ color: 'var(--sagp-warning)' }}>
                {fmtTime(call.elapsedSeconds)}
              </p>
            </div>
          )}
        </div>

        {/* Composite score */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>COMPOSITE</span>
            <span className="sagp-mono text-xs font-bold" style={{ color: 'var(--sagp-cyan)' }}>{composite}%</span>
          </div>
          <div className="sagp-progress">
            <motion.div
              className="sagp-progress-bar"
              style={{ '--progress': `${composite}%` } as React.CSSProperties}
              animate={{ width: `${composite}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Per-category bars */}
        <div className="space-y-2">
          {CATEGORIES.map(({ key, label, icon, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1 sagp-mono text-[10px] uppercase" style={{ color }}>
                  {icon} {label}
                </span>
                <span className="sagp-mono text-[10px]" style={{ color }}>{score.categories[key]}</span>
              </div>
              <div className="h-1.5 rounded overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}22` }}>
                <motion.div
                  className="h-full rounded"
                  style={{ background: color }}
                  animate={{ width: `${score.categories[key]}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Leaks warning */}
        {score.leaksCommitted.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sagp-error-box text-xs"
          >
            ⚠ {score.leaksCommitted.length} information leak{score.leaksCommitted.length > 1 ? 's' : ''} recorded
          </motion.div>
        )}
      </div>
    </div>
  );
}
