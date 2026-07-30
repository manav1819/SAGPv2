'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck } from 'lucide-react';
import { useGameStore, useCallState, useGamePhase, useTerminalConfig } from '@/lib/stores/useGameStore';
import { useScenario } from '@/lib/hooks/useScenario';
import { useAudio } from '@/lib/hooks/useAudio';
import { useCallTones } from '@/lib/hooks/useCallTones';
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
  const terminalConfig = useTerminalConfig();
  const { scenario, currentNode, startScenario, handleChoice, advanceTo } = useScenario(scenarioId);
  const { playNode, pause: pauseAudio, resume: resumeAudio, stop: stopAudio } = useAudio();
  const { playEndTone } = useCallTones();

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

  // Voice audio — play the current dialogue node's spoken line (pre-recorded
  // asset if the scenario provides one, otherwise text-to-speech) so an
  // answered call sounds like a real conversation instead of static text.
  // Only the caller's own lines are voiced — system/wrap-up text (e.g. the
  // "incident reported" summary) is narration *about* the call, not part of
  // it, and speaking it was what made TTS audibly bleed past the call ending.
  useEffect(() => {
    if (
      call.status !== 'active' ||
      !currentNode ||
      currentNode.speaker !== 'attacker' ||
      !terminalConfig.autoPlayAudio
    ) return;
    playNode(currentNode, scenarioId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.id, call.status, terminalConfig.autoPlayAudio]);

  // Putting the call on hold should pause the simulated call audio (mute
  // only silences the player's own mic, not what they hear). Only react to
  // actual hold/resume transitions — calling AudioManager.resume() on every
  // render while already playing would spawn duplicate rAF loops.
  const prevOnHold = useRef(call.isOnHold);
  useEffect(() => {
    if (prevOnHold.current !== call.isOnHold) {
      if (call.isOnHold) pauseAudio();
      else if (call.status === 'active') resumeAudio();
    }
    prevOnHold.current = call.isOnHold;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.isOnHold, call.status]);

  // Stop any in-flight audio the moment the call is no longer active, and —
  // for a call that was actually connected (not just rejected while
  // ringing) — play a three-beep end tone. Guarded to the actual
  // active/held → over transition so it fires exactly once, not on every
  // re-render while the call stays ended.
  const prevCallStatus = useRef(call.status);
  useEffect(() => {
    const wasConnected = prevCallStatus.current === 'active' || prevCallStatus.current === 'held';
    const isOver = call.status === 'ended' || call.status === 'transferred' || call.status === 'escalated';
    if (isOver) {
      stopAudio();
      if (wasConnected && prevCallStatus.current !== call.status) {
        playEndTone();
      }
    }
    prevCallStatus.current = call.status;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.status]);

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
