'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, AlertCircle } from 'lucide-react';
import { useAudioState, useTerminalConfig } from '@/lib/stores/useGameStore';
import type { DialogueNode } from '@/types/game';

interface Props {
  node: DialogueNode | null;
}

const SPEAKER_CONFIG = {
  attacker: {
    label: 'CALLER',
    icon: <Bot size={16} />,
    borderColor: 'rgba(255,59,129,0.4)',
    bg: 'rgba(255,59,129,0.06)',
    color: 'var(--sagp-danger)',
  },
  player: {
    label: 'YOU',
    icon: <User size={16} />,
    borderColor: 'rgba(0,245,255,0.4)',
    bg: 'rgba(0,245,255,0.06)',
    color: 'var(--sagp-cyan)',
  },
  system: {
    label: 'SYSTEM',
    icon: <AlertCircle size={16} />,
    borderColor: 'rgba(57,255,20,0.4)',
    bg: 'rgba(57,255,20,0.06)',
    color: 'var(--sagp-green)',
  },
};

export function DialogueDisplay({ node }: Props) {
  const audio = useAudioState();
  const config = useTerminalConfig();
  const cfg = node ? SPEAKER_CONFIG[node.speaker] : null;

  return (
    <div className="sagp-neon-card flex-1 flex flex-col overflow-hidden" style={{ minHeight: 200 }}>
      <div className="sagp-card-header flex items-center justify-between">
        <p className="sagp-eyebrow">ACTIVE CALL FEED</p>
        {audio.playbackState === 'playing' && (
          <span className="sagp-badge sagp-badge-green">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--sagp-green)] animate-pulse mr-1" />
            LIVE
          </span>
        )}
      </div>

      <div className="sagp-card-content flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {node && cfg ? (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded p-4"
              style={{ border: `1px solid ${cfg.borderColor}`, background: cfg.bg }}
            >
              {/* Speaker badge */}
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <span className="sagp-mono text-xs font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {node.activeTechniques && node.activeTechniques.length > 0 && (
                  <div className="ml-auto flex flex-wrap gap-1">
                    {node.activeTechniques.map((t) => (
                      <span key={t} className="sagp-badge sagp-badge-danger text-[9px]">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dialogue text */}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sagp-text)' }}>
                {node.text}
              </p>

              {/* Live subtitle overlay */}
              {config.showSubtitles && audio.activeSubtitle && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t text-xs sagp-mono"
                  style={{ borderColor: cfg.borderColor, color: cfg.color }}
                >
                  {audio.activeSubtitle}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-32 text-sm"
              style={{ color: 'var(--sagp-text-soft)' }}
            >
              Awaiting incoming call...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
