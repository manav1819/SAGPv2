'use client';

import { useEffect, useState } from 'react';
import { Check, Flame, Medal, Trophy, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  badges_earned: number;
  streak_days: number;
  modules_completed: number;
}

interface GameResult {
  game_title: string;
  score: number;
  max_score: number;
  passed: boolean;
  ended_at: string;
}

// Raw shape of a `leaderboard` row as it actually exists in the DB — no
// display_name column (that lives on `profiles`); resolved via a second
// batch query below for every ranked user, not just the current one.
interface LeaderboardRow {
  user_id: string;
  total_points: number;
  badges_earned: number;
  streak_days: number;
  modules_completed: number;
}

interface SessionRow {
  module_id: string | null;
  score: number | null;
  passed: boolean | null;
  ended_at: string;
}

interface ModuleRow {
  id: string;
  title: string;
}

// 'Global' and 'Weekly' dropped: the leaderboard engine
// (src/engines/gamification/leaderboard.ts) only ever writes 'org' and
// 'department' scope rows, so those tabs could never show real data.
type LeaderboardScope = 'Organisation' | 'Department';

export default function LeaderboardPage() {
  const { profile, membership, isLoading: authLoading } = useAuth();
  const orgId = membership?.org_id;
  const [scope, setScope] = useState<LeaderboardScope>('Organisation');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [userResults, setUserResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id || !orgId) {
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const scopeMap: Record<LeaderboardScope, 'org' | 'department'> = {
          Organisation: 'org',
          Department: 'department',
        };

        const hasDepartment = Boolean(membership?.department);

        // Department scope with no department assigned has nothing to show —
        // skip the query entirely rather than returning other departments'
        // rows (there's no department filter to apply otherwise).
        if (scope === 'Department' && !hasDepartment) {
          setRankings([]);
        } else {
          let leaderboardQuery = supabase
            .from('leaderboard')
            .select('user_id, total_points, badges_earned, streak_days, modules_completed')
            .eq('org_id', orgId)
            .eq('scope', scopeMap[scope])
            .order('total_points', { ascending: false })
            .order('updated_at', { ascending: true })
            .order('user_id', { ascending: true })
            .limit(50);

          if (scope === 'Department' && membership?.department) {
            leaderboardQuery = leaderboardQuery.eq('department', membership.department);
          }

          const { data: leaderboardData, error: leaderboardError } = await leaderboardQuery;
          if (leaderboardError) throw leaderboardError;

          const leaderboardRows = (leaderboardData ?? []) as LeaderboardRow[];
          const rankedUserIds = [...new Set(leaderboardRows.map((r) => r.user_id).filter(Boolean))];
          const nameMap = new Map<string, string>();

          if (rankedUserIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, display_name, first_name, last_name, email')
              .in('id', rankedUserIds);

            for (const p of profilesData ?? []) {
              const name =
                p.display_name?.trim() ||
                [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
                p.email;
              nameMap.set(p.id, name);
            }
          }

          setRankings(
            leaderboardRows.map((r) => ({
              ...r,
              display_name: nameMap.get(r.user_id) ?? (r.user_id === profile.id ? 'You' : 'Player'),
            }))
          );
        }

        // Fetch current user's game results
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('game_sessions')
          .select('id, module_id, score, passed, ended_at')
          .eq('user_id', profile.id)
          .eq('org_id', orgId)
          .eq('status', 'completed')
          .order('ended_at', { ascending: false })
          .limit(20);

        if (sessionsError) throw sessionsError;

        // Resolve module titles to game titles
        const sessionRows = (sessionsData ?? []) as SessionRow[];
        const moduleIds = [...new Set(sessionRows.map((session) => session.module_id).filter((id): id is string => Boolean(id)))];
        const moduleMap = new Map<string, { title: string; maxScore: number }>();

        if (moduleIds.length > 0) {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('id, title')
            .in('id', moduleIds);

          for (const m of (modulesData ?? []) as ModuleRow[]) {
            moduleMap.set(m.id, { title: m.title, maxScore: 1000 }); // TODO: Get maxScore from games config
          }
        }

        const results = sessionRows.map((session) => {
          const gameModule = session.module_id ? moduleMap.get(session.module_id) : undefined;
          return {
            game_title: gameModule?.title ?? 'Unknown Game',
            score: session.score ?? 0,
            max_score: gameModule?.maxScore ?? 1000,
            passed: session.passed ?? false,
            ended_at: session.ended_at,
          };
        });

        setUserResults(results);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [profile?.id, orgId, membership?.department, scope]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-amber-300" aria-label="First place" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-200" aria-label="Second place" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" aria-label="Third place" />;
    return null;
  };

  if (authLoading) {
    return (
      <div className="sagp-content-area p-6 lg:p-8 space-y-6">
        <div className="text-center text-sagp-muted">Loading leaderboard...</div>
      </div>
    );
  }

  if (!profile?.id || !orgId) {
    return (
      <div className="sagp-content-area p-6 lg:p-8">
        <div className="sagp-card p-6 text-center text-sagp-muted">
          Leaderboard access requires an active organisation membership.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sagp-content-area p-6 lg:p-8 space-y-6">
        <div className="text-center text-sagp-muted">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      {/* Scope tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-3 overflow-x-auto">
        {(['Organisation', 'Department'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 rounded-t transition-colors whitespace-nowrap ${
              scope === s
                ? 'sagp-heading-4 border-b-2 border-cyan-500 text-cyan-400'
                : 'sagp-text-muted hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rankings Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="sagp-heading-2 flex items-center gap-2">
            <Trophy className="h-6 w-6 sagp-text-accent" />
            Top Rankings
          </h2>

          {error ? (
            <div className="sagp-card bg-red-950/20 border border-red-900/40 p-4 text-red-400 text-center">
              {error}
            </div>
          ) : rankings.length === 0 ? (
            <div className="sagp-card flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Medal className="h-10 w-10 sagp-text-muted opacity-30" />
              <p className="sagp-text-muted">No rankings available yet</p>
            </div>
          ) : (
            <div className="sagp-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-sagp-muted">#</th>
                    <th className="px-4 py-3 text-left text-sagp-muted">User</th>
                    <th className="px-4 py-3 text-right text-sagp-muted">Points</th>
                    <th className="px-4 py-3 text-right text-sagp-muted">Badges</th>
                    <th className="px-4 py-3 text-right text-sagp-muted">Streak</th>
                    <th className="px-4 py-3 text-right text-sagp-muted">Modules</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry, idx) => {
                    const isCurrentUser = entry.user_id === profile?.id;
                    const medal = getMedalIcon(idx + 1);
                    return (
                      <tr
                        key={entry.user_id}
                        className={`border-b border-slate-800 transition-colors ${
                          isCurrentUser
                            ? 'bg-cyan-500/10 border-cyan-500/40'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-3 text-white font-semibold">
                          {medal ?? idx + 1}
                        </td>
                        <td className={`px-4 py-3 ${isCurrentUser ? 'text-cyan-300 font-semibold' : 'text-white'}`}>
                          {entry.display_name}
                          {isCurrentUser && <span className="ml-2 text-xs sagp-badge-success">You</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-cyan-400 font-semibold">{entry.total_points}</td>
                        <td className="px-4 py-3 text-right text-purple-400">{entry.badges_earned ?? 0}</td>
                        <td className="px-4 py-3 text-right text-orange-400">
                          <span className="inline-flex items-center justify-end gap-1">
                            {entry.streak_days ?? 0}<Flame className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">{entry.modules_completed ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User's Game Results */}
        <div className="space-y-4">
          <h2 className="sagp-heading-2">Your Results</h2>

          {userResults.length === 0 ? (
            <div className="sagp-card flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="sagp-text-muted text-sm">No results yet</p>
              <a href="/games" className="sagp-btn sagp-btn-primary text-sm">
                Start Playing
              </a>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userResults.map((result, idx) => (
                <div
                  key={idx}
                  className="sagp-card p-3 bg-slate-800/50 border border-slate-700/50 hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white flex-1">{result.game_title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        result.passed
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {result.passed ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
                        {result.passed ? 'Pass' : 'Fail'}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-sagp-muted">
                      <span>Score</span>
                      <span className="text-cyan-400 font-semibold">
                        {result.score}/{result.max_score}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded h-1.5">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, (result.score / result.max_score) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-sagp-muted mt-2">
                    {new Date(result.ended_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
