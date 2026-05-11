'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateAward } from '@/components/employee/certificate-award';
import { useAuth } from '@/lib/hooks/useAuth';
import { X, Loader2, CheckCircle2, Trophy } from 'lucide-react';

interface GameResult {
  score: number;
  pointsEarned: number;
  badges?: string[];
  timeTaken: number;
}

export default function GameLauncherPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const sessionId = params.sessionId;

  const [isLoading, setIsLoading] = useState(true);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameUrl, setGameUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Fetch session and get game token
        const response = await fetch('/api/sessions/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) throw new Error('Failed to get game token');

        const data = await response.json();
        setToken(data.token);
        setGameUrl(data.gameUrl || process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001');
        setIsLoading(false);

        // Listen for game completion messages
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== new URL(data.gameUrl || 'http://localhost:3001').origin) {
            return;
          }

          if (event.data.type === 'GAME_COMPLETE') {
            setGameResult(event.data.result);
          }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [sessionId]);

  const handleClose = () => {
    if (gameResult) {
      router.push('/dashboard');
    } else {
      router.back();
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const learnerName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
    : 'Learner';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800">
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="text-slate-300">Loading game...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Card className="border-slate-700 bg-slate-800 shadow-2xl">
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />

            <h1 className="mb-2 text-3xl font-bold text-white">Module Complete!</h1>

            <div className="my-8 space-y-4">
              <div className="rounded-lg bg-linear-to-r from-teal-900 to-teal-800 p-6">
                <p className="text-sm text-teal-200">Your Score</p>
                <p className="text-4xl font-bold text-teal-400">{gameResult.score}%</p>
              </div>

              <div className="rounded-lg bg-linear-to-r from-yellow-900 to-yellow-800 p-6">
                <p className="text-sm text-yellow-200">Points Earned</p>
                <p className="text-4xl font-bold text-yellow-400">+{gameResult.pointsEarned}</p>
              </div>

              {gameResult.badges && gameResult.badges.length > 0 && (
                <div className="rounded-lg bg-slate-700 p-6">
                  <p className="mb-3 text-sm text-slate-300">Badges Earned</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {gameResult.badges.map((badge) => (
                      <div
                        key={badge}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 text-lg"
                      >
                        🏆
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-400">
                Completed in {gameResult.timeTaken} minutes
              </p>

              <CertificateAward
                learnerName={learnerName}
                moduleTitle="Training Module"
                score={gameResult.score}
                showConfetti
              />
            </div>

            <Button
              onClick={handleContinue}
              variant="primary"
              className="py-3 px-8"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Continue to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4">
        <h1 className="text-white font-semibold">Training Module</h1>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 hover:bg-slate-700"
        >
          <X className="h-6 w-6 text-slate-300" />
        </button>
      </div>

      {/* Game iframe */}
      <div className="flex-1">
        <iframe
          src={`${gameUrl}?token=${token}&sessionId=${sessionId}`}
          className="h-full w-full border-0"
          allow="microphone; camera; accelerometer; gyroscope"
        />
      </div>
    </div>
  );
}
