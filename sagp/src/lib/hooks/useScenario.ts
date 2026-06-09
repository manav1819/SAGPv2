'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/lib/stores/useGameStore';
import { getScenario } from '@/data/scenarios';
import type { DialogueChoice, Scenario, DialogueNode } from '@/types/game';

export function useScenario(scenarioId: string | null) {
  const store = useGameStore();

  const scenario: Scenario | null = scenarioId ? getScenario(scenarioId) ?? null : null;

  const currentNode: DialogueNode | null =
    scenario && store.call.currentNodeId
      ? scenario.nodes[store.call.currentNodeId] ?? null
      : null;

  const startScenario = useCallback(
    (id: string) => {
      const s = getScenario(id);
      if (!s) return;
      store.initiateIncomingCall(id);
    },
    [store],
  );

  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      store.selectChoice(
        choice.id,
        choice.nextNodeId,
        choice.scoreModifiers,
        choice.xpReward ?? (choice.penaltyXp ? -(choice.penaltyXp) : 0),
      );
      if (choice.leakType) store.recordLeak(choice.leakType);
    },
    [store],
  );

  const advanceTo = useCallback(
    (nodeId: string) => store.advanceToNode(nodeId),
    [store],
  );

  return { scenario, currentNode, startScenario, handleChoice, advanceTo };
}
