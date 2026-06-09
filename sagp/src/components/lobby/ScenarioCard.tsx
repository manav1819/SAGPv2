'use client';

import { motion } from 'framer-motion';
import { Clock, ChevronRight, Lock, Star } from 'lucide-react';
import type { Scenario } from '@/types/game';

interface Props {
  scenario: Scenario;
  onPlay: (id: string) => void;
  bestScore?: number;
  isLocked?: boolean;
  index?: number;
}

const DIFFICULTY_COLORS = {
  Easy: 'var(--sagp-green)',
  Medium: 'var(--sagp-warning)',
  Hard: 'var(--sagp-danger)',
};

const TECHNIQUE_LABELS: Record<string, string> = {
  authority_bias: 'Authority',
  urgency: 'Urgency',
  fear: 'Fear',
  scarcity: 'Scarcity',
  reciprocity: 'Reciprocity',
  trust_exploitation: 'Trust',
  familiarity: 'Familiarity',
  curiosity: 'Curiosity',
  pressure_tactics: 'Pressure',
  impersonation: 'Impersonation',
};

export function ScenarioCard({ scenario, onPlay, bestScore, isLocked, index = 0 }: Props) {
  const diffColor = DIFFICULTY_COLORS[scenario.difficulty];
  const mins = Math.ceil(scenario.estimatedDurationSecs / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={!isLocked ? { y: -4, borderColor: 'rgba(0,245,255,0.55)' } : undefined}
      className="sagp-neon-card sagp-module-card-link cursor-pointer"
      onClick={() => !isLocked && onPlay(scenario.id)}
      style={{ display: 'block', position: 'relative', opacity: isLocked ? 0.6 : 1 }}
    >
      <div className="sagp-card-content">
        {/* Top row */}
        <div className="sagp-module-card-top">
          <div className="sagp-icon-tile" style={{ borderColor: `${diffColor}40`, background: `${diffColor}10`, color: diffColor }}>
            <span style={{ fontSize: 20 }}>📞</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="sagp-badge" style={{ borderColor: `${diffColor}50`, color: diffColor }}>
              {scenario.difficulty}
            </span>
            {isLocked && <Lock size={14} style={{ color: 'var(--sagp-text-soft)' }} />}
          </div>
        </div>

        {/* Meta */}
        <div className="sagp-module-card-meta">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {mins} min
          </span>
          <span style={{ color: 'var(--sagp-cyan)' }}>
            ×{scenario.xpMultiplier} XP
          </span>
        </div>

        {/* Title + description */}
        <h3 className="sagp-card-title mb-2">{scenario.title}</h3>
        <p className="sagp-card-description sagp-game-card-text">{scenario.description}</p>

        {/* Technique tags */}
        <div className="sagp-module-tag-row">
          {scenario.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="sagp-badge sagp-badge-purple text-[9px]">
              {TECHNIQUE_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>

        {/* Best score */}
        {bestScore !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: 'var(--sagp-warning)' }}>
            <Star size={11} /> Best: {bestScore.toLocaleString()} XP
          </div>
        )}

        {/* CTA */}
        {!isLocked && (
          <div className="sagp-enter-module mt-4">
            <ChevronRight size={14} />
            LAUNCH SCENARIO
          </div>
        )}
      </div>
    </motion.div>
  );
}
