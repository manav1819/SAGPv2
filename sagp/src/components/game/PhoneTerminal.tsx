'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck } from 'lucide-react';
import { useGameStore, useCallState, useGamePhase } from '@/lib/stores/useGameStore';
import { useScenario } from '@/lib/hooks/useScenario';
import { DialogueDisplay } from './DialogueDisplay';
import { ChoicePanel } from './ChoicePanel';
import { CallControls } from './CallControls';
import { ScoreHUD } from './ScoreHUD';
import { ThreatIndicator } from './ThreatIndicator';
import { CluePanel } from './CluePanel';
import { CustomResponseInput } from './CustomResponseInput';
import { XPTickerLayer } from './XPTicker';
import { CallIncoming } from './CallIncoming';
import { evaluateResponse } from '@/services/EvaluationService';

interface Props {
  scenarioId: string;
}

export function PhoneTerminal({ scenarioId }: Props) {
  const { acceptCall, advanceToNode, endCall, tickElapsed } = useGameStore();
  const call = useCallState();
  const phase = useGamePhase();
  const { scenario, currentNode, startScenario, handleChoice, advanceTo } = useScenario(scenarioId);

  // Boot: trigger incoming call
  useEffect(() => {
    if (call.status === 'idle') {
      startScenario(scenarioId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // Auto-set initial node when call is accepted
  useEffect(() => {
    if (call.status === 'active' && !call.currentNodeId && scenario) {
      advanceToNode(scenario.initialNodeId);
    }
  }, [call.status, call.currentNodeId, scenario, advanceToNode]);

  // Timer tick
  useEffect(() => {
    if (call.status !== 'active') return;
    const id = setInterval(tickElapsed, 1000);
    return () => clearInterval(id);
  }, [call.status, tickElapsed]);

  // Auto-advance terminal nodes
  useEffect(() => {
    if (!currentNode?.terminalOutcome) return;
    const delay = setTimeout(() => {
      endCall(currentNode.terminalOutcome!);
    }, 2500);
    return () => clearTimeout(delay);
  }, [currentNode, endCall]);

  // Auto-advance nodes with no choices
  useEffect(() => {
    if (!currentNode?.autoAdvanceMs || (currentNode.choices?.length ?? 0) > 0) return;
    const t = setTimeout(() => {
      if (currentNode.choices?.length === 1) {
        advanceTo(currentNode.choices[0].nextNodeId);
      }
    }, currentNode.autoAdvanceMs);
    return () => clearTimeout(t);
  }, [currentNode, advanceTo]);

  const handleCustomResponse = async (text: string) => {
    if (!currentNode || !scenario) return;
    const result = await evaluateResponse({
      scenarioId,
      nodeId: currentNode.id,
      playerInput: text,
      inputMode: 'text',
    });
    if (result.nextNodeId !== currentNode.id) {
      advanceTo(result.nextNodeId);
    }
  };

  const isActive = phase === 'call_active';
  const choices = currentNode?.choices ?? [];
  const clues = currentNode?.hiddenClues ?? [];

  return (
    <div className="relative min-h-screen">
      <XPTickerLayer />
      <CallIncoming />

      {/* Header */}
      <div className="sagp-navbar">
        <div className="sagp-navbar-inner">
          <div className="sagp-brand">
            <div className="sagp-brand-mark">
              <Phone size={20} />
            </div>
            <span className="sagp-brand-text text-sm">OPERATION HUMAN FIREWALL</span>
          </div>
          {scenario && (
            <div className="flex items-center gap-3">
              <span className="sagp-badge">{scenario.difficulty}</span>
              <span className="sagp-badge sagp-badge-purple sagp-mono">{scenario.title}</span>
              {call.status === 'active' && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="sagp-badge sagp-badge-danger"
                >
                  ● LIVE
                </motion.span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'var(--sagp-cyan)' }} />
            <span className="sagp-mono text-xs" style={{ color: 'var(--sagp-text-muted)' }}>SOC TERMINAL</span>
          </div>
        </div>
      </div>

      {/* Main game grid */}
      <main className="sagp-main">
        <div className="sagp-container">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>
            {/* Left: dialogue + choices */}
            <div className="flex flex-col gap-4">
              <DialogueDisplay node={currentNode} />
              {isActive && choices.length > 0 && (
                <ChoicePanel
                  choices={choices}
                  onChoice={handleChoice}
                  disabled={!isActive}
                />
              )}
              {isActive && (
                <CustomResponseInput
                  onSubmit={handleCustomResponse}
                  disabled={!isActive}
                />
              )}
              <CallControls />
            </div>

            {/* Right: HUD */}
            <div className="flex flex-col gap-4">
              <ScoreHUD />
              <ThreatIndicator />
              {clues.length > 0 && <CluePanel clues={clues} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
