'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Shield, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/lib/stores/useGameStore';
import { getScenario } from '@/data/scenarios';
import { useCallTones } from '@/lib/hooks/useCallTones';

export function CallIncoming() {
  const { call, acceptCall, rejectCall } = useGameStore();
  const scenario = call.scenarioId ? getScenario(call.scenarioId) : null;
  const isIncoming = call.status === 'incoming';
  const { startRingtone, stopRingtone } = useCallTones();

  // Ring for as long as the call is incoming; stop the moment it's
  // accepted, rejected, or the component unmounts.
  useEffect(() => {
    if (isIncoming) startRingtone();
    else stopRingtone();
    return () => stopRingtone();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIncoming]);

  return (
    <AnimatePresence>
      {isIncoming && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-[var(--sagp-cyan)]"
              style={{ width: 80 + i * 60, height: 80 + i * 60 }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}

          <div className="sagp-neon-card relative z-10 w-full max-w-sm p-8 text-center">
            {/* Caller ID */}
            <div className="mb-6">
              <div className="sagp-icon-tile mx-auto mb-4" style={{ width: 64, height: 64, borderColor: 'rgba(255,59,129,0.5)', background: 'rgba(255,59,129,0.1)' }}>
                <AlertTriangle size={28} color="var(--sagp-danger)" />
              </div>
              <p className="sagp-eyebrow mb-2">INCOMING CALL</p>
              <h2 className="sagp-heading-font text-xl font-bold text-white mb-1">
                {scenario?.attackerPersona.name ?? 'Unknown Caller'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--sagp-text-muted)' }}>
                {scenario?.attackerPersona.callerIdSpoof ?? 'Number Withheld'}
              </p>
              <p className="text-xs mt-1 sagp-mono" style={{ color: 'var(--sagp-warning)' }}>
                {scenario?.attackerPersona.role}
              </p>
            </div>

            {/* Scenario info */}
            {scenario && (
              <div className="sagp-cyan-row mb-6 text-left">
                <p className="text-xs sagp-mono mb-1" style={{ color: 'var(--sagp-cyan)' }}>SCENARIO BRIEFING</p>
                <p className="text-sm" style={{ color: 'var(--sagp-text-muted)' }}>{scenario.description}</p>
              </div>
            )}

            {/* Call actions */}
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={rejectCall}
                className="sagp-btn sagp-btn-danger sagp-btn-lg flex-1"
              >
                <PhoneOff size={20} />
                Reject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={acceptCall}
                className="sagp-btn sagp-btn-primary sagp-btn-lg flex-1"
              >
                <Phone size={20} />
                Accept
              </motion.button>
            </div>

            {/* Security reminder */}
            <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--sagp-text-soft)' }}>
              <Shield size={12} />
              <span>Verify all callers before sharing any information</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
