'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { useTerminalConfig } from '@/lib/stores/useGameStore';
import type { DialogueChoice } from '@/types/game';

interface Props {
  choices: DialogueChoice[];
  onChoice: (choice: DialogueChoice) => void;
  disabled?: boolean;
}

export function ChoicePanel({ choices, onChoice, disabled }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const config = useTerminalConfig();

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header">
        <p className="sagp-eyebrow">YOUR RESPONSE</p>
      </div>
      <div className="sagp-card-content space-y-2">
        <AnimatePresence>
          {choices.map((choice, i) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ x: 4 }}
              onHoverStart={() => setHovered(choice.id)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => !disabled && onChoice(choice)}
              disabled={disabled}
              className="w-full text-left rounded p-3 transition-all flex items-start gap-3 group"
              style={{
                border: '1px solid rgba(0,245,255,0.18)',
                background: hovered === choice.id ? 'rgba(0,245,255,0.08)' : 'rgba(0,0,0,0.25)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <ChevronRight
                size={16}
                className="mt-0.5 shrink-0 transition-colors"
                style={{ color: hovered === choice.id ? 'var(--sagp-cyan)' : 'var(--sagp-text-soft)' }}
              />
              <div className="flex-1">
                <p className="text-sm leading-snug" style={{ color: 'var(--sagp-text)' }}>
                  {choice.text}
                </p>
                {/* Hints (Easy/Medium only) */}
                {config.hintsEnabled && hovered === choice.id && choice.securityHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 flex items-start gap-1.5 text-xs"
                    style={{ color: 'var(--sagp-green)' }}
                  >
                    <Eye size={12} className="mt-0.5 shrink-0" />
                    <span>{choice.securityHint}</span>
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {choices.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--sagp-text-soft)' }}>
            Waiting for caller...
          </p>
        )}
      </div>
    </div>
  );
}
