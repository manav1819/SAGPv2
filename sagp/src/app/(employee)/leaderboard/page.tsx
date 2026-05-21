'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Medal, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank: number;
  total_points: number;
  badges_earned: number;
  streak_days: number;
  modules_completed: number;
  profiles?: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const SCOPES = [
  { label: 'Organization', value: 'org' },
  { label: 'Department', value: 'department' },
  { label: 'Weekly', value: 'weekly' },
];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('org');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/gamification/leaderboard?scope=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.leaderboard || []);
      } else {
        setEntries([]);
      }
      setIsLoading(false);
    };

    loadLeaderboard();
  }, [activeTab]);

  const topThree = entries.slice(0, 3);

  const displayName = (entry: LeaderboardEntry) => {
    if (entry.user_id === user?.id) {
      return profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'You';
    }
    return (
      entry.profiles?.display_name ||
      `${entry.profiles?.first_name || ''} ${entry.profiles?.last_name || ''}`.trim() ||
      `Player ${entry.user_id.slice(0, 8)}`
    );
  };

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white sagp-neon-text">
          Leaderboard
        </h1>
        <p className="mt-1 sagp-text-muted">Rankings appear after completed game activity.</p>
      </div>

      {topThree.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {topThree.map((entry) => (
            <Card key={entry.id} className="text-center">
              <div className="p-6">
                <Medal className="mx-auto mb-4 h-10 w-10 sagp-text-green" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] sagp-text-muted">
                  Rank #{entry.rank}
                </p>
                <h3 className="mb-2 mt-2 text-lg font-semibold text-white">{displayName(entry)}</h3>
                <p className="mb-4 text-2xl font-bold sagp-text-cyan">{entry.total_points}</p>
                <div className="flex justify-center gap-3 text-sm sagp-text-muted">
                  <span>{entry.modules_completed} completed</span>
                  <span>{entry.badges_earned} badges</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="border-b border-cyan-300/15 bg-transparent">
          {SCOPES.map((scope) => (
            <TabsTrigger
              key={scope.value}
              value={scope.value}
              className="border-b-2 border-transparent text-slate-400 data-[state=active]:border-teal-500 data-[state=active]:text-white"
            >
              {scope.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SCOPES.map((scope) => (
          <TabsContent key={scope.value} value={scope.value}>
            <Card className="mt-6">
              {isLoading ? (
                <div className="p-8 text-center sagp-text-muted">Loading leaderboard...</div>
              ) : entries.length === 0 ? (
                <div className="p-8 text-center">
                  <Trophy className="mx-auto mb-4 h-10 w-10 sagp-text-cyan" />
                  <h2 className="font-heading text-xl font-bold text-white">No rankings yet</h2>
                  <p className="mx-auto mt-2 max-w-xl sagp-text-muted">
                    Complete a game to create the first leaderboard entry.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cyan-300/15">
                        <th className="px-6 py-4 text-left font-medium sagp-text-muted">Rank</th>
                        <th className="px-6 py-4 text-left font-medium sagp-text-muted">Name</th>
                        <th className="px-6 py-4 text-right font-medium sagp-text-muted">Points</th>
                        <th className="px-6 py-4 text-center font-medium sagp-text-muted">Badges</th>
                        <th className="px-6 py-4 text-center font-medium sagp-text-muted">Streak</th>
                        <th className="px-6 py-4 text-center font-medium sagp-text-muted">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`border-b border-cyan-300/10 transition-colors ${
                            entry.user_id === user?.id ? 'bg-cyan-300/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-white">#{entry.rank}</td>
                          <td className="px-6 py-4 text-white">
                            {displayName(entry)}
                            {entry.user_id === user?.id && <Badge className="ml-2">You</Badge>}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold sagp-text-cyan">
                            {entry.total_points}
                          </td>
                          <td className="px-6 py-4 text-center text-white">{entry.badges_earned}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 sagp-text-green">
                              <Flame className="h-4 w-4" />
                              <span>{entry.streak_days}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-white">{entry.modules_completed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
