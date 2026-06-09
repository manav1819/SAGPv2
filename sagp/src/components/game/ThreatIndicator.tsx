'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Tag, Flag } from 'lucide-react';
import { useGameStore, useCallState } from '@/lib/stores/useGameStore';
import type { SocialEngineeringTechnique } from '@/types/game';

const TECHNIQUES: { key: SocialEngineeringTechnique; label: string; description: string }[] = [
  { key: 'authority_bias', label: 'Authority Bias', description: 'Caller claims authority to override normal procedures' },
  { key: 'urgency', label: 'Urgency', description: 'Artificial time pressure to force quick decisions' },
  { key: 'fear', label: 'Fear', description: 'Threatening negative consequences to create panic' },
  { key: 'scarcity', label: 'Scarcity', description: 'Limited opportunity to trigger fear of missing out' },
  { key: 'reciprocity', label: 'Reciprocity', description: 'Offering favours to create obligation' },
  { key: 'trust_exploitation', label: 'Trust Exploit', description: 'Leveraging existing trust relationships' },
  { key: 'familiarity', label: 'Familiarity', description: 'Creating false sense of prior relationship' },
  { key: 'curiosity', label: 'Curiosity', description: 'Exploiting curiosity to reveal information' },
  { key: 'pressure_tactics', label: 'Pressure', description: 'Direct coercion or threats' },
  { key: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone with authority' },
];

export function ThreatIndicator() {
  const { tagTechnique, flagSuspicious, recordRedFlag } = useGameStore();
  const call = useCallState();
  const tagged = call.taggedTechniqueIds;

  return (
    <div className="sagp-neon-card">
      <div className="sagp-card-header flex items-center justify-between">
        <p className="sagp-eyebrow">THREAT DETECTOR</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { flagSuspicious(); recordRedFlag(); }}
          className="sagp-btn sagp-btn-danger sagp-btn-sm"
          disabled={call.suspiciousFlagged}
        >
          <Flag size={12} />
          {call.suspiciousFlagged ? 'Flagged' : 'Flag Call'}
        </motion.button>
      </div>
      <div className="sagp-card-content">
        <p className="text-xs mb-3" style={{ color: 'var(--sagp-text-muted)' }}>
          Tag social engineering techniques you detect in real time:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TECHNIQUES.map(({ key, label, description }) => {
            const isTagged = tagged.includes(key);
            return (
              <motion.button
                key={key}
                whileHover={{ scale: isTagged ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { tagTechnique(key); recordRedFlag(); }}
                disabled={isTagged || call.status !== 'active'}
                title={description}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all sagp-mono"
                style={{
                  border: isTagged ? '1px solid var(--sagp-green)' : '1px solid rgba(255,59,129,0.3)',
                  background: isTagged ? 'rgba(57,255,20,0.12)' : 'rgba(255,59,129,0.06)',
                  color: isTagged ? 'var(--sagp-green)' : 'var(--sagp-danger)',
                  cursor: isTagged ? 'default' : 'pointer',
                  opacity: call.status !== 'active' ? 0.5 : 1,
                }}
              >
                {isTagged ? '✓' : <Tag size={10} />}
                <span>{label}</span>
              </motion.button>
            );
          })}
        </div>
        {tagged.length > 0 && (
          <AnimatePresence>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-xs sagp-mono"
              style={{ color: 'var(--sagp-green)' }}
            >
              <AlertTriangle size={10} className="inline mr-1" />
              {tagged.length} technique{tagged.length > 1 ? 's' : ''} tagged
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
