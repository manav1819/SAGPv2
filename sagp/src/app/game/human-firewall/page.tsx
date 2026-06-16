'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Phone, Zap, ChevronRight } from 'lucide-react';
import { SCENARIOS } from '@/data/scenarios';
import { ScenarioCard } from '@/components/lobby/ScenarioCard';
import { PlayerProfile } from '@/components/lobby/PlayerProfile';
import { useGameStore, useLastResult } from '@/lib/stores/useGameStore';
import { useGameSave } from '@/lib/hooks/useGameSave';
import { ResumeGameDialog } from '@/components/game/ResumeGameDialog';
import {
  HUMAN_FIREWALL_SCHEMA_VERSION,
  describeHumanFirewallState,
  isResumableHumanFirewallState,
  restoreHumanFirewallState,
  serializeHumanFirewallState,
  type HumanFirewallSaveState,
} from '@/lib/game-save/adapters/humanFirewallSaveAdapter';

export default function HumanFirewallLobby() {
  const router = useRouter();
  const { resetCallState } = useGameStore();
  const lastResult = useLastResult();

  // Checks Supabase (+ localStorage cache) for an in-progress save on mount.
  // Autosaving itself happens on the scenario page — see [scenarioId]/page.tsx.
  const { existingSave, promptResume, continueGame, startNewGame } =
    useGameSave<HumanFirewallSaveState>({
      gameId: 'human-firewall',
      schemaVersion: HUMAN_FIREWALL_SCHEMA_VERSION,
      restoreState: restoreHumanFirewallState,
      serializeState: serializeHumanFirewallState,
      describe: describeHumanFirewallState,
    });

  const canResume = !!existingSave && isResumableHumanFirewallState(existingSave.state);

  const handlePlay = (scenarioId: string) => {
    resetCallState();
    router.push(`/game/human-firewall/${scenarioId}`);
  };

  const handleContinue = () => {
    if (!existingSave) return;
    continueGame();
    const scenarioId = existingSave.state.call.scenarioId;
    if (scenarioId) router.push(`/game/human-firewall/${scenarioId}`);
  };

  return (
    <div className="min-h-screen sagp-main">
      <ResumeGameDialog
        open={canResume && promptResume}
        gameTitle="Operation Human Firewall"
        save={existingSave}
        onContinue={handleContinue}
        onStartNew={startNewGame}
      />
      <div className="sagp-container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sagp-neon-card sagp-hero mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <p className="sagp-eyebrow mb-3">
                <Shield size={10} className="inline mr-1" />
                SECURITY AWARENESS TRAINING
              </p>
              <h1
                className="sagp-hero-title sagp-glitch"
                data-text="OPERATION HUMAN FIREWALL"
              >
                OPERATION HUMAN FIREWALL
              </h1>
              <p className="sagp-hero-copy">
                You are a security analyst receiving live, malicious phone calls. Your job: identify the social engineering tactics, verify callers, protect sensitive information — and report the threats before they escalate.
              </p>
              <div className="sagp-hero-actions">
                <button
                  onClick={() => handlePlay(SCENARIOS[0].id)}
                  className="sagp-btn sagp-btn-primary sagp-btn-lg"
                >
                  <Phone size={18} />
                  Begin Training
                </button>
                <a href="/games" className="sagp-btn sagp-btn-ghost sagp-btn-lg">
                  <ChevronRight size={18} />
                  All Games
                </a>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex flex-col gap-3" style={{ minWidth: 200 }}>
              {[
                { label: 'SCENARIOS', value: '8', color: 'var(--sagp-cyan)' },
                { label: 'MAX XP', value: '12,000+', color: 'var(--sagp-green)' },
                { label: 'DIFFICULTY', value: 'Easy → Hard', color: 'var(--sagp-warning)' },
              ].map((s) => (
                <div key={s.label} className="sagp-cyan-row">
                  <p className="sagp-stat-label">{s.label}</p>
                  <p className="sagp-heading-font text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="sagp-main-sidebar-grid">
          {/* Scenario grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="sagp-heading-font text-xl font-bold text-white flex items-center gap-2">
                <Zap size={18} style={{ color: 'var(--sagp-cyan)' }} />
                MISSION SELECT
              </h2>
              <span className="sagp-badge">{SCENARIOS.length} scenarios</span>
            </div>
            <div className="sagp-module-grid">
              {SCENARIOS.map((scenario, i) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onPlay={handlePlay}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <PlayerProfile />

            {/* Last result */}
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="sagp-neon-card"
              >
                <div className="sagp-card-header">
                  <p className="sagp-eyebrow">LAST MISSION</p>
                </div>
                <div className="sagp-card-content">
                  <div className="sagp-result-grid">
                    <div className="sagp-result-box-cyan">
                      <span className="sagp-result-label">XP Earned</span>
                      <span className="sagp-heading-font font-bold text-white">{lastResult.totalXP.toLocaleString()}</span>
                    </div>
                    <div className={lastResult.terminalOutcome === 'success' ? 'sagp-result-box-green' : 'sagp-error-box'}>
                      <span className="sagp-result-label">Outcome</span>
                      <span className="font-bold capitalize">{lastResult.terminalOutcome}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/game/human-firewall/${lastResult.scenarioId}/results`)}
                    className="sagp-btn sagp-btn-ghost sagp-btn-sm w-full mt-3"
                  >
                    View Full Report
                  </button>
                </div>
              </motion.div>
            )}

            {/* How to play */}
            <div className="sagp-neon-card">
              <div className="sagp-card-header">
                <p className="sagp-eyebrow">HOW TO PLAY</p>
              </div>
              <div className="sagp-card-content space-y-2 text-sm" style={{ color: 'var(--sagp-text-muted)' }}>
                {[
                  '📞 Accept or reject incoming calls',
                  '🔍 Verify caller identity before acting',
                  '🏷 Tag social engineering techniques live',
                  '🔎 Click dialogue to discover hidden clues',
                  '🚨 Escalate suspicious calls immediately',
                  '🏆 Never leak credentials or PII',
                ].map((tip) => (
                  <p key={tip}>{tip}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
