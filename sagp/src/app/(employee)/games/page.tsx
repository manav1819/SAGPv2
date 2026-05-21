'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge-ui';
import { Gamepad2, Shield, Clock, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

const GAMES = [
  {
    id:          'phishing',
    title:       'Phishing Simulator',
    description: 'Can you spot the phishing emails? Test your instincts against 10 real-world email scenarios. Each correct identification keeps you in the game — one wrong move costs a life.',
    category:    'Security Awareness',
    difficulty:  'Medium',
    estimatedMins: 5,
    points:      500,
    icon:        '🎣',
    href:        '/game/phishing',
    available:   true,
    matchTitles:  ['Phishing Simulator'],
  },
  {
    id:          '3d-escape',
    title:       '3D Cyber Escape',
    description: 'Navigate a 3D environment, solve security challenges, and escape threats in a fully immersive browser-based training game.',
    category:    'Immersive Simulation',
    difficulty:  'Hard',
    estimatedMins: 8,
    points:      750,
    icon:        '🕹️',
    href:        '/3dGame',
    available:   true,
    matchTitles:  ['3D Cyber Escape', 'Cyber Escape'],
  },
];

interface LatestSession {
  score: number | null;
  passed: boolean | null;
  ended_at: string | null;
  modules:
    | {
        title: string;
      }
    | null;
}

export default function GamesPage() {
  const { user, isLoading } = useAuth();
  const [latestByGame, setLatestByGame] = useState<Record<string, LatestSession>>({});

  useEffect(() => {
    if (isLoading || !user) return;

    const loadLatestScores = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('game_sessions')
        .select('score, passed, ended_at, modules:module_id(title)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false });

      const sessions = ((data as unknown[]) || []).map((row) => {
        const session = row as Omit<LatestSession, 'modules'> & {
          modules: LatestSession['modules'] | LatestSession['modules'][] | null;
        };

        return {
          ...session,
          modules: Array.isArray(session.modules) ? session.modules[0] || null : session.modules,
        };
      });

      const nextLatest: Record<string, LatestSession> = {};
      for (const game of GAMES) {
        const latest = sessions.find((session) =>
          game.matchTitles.some((title) =>
            (session.modules?.title || '').toLowerCase().includes(title.toLowerCase())
          )
        );
        if (latest) nextLatest[game.id] = latest;
      }
      setLatestByGame(nextLatest);
    };

    loadLatestScores();
  }, [isLoading, user]);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Games</h1>
        <p className="mt-1 text-slate-400">
          Interactive security training games — test your skills and earn points
        </p>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(game => (
          <Card key={game.id} className="border-slate-700 bg-slate-800 flex flex-col">
            <div className="p-6 flex-1">
              {/* Icon + badges row */}
              <div className="mb-4 flex items-start justify-between">
                <span className="text-5xl">{game.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="border-0 bg-teal-900 text-teal-200">{game.difficulty}</Badge>
                  <Badge className="border-0 bg-slate-700 text-slate-300">{game.category}</Badge>
                </div>
              </div>

              {/* Title & description */}
              <h2 className="mb-2 text-lg font-bold text-white">{game.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{game.description}</p>

              {latestByGame[game.id] ? (
                <div className="mb-4 rounded border border-cyan-300/20 bg-cyan-950/30 px-3 py-2 text-xs text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span>Last result</span>
                    <span className="font-semibold text-cyan-200">
                      {latestByGame[game.id].score || 0} pts
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-slate-400">
                    <span>{latestByGame[game.id].passed ? 'Cleared' : 'Review needed'}</span>
                    <span>
                      {latestByGame[game.id].ended_at
                        ? new Date(latestByGame[game.id].ended_at || '').toLocaleDateString()
                        : 'Completed'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-500">
                  No completed run yet
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{game.estimatedMins} min
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {game.points} pts
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  3 lives
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-slate-700 p-4">
              {game.available ? (
                <Link href={game.href} className="block">
                  <Button variant="primary" className="w-full gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Play Now
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full cursor-not-allowed opacity-50">
                  Coming Soon
                </Button>
              )}
            </div>
          </Card>
        ))}

      </div>
    </div>
  );
}
