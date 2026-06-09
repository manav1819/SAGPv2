'use client';

import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Pause, Play, PhoneForwarded, ShieldAlert, FileText } from 'lucide-react';
import { useGameStore } from '@/lib/stores/useGameStore';

interface CallControlsProps {
  onTransferToIT?: () => void;
  onEscalate?: () => void;
  onReport?: () => void;
}

export function CallControls({ onTransferToIT, onEscalate, onReport }: CallControlsProps) {
  const { call, toggleMute, toggleHold, endCall, transferToIT, escalateToSecurity, recordIncidentReport } = useGameStore();
  const isActive = call.status === 'active' || call.status === 'muted' || call.status === 'held';

  const btn = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    danger = false,
    accent = false,
    active = false,
  ) => (
    <motion.button
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={action}
      disabled={!isActive}
      title={label}
      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded transition-all text-xs font-bold sagp-mono ${
        danger
          ? 'sagp-btn sagp-btn-danger'
          : accent
          ? 'sagp-btn sagp-btn-secondary'
          : active
          ? 'sagp-btn'
          : 'sagp-btn sagp-btn-ghost'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      style={active ? { background: 'rgba(0,245,255,0.15)', color: 'var(--sagp-cyan)', border: '1px solid rgba(0,245,255,0.4)' } : undefined}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </motion.button>
  );

  return (
    <div className="sagp-neon-card p-4">
      <p className="sagp-eyebrow mb-3">CALL CONTROLS</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {btn(
          call.isMuted ? 'Unmute' : 'Mute',
          call.isMuted ? <MicOff size={18} /> : <Mic size={18} />,
          toggleMute,
          false, false, call.isMuted,
        )}
        {btn(
          call.isOnHold ? 'Resume' : 'Hold',
          call.isOnHold ? <Play size={18} /> : <Pause size={18} />,
          toggleHold,
          false, false, call.isOnHold,
        )}
        {btn(
          'Transfer IT',
          <PhoneForwarded size={18} />,
          () => { transferToIT(); onTransferToIT?.(); },
          false, true,
        )}
        {btn(
          'Escalate',
          <ShieldAlert size={18} />,
          () => { escalateToSecurity(); onEscalate?.(); },
          false, true,
        )}
        {btn(
          'Report',
          <FileText size={18} />,
          () => { recordIncidentReport(); onReport?.(); },
          false, false,
        )}
        {btn(
          'End Call',
          <PhoneOff size={18} />,
          () => endCall('partial'),
          true,
        )}
      </div>
    </div>
  );
}
