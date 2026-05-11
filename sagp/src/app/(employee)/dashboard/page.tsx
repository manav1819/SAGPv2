'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Award, Clock, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface CompletedSession {
  id: string;
  score: number | null;
  passed: boolean | null;
  time_taken_seconds: number | null;
  ended_at: string | null;
  game_state: Record<string, unknown> | null;
  modules:
    | {
        title: string;
        points_value: number;
        category: string;
      }
    | null;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const loadSessions = async () => {
      if (!user) {
        setSessions([]);
        setIsFetching(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('game_sessions')
        .select('id, score, passed, time_taken_seconds, ended_at, game_state, modules:module_id(title, points_value, category)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false });

      const normalizedSessions = ((data as unknown[]) || []).map((row) => {
        const session = row as Omit<CompletedSession, 'modules'> & {
          modules:
            | CompletedSession['modules']
            | CompletedSession['modules'][]
            | null;
        };
        const joinedModule = Array.isArray(session.modules)
          ? session.modules[0] || null
          : session.modules;

        return {
          ...session,
          modules: joinedModule,
        };
      });

      setSessions(normalizedSessions);
      setIsFetching(false);
    };

    loadSessions();
  }, [isLoading, user]);

  const stats = useMemo(() => {
    const completed = sessions.length;
    const passed = sessions.filter((session) => session.passed).length;
    const totalXp = sessions.reduce(
      (sum, session) => sum + (session.passed ? session.modules?.points_value || 0 : 0),
      0
    );
    const averageScore =
      completed > 0
        ? Math.round(
            sessions.reduce((sum, session) => sum + (session.score || 0), 0) / completed
          )
        : 0;
    const averageAccuracy =
      completed > 0
        ? Math.round(
            sessions.reduce((sum, session) => {
              const accuracy = session.game_state?.accuracy;
              return sum + (typeof accuracy === 'number' ? accuracy : 0);
            }, 0) / completed
          )
        : 0;
    const totalMinutes = Math.round(
      sessions.reduce((sum, session) => sum + (session.time_taken_seconds || 0), 0) / 60
    );

    return { completed, passed, totalXp, averageScore, averageAccuracy, totalMinutes };
  }, [sessions]);

  if (isFetching) {
    return (
      <div className="space-y-6 p-8">
        <Card className="p-8 text-center sagp-text-muted">Loading your training activity...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white sagp-neon-text">Dashboard</h1>
        <p className="mt-1 sagp-text-muted">Your activity appears here after you complete games.</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 sagp-text-cyan" />
          <h2 className="font-heading text-xl font-bold text-white">No game stats yet</h2>
          <p className="mx-auto mt-2 max-w-xl sagp-text-muted">
            Complete a training game to unlock score, XP, accuracy, completion, and badge cards.
          </p>
          <Link href="/games">
            <Button className="mt-6">Play a Game</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Games Completed</h3>
                  <Target className="h-5 w-5 sagp-text-cyan" />
                </div>
                <p className="text-4xl font-bold text-white">{stats.completed}</p>
                <p className="mt-2 text-sm sagp-text-muted">{stats.passed} cleared</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Total XP</h3>
                  <Award className="h-5 w-5 sagp-text-green" />
                </div>
                <p className="text-4xl font-bold sagp-text-green">{stats.totalXp}</p>
                <p className="mt-2 text-sm sagp-text-muted">earned from passed games</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Average Score</h3>
                  <TrendingUp className="h-5 w-5 sagp-text-purple" />
                </div>
                <p className="text-4xl font-bold sagp-text-cyan">{stats.averageScore}</p>
                <p className="mt-2 text-sm sagp-text-muted">across completed games</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Time Trained</h3>
                  <Clock className="h-5 w-5 sagp-text-cyan" />
                </div>
                <p className="text-4xl font-bold text-white">{stats.totalMinutes}m</p>
                <p className="mt-2 text-sm sagp-text-muted">total completed time</p>
              </div>
            </Card>
          </div>

          {stats.averageAccuracy > 0 && (
            <Card>
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Phishing Accuracy</h3>
                  <span className="font-mono text-sm sagp-text-cyan">{stats.averageAccuracy}%</span>
                </div>
                <ProgressBar value={stats.averageAccuracy} max={100} />
              </div>
            </Card>
          )}

          <Card>
            <div className="border-b border-cyan-300/15 p-6">
              <h3 className="font-semibold text-white">Recent Completed Games</h3>
            </div>
            <div className="divide-y divide-cyan-300/10">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-white">{session.modules?.title || 'Training Game'}</p>
                    <p className="text-xs sagp-text-muted">
                      {session.ended_at ? new Date(session.ended_at).toLocaleString() : 'Completed'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={session.passed ? 'success' : 'destructive'}>
                      {session.passed ? 'Cleared' : 'Review Needed'}
                    </Badge>
                    <span className="font-semibold sagp-text-cyan">{session.score || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
