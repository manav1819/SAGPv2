/**
 * Routes game_type string to the correct Phaser scene class name
 */

export const SCENE_MAP: Record<string, string> = {
  casino_quiz: 'CasinoQuizScene',
  phishing_inbox: 'PhishingInboxScene',
  scenario: 'ScenarioScene',
  drag_drop: 'DragDropScene',
};

export function getSceneClass(gameType: string): string {
  const sceneClass = SCENE_MAP[gameType];
  if (!sceneClass) {
    throw new Error(`Unknown game type: ${gameType}`);
  }
  return sceneClass;
}

export function isValidGameType(gameType: string): boolean {
  return gameType in SCENE_MAP;
}
