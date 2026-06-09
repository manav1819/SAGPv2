'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useLastResult, useGameStore } from '@/lib/stores/useGameStore';
import { EvaluationReport } from '@/components/results/EvaluationReport';
import { submitFullPayload } from '@/services/SAGPIntegration';
import { useEffect } from 'react';

interface Props {
  params: Promise<{ scenarioId: string }>;
}

export default function ResultsPage({ params }: Props) {
  const { scenarioId } = use(params);
  const router = useRouter();
  const lastResult = useLastResult();
  const { buildSAGPPayload, resetCallState } = useGameStore();

  // Submit metrics to SAGP on mount
  useEffect(() => {
    const payload = buildSAGPPayload();
    if (payload) {
      submitFullPayload(payload).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lastResult) {
    router.replace('/game/human-firewall');
    return null;
  }

  return (
    <EvaluationReport
      result={lastResult}
      onPlayAgain={() => {
        resetCallState();
        router.push(`/game/human-firewall/${scenarioId}`);
      }}
      onLobby={() => {
        resetCallState();
        router.push('/game/human-firewall');
      }}
    />
  );
}
