'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send } from 'lucide-react';
import { useVoiceInput } from '@/lib/hooks/useVoiceInput';
import { useGameStore, useVoiceState, useTerminalConfig } from '@/lib/stores/useGameStore';

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function CustomResponseInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState('');
  const voice = useVoiceState();
  const config = useTerminalConfig();
  const { submitCustomResponse } = useGameStore();
  const { startListening, stopListening } = useVoiceInput();

  const handleSubmit = () => {
    const val = (text || voice.transcript).trim();
    if (!val) return;
    submitCustomResponse(val);
    onSubmit(val);
    setText('');
  };

  const toggleVoice = () => {
    if (voice.listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header">
        <p className="sagp-eyebrow">CUSTOM RESPONSE</p>
      </div>
      <div className="sagp-card-content">
        <div className="flex gap-2">
          <input
            type="text"
            value={voice.listening ? voice.interimTranscript || text : text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={voice.listening ? 'Listening...' : 'Type your response...'}
            disabled={disabled || voice.listening}
            className="sagp-input flex-1"
            style={{ fontFamily: 'var(--sagp-font-body)' }}
          />

          {config.voiceInputEnabled && voice.available && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVoice}
              disabled={disabled}
              className="sagp-btn sagp-btn-secondary"
              style={voice.listening ? { borderColor: 'var(--sagp-danger)', color: 'var(--sagp-danger)', background: 'rgba(255,59,129,0.12)' } : undefined}
              title={voice.listening ? 'Stop recording' : 'Start voice input'}
            >
              {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={disabled || (!text && !voice.transcript)}
            className="sagp-btn sagp-btn-primary"
          >
            <Send size={16} />
          </motion.button>
        </div>

        {voice.error && (
          <p className="mt-2 text-xs" style={{ color: 'var(--sagp-danger)' }}>{voice.error}</p>
        )}
        {voice.listening && voice.interimTranscript && (
          <p className="mt-2 text-xs sagp-mono" style={{ color: 'var(--sagp-text-muted)' }}>
            {voice.interimTranscript}
          </p>
        )}
      </div>
    </div>
  );
}
