'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';
import { PhoneTerminal } from '@/components/game/PhoneTerminal';
import { getScenario } from '@/data/scenarios';
import { useGamePhase } from '@/lib/stores/useGameStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  params: Promise<{ scenarioId: string }>;
}

function GameContent({ scenarioId }: { scenarioId: string }) {
  const phase = useGamePhase();
  const router = useRouter();

  useEffect(() => {
    if (phase === 'results') {
      router.push(`/game/human-firewall/${scenarioId}/results`);
    }
  }, [phase, scenarioId, router]);

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
