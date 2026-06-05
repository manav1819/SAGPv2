'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Shield, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { GameConfig } from '@/config/games.config';
import { PERSONA_LABELS, RISK_TIER_COLORS } from '@/lib/hooks/useLiveData';

/** How many seconds to wait on the success overlay before auto-redirecting */
const AUTO_REDIRECT_SECONDS = 10;

interface IframeGameProps {
  game: GameConfig;
  playerName: string;
  sessionRef: string;
}

interface GameResult {
  sessionId: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  risk: { total_score: number; risk_tier: string; confidence: number } | null;
  persona: { persona: string; confidence: number; drift_delta: number | null } | null;
  gamification: { points_total: number; streak_days: number } | null;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Generic iframe game host.
 *
 * - Listens for GAME_COMPLETE postMessage from game iframes (same origin).
 * - Submits result to /api/game/result which runs the full engine pipeline.
 * - Shows a completion overlay with live risk score, persona, points.
 * - Auto-redirects to /dashboard after AUTO_REDIRECT_SECONDS seconds.
 */
export function IframeGame({ game, playerName, sessionRef }: IframeGameProps) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [mounted, setMounted] = useState(false);
  const submittedRef = useRef(false); // prevent double-submit

  useEffect(() => {
    setMounted(true);
  }, []);

  const gameUrl = useMemo(() => {
    if (!mounted || !game.iframeUrl) return '';
    return `${game.iframeUrl}?playerName=${encodeURIComponent(playerName)}&sessionRef=${encodeURIComponent(
      sessionRef
    )}`;
  }, [game.iframeUrl, mounted, playerName, sessionRef]);

  // Auto-redirect countdown after success
  useEffect(() => {
    if (submitState !== 'success') return;
    setCountdown(AUTO_REDIRECT_SECONDS);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push('/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitState, router]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Accept messages from same origin (games served from /public/) OR
      // from null origin (file:// edge case in some Phaser builds).
      const sameOrigin =
        event.origin === window.location.origin ||
        event.origin === 'null' ||
        event.origin === '';
      if (!sameOrigin) return;
      if (event.data?.type !== 'GAME_COMPLETE') return;
      if (submittedRef.current) return;
      submittedRef.current = true;

      setSubmitState('submitting');
      setErrorMsg(null);

      try {
        const res = await fetch('/api/game/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id, sessionRef, result: event.data }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setGameResult(data);
        setSubmitState('success');
      } catch (err) {
        console.error('[IframeGame] result submission failed:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setSubmitState('error');
        submittedRef.current = false; // allow retry
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [game.id, sessionRef]);

  return (
    <div className="flex h-screen flex-col bg-slate-900 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3 z-10">
        <button
          onClick={() => router.push('/games')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Games
        </button>
        <span className="text-sm font-medium text-slate-300">
          {game.icon ? `${game.icon} ` : ''}{game.title}
        </span>
        <span className="text-xs text-slate-500">Playing as {playerName}</span>
      </div>

      {/* Game frame */}
      <div className="flex-1 overflow-hidden">
        {mounted ? (
          gameUrl ? (
            <iframe
              src={gameUrl}
              className="h-full w-full border-0"
              title={game.title}
              allow="autoplay"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Game URL not configured.
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Loading game...
          </div>
        )}
      </div>

      {/* Submission overlay — only shown while pipeline is running or after completion */}
      {submitState !== 'idle' && (
        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-20 p-6">
          <div className="w-full max-w-sm sagp-card p-6 space-y-5">
            {submitState === 'submitting' && (
              <>
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-10 w-10 sagp-text-primary animate-spin" />
                  <p className="sagp-heading-3">Processing results…</p>
                  <p className="sagp-text-muted text-sm text-center">
                    Recalculating your risk score and persona.
                  </p>
                </div>
              </>
            )}

            {submitState === 'error' && (
              <>
                <div className="flex flex-col items-center gap-3">
                  <XCircle className="h-10 w-10 text-red-400" />
                  <p className="sagp-heading-3">Submission failed</p>
                  <p className="sagp-text-muted text-sm text-center">{errorMsg}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { submittedRef.current = false; setSubmitState('idle'); }}
                    className="flex-1 sagp-card py-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => router.push('/games')}
                    className="flex-1 sagp-card py-2 text-sm sagp-text-primary hover:text-white transition-colors"
                  >
                    Back to Games
                  </button>
                </div>
              </>
            )}

            {submitState === 'success' && gameResult && (
              <>
                <div className="flex flex-col items-center gap-2">
                  {gameResult.passed ? (
                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                  ) : (
                    <XCircle className="h-10 w-10 text-red-400" />
                  )}
                  <p className="sagp-heading-3">
                    {gameResult.passed ? 'Mission Complete!' : 'Mission Failed'}
                  </p>
                </div>

                {/* Score */}
                <div className="text-center">
                  <p className="text-4xl font-bold sagp-neon-text">{gameResult.score}</p>
                  <p className="sagp-text-muted text-xs mt-1">points this session</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {gameResult.risk && (
                    <StatPill
                      icon={<Shield className="h-4 w-4" />}
                      label="Risk Score"
                      value={String(gameResult.risk.total_score)}
                      valueClass={RISK_TIER_COLORS[gameResult.risk.risk_tier] ?? 'sagp-neon-text'}
                      sub={gameResult.risk.risk_tier.toUpperCase()}
                    />
                  )}
                  {gameResult.gamification && (
                    <StatPill
                      icon={<Trophy className="h-4 w-4" />}
                      label="Total Points"
                      value={gameResult.gamification.points_total.toLocaleString()}
                      sub={`${gameResult.gamification.streak_days}d streak`}
                    />
                  )}
                </div>

                {/* Persona */}
                {gameResult.persona && (
                  <div className="sagp-card p-3 text-center space-y-1">
                    <p className="text-xs sagp-text-muted uppercase tracking-wider">Your Persona</p>
                    <p className="font-semibold text-slate-200">
                      {PERSONA_LABELS[gameResult.persona.persona] ?? gameResult.persona.persona}
                    </p>
                    {gameResult.persona.drift_delta != null && gameResult.persona.drift_delta > 0.1 && (
                      <p className="text-xs text-cyan-400">
                        Persona shifted Δ{gameResult.persona.drift_delta.toFixed(2)} from last session
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-center sagp-text-muted">
                  Redirecting to dashboard in{' '}
                  <span className="text-cyan-400 font-semibold">{countdown}s</span>…
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded transition-colors"
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/games')}
                    className="flex-1 sagp-card py-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    More Games
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon, label, value, sub, valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="sagp-card p-3 space-y-1 text-center">
      <div className="flex items-center justify-center gap-1 sagp-text-primary">{icon}</div>
      <p className="text-xs sagp-text-muted">{label}</p>
      <p className={`text-lg font-bold ${valueClass ?? 'sagp-neon-text'}`}>{value}</p>
      {sub && <p className="text-xs sagp-text-muted">{sub}</p>}
    </div>
  );
}
