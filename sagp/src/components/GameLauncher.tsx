'use client';

import { useState } from 'react';
import { issueGameToken } from '@/lib/game-bridge/token';

interface GameLauncherProps {
  sessionId: string;
  userId: string;
  moduleId: string;
  moduleVersion: number;
  orgId: string;
  onGameStart?: () => void;
  onGameComplete?: () => void;
}

/**
 * Component to launch game sessions
 * Generates JWT tokens and redirects to game server
 */
export function GameLauncher({
  sessionId,
  userId,
  moduleId,
  moduleVersion,
  orgId,
  onGameStart,
  onGameComplete,
}: GameLauncherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameServerUrl = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';

  const gameTypes = [
    {
      id: 'casino_quiz',
      name: 'Casino Quiz',
      description: 'Test your knowledge with a slot machine-style quiz',
      icon: '🎰',
    },
    {
      id: 'phishing_inbox',
      name: 'Phishing Inbox',
      description: 'Identify phishing emails in a simulated inbox',
      icon: '📧',
    },
    {
      id: 'scenario',
      name: 'Security Scenarios',
      description: 'Make decisions in branching security scenarios',
      icon: '🎬',
    },
    {
      id: 'drag_drop',
      name: 'Match Threats',
      description: 'Match security threats to their mitigations',
      icon: '🎯',
    },
  ];

  const startGame = (gameType: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Issue JWT token
      const token = issueGameToken(
        sessionId,
        userId,
        moduleId,
        moduleVersion,
        gameType,
        orgId
      );

      // Callback before redirect
      onGameStart?.();

      // Redirect to game server
      const gameUrl = `${gameServerUrl}/game?token=${token}`;
      window.location.href = gameUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Game Challenge</h2>
        <p className="text-gray-600">Choose a game to test your security knowledge</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameTypes.map((game) => (
          <button
            key={game.id}
            onClick={() => startGame(game.id)}
            disabled={isLoading}
            className="p-6 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-3xl mb-3">{game.icon}</div>
            <h3 className="font-semibold text-lg mb-1">{game.name}</h3>
            <p className="text-sm text-gray-600">{game.description}</p>
            <div className="mt-4 pt-4 border-t">
              <span className="text-xs font-medium text-blue-600">
                {isLoading ? 'Starting...' : 'Play Game →'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>How it works:</strong> Click a game to launch it in a new session. Your progress will be saved
          automatically, and results will be added to your learning record.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
        <div>
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-gray-600">Games Played</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-gray-600">Total Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">0</div>
          <div className="text-gray-600">Achievements</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">0 hrs</div>
          <div className="text-gray-600">Time Spent</div>
        </div>
      </div>
    </div>
  );
}
