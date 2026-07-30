'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';
import { PhoneTerminal } from '@/components/game/PhoneTerminal';
import { getScenario } from '@/data/scenarios';
import { useGamePhase } from '@/lib/stores/useGameStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useGameSave } from '@/lib/hooks/useGameSave';
import {
  HUMAN_FIREWALL_SCHEMA_VERSION,
  describeHumanFirewallState,
  restoreHumanFirewallState,
  serializeHumanFirewallState,
  type HumanFirewallSaveState,
} from '@/lib/game-save/adapters/humanFirewallSaveAdapter';

interface Props {
  params: Promise<{ scenarioId: string }>;
}

function GameContent({ scenarioId }: { scenarioId: string }) {
  const phase = useGamePhase();
  const router = useRouter();

  // Resume decision already happened in the lobby (or this is a fresh
  // scenario) — skipInitialCheck starts autosave immediately instead of
  // re-checking Supabase and showing another prompt.
  const { saveNow, startNewGame } = useGameSave<HumanFirewallSaveState>({
    gameId: 'human-firewall',
    schemaVersion: HUMAN_FIREWALL_SCHEMA_VERSION,
    restoreState: restoreHumanFirewallState,
    serializeState: serializeHumanFirewallState,
    describe: describeHumanFirewallState,
    sessionRef: scenarioId,
    skipInitialCheck: true,
  });

  const prevPhase = useRef(phase);

  useEffect(() => {
    const changedPhase = prevPhase.current !== phase;

    if (phase === 'results') {
      // Scenario is complete — nothing left to resume. Clear the save
      // instead of leaving a stale "finished" snapshot behind.
      void startNewGame();
      router.push(`/game/human-firewall/${scenarioId}/results`);
      return;
    }

    if (changedPhase && phase === 'lobby') {
      // The incoming call was rejected — there's nothing left to show on
      // this scenario page, so send the player back to the lobby instead
      // of leaving them staring at a dead "Awaiting incoming call..." screen.
      router.push('/game/human-firewall');
    }

    // Save immediately on every phase transition (call accepted, choice
    // made, escalation, etc.) — the 15s interval alone only covers "every
    // few seconds", not "the moment something important happened".
    if (changedPhase) {
      prevPhase.current = phase;
      void saveNow();
    }
  }, [phase, scenarioId, router, saveNow, startNewGame]);

  return <PhoneTerminal scenarioId={scenarioId} />;
}

export default function ScenarioPage({ params }: Props) {
  const { scenarioId } = use(params);

  // Validate scenario exists
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    redirect('/game/human-firewall');
  }

  return <GameContent scenarioId={scenarioId} />;
}
