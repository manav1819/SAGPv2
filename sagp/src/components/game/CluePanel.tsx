'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, CheckCircle } from 'lucide-react';
import { useGameStore, useCallState } from '@/lib/stores/useGameStore';
import type { HiddenClue } from '@/types/game';

interface Props {
  clues: HiddenClue[];
}

export function CluePanel({ clues }: Props) {
  const { discoverClue } = useGameStore();
  const call = useCallState();

  if (clues.length === 0) return null;

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header">
        <p className="sagp-eyebrow flex items-center gap-2">
          <Search size={12} />
          HIDDEN CLUES
          <span className="sagp-badge sagp-badge-purple text-[9px]">{clues.length}</span>
        </p>
      </div>
      <div className="sagp-card-content space-y-2">
        <p className="text-xs" style={{ color: 'var(--sagp-text-muted)' }}>
          Click highlighted text in the dialogue to uncover clues:
        </p>
        <AnimatePresence>
          {clues.map((clue) => {
            const found = call.discoveredClueIds.includes(clue.id);
            return (
              <motion.button
                key={clue.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !found && discoverClue(clue.id, clue.xpReward)}
                disabled={found}
                className="w-full text-left rounded p-2.5 transition-all"
                style={{
                  border: found ? '1px solid rgba(57,255,20,0.4)' : '1px solid rgba(191,95,255,0.3)',
                  background: found ? 'rgba(57,255,20,0.06)' : 'rgba(191,95,255,0.06)',
                  cursor: found ? 'default' : 'pointer',
                }}
              >
                <div className="flex items-start gap-2">
                  {found
                    ? <CheckCircle size={14} style={{ color: 'var(--sagp-green)', flexShrink: 0, marginTop: 2 }} />
                    : <Lightbulb size={14} style={{ color: 'var(--sagp-purple)', flexShrink: 0, marginTop: 2 }} />
                  }
                  <div>
                    <p className="text-xs sagp-mono font-bold mb-0.5" style={{ color: found ? 'var(--sagp-green)' : 'var(--sagp-purple)' }}>
                      &quot;{clue.textSegment}&quot;
                    </p>
                    {found && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs"
                        style={{ color: 'var(--sagp-text-muted)' }}
                      >
                        {clue.description}
                      </motion.p>
                    )}
                    {!found && (
                      <p className="text-xs" style={{ color: 'var(--sagp-text-soft)' }}>
                        +{clue.xpReward} XP — click to reveal
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
