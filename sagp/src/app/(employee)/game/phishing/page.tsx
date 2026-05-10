'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateAward } from '@/components/employee/certificate-award';
import { Loader2, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmailRecord {
  emailNum:    number;
  sender:      string;
  subject:     string;
  trueLabel:   number;
  trueType:    string;
  userGuess:   string;
  correct:     boolean;
  timeTakenMs: number;
}

interface GameSessionData {
  sessionRef:        string;
  finalScore:        number;
  livesUsed:         number;
  livesRemaining:    number;
  accuracy:          number;
  avgResponseTimeMs: number;
  emails:            EmailRecord[];
}

interface GameCompletePayload {
  type:        'GAME_COMPLETE';
  won:         boolean;
  sessionData: GameSessionData;
}

type Phase = 'loading' | 'playing' | 'saving' | 'result' | 'error';

interface SavedResult {
  moduleTitle: string;
  score: number;
  pointsEarned: number;
  completedAt: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PhishingGamePage() {
  const router   = useRouter();
  const { profile, isLoading: authLoading } = useAuth();

  const [phase,  setPhase]  = useState<Phase>('loading');
  const [passed, setPassed] = useState<boolean>(false);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);

  const sessionRefRef = useRef<string>('');

  // ── Build a stable session reference (client-side only) ──────────────────
  useEffect(() => {
    sessionRefRef.current = crypto.randomUUID();
  }, []);

  // ── Start the game once auth is ready ────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      setPhase('playing');
    }
  }, [authLoading]);

  // ── Listen for GAME_COMPLETE from the iframe ──────────────────────────────
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Only accept messages from our own origin (same-origin iframe)
      if (event.origin !== window.location.origin) return;

      const data = event.data as GameCompletePayload;
      if (data?.type !== 'GAME_COMPLETE') return;

      setPhase('saving');

      try {
        const res = await fetch('/api/game/phishing/complete', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            won:         data.won,
            sessionData: data.sessionData,
          }),
        });

        if (!res.ok) throw new Error('Failed to save results');
        const saved = await res.json();

        setPassed(data.won);
        setSavedResult({
          moduleTitle: saved.module?.title || 'Phishing Simulator',
          score: data.sessionData.finalScore,
          pointsEarned: saved.pointsEarned ?? data.sessionData.finalScore,
          completedAt: saved.completedAt || new Date().toISOString(),
        });
        setPhase('result');
      } catch (err) {
        console.error('Failed to save game result:', err);
        // Even on save failure, show the result to the employee
        setPassed(data.won);
        setSavedResult({
          moduleTitle: 'Phishing Simulator',
          score: data.sessionData.finalScore,
          pointsEarned: data.sessionData.finalScore,
          completedAt: new Date().toISOString(),
        });
        setPhase('result');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Derive game iframe URL ────────────────────────────────────────────────
  const playerName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : 'Agent';

  const gameUrl = `/phishing-game/index.html?playerName=${encodeURIComponent(playerName)}&sessionRef=${sessionRefRef.current}`;

  const handlePlayAgain = () => {
    sessionRefRef.current = crypto.randomUUID();
    setSavedResult(null);
    setPhase('playing');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
            <p className="text-slate-300">Preparing your training session…</p>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'saving') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
            <p className="text-slate-300">Saving your results…</p>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-3xl border-slate-700 bg-slate-800 shadow-2xl">
          <div className="p-8 text-center">
            {passed ? (
              <>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-900/40">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-white">Mission Complete!</h1>
                <p className="mb-1 text-lg font-semibold text-green-400">✓ Cleared</p>
                <p className="mb-8 text-sm text-slate-400">
                  You demonstrated strong phishing awareness. No retraining required at this time.
                </p>
                {savedResult && (
                  <div className="mx-auto mb-6 max-w-sm rounded-lg border border-yellow-400/20 bg-yellow-900/20 p-5">
                    <p className="text-sm text-yellow-200">Points earned on this submission</p>
                    <p className="text-4xl font-bold text-yellow-300">+{savedResult.pointsEarned}</p>
                  </div>
                )}
                {savedResult && (
                  <div className="mb-8">
                    <CertificateAward
                      learnerName={playerName}
                      moduleTitle={savedResult.moduleTitle}
                      completedAt={savedResult.completedAt}
                      score={savedResult.score}
                      showConfetti
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-900/40">
                  <AlertTriangle className="h-12 w-12 text-red-400" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-white">Mission Failed</h1>
                <p className="mb-1 text-lg font-semibold text-red-400">⚠ Retraining Required</p>
                <p className="mb-8 text-sm text-slate-400">
                  You fell for one too many phishing emails. Please review the training material
                  and try again — practice makes perfect!
                </p>
              </>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={handlePlayAgain}
                variant="primary"
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Play Again
              </Button>
              <Button
                onClick={() => router.push('/games')}
                variant="ghost"
                className="w-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // phase === 'playing'
  return (
    <div className="flex h-screen flex-col bg-slate-900">
      {/* Slim header bar */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
        <button
          onClick={() => router.push('/games')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Games
        </button>
        <span className="text-sm font-medium text-slate-300">🎣 Phishing Simulator</span>
        <span className="text-xs text-slate-500">Playing as {playerName}</span>
      </div>

      {/* Game iframe — same-origin, so postMessage works */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={phase}            // remount iframe when "Play Again" resets phase
          src={gameUrl}
          className="h-full w-full border-0"
          title="Phishing Simulator"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
