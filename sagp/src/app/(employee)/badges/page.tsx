'use client';

import { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  badge_type: string;
  earned_at: string;
}

interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  badge_type: string;
  earned: boolean;
  earned_at?: string;
}

export default function BadgesPage() {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchBadges = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch user's earned badges
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('badges(id, name, description, icon_url, badge_type), earned_at')
          .eq('user_id', profile.id);

        if (userBadgesError) throw userBadgesError;

        // Create a set of earned badge IDs
        const earnedBadgeIds = new Set(
          (userBadgesData ?? []).map((ub: any) => ub.badges?.id)
        );
        const earnedMap = new Map(
          (userBadgesData ?? []).map((ub: any) => [ub.badges?.id, ub.earned_at])
        );

        // Fetch all available badges
        const { data: allBadgesData, error: allBadgesError } = await supabase
          .from('badges')
          .select('id, name, description, icon_url, badge_type')
          .order('name', { ascending: true });

        if (allBadgesError) throw allBadgesError;

        // Combine data
        const allBadges = (allBadgesData ?? []).map((badge: any) => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon_url: badge.icon_url,
          badge_type: badge.badge_type,
          earned: earnedBadgeIds.has(badge.id),
          earned_at: earnedMap.get(badge.id),
        }));

        setBadges(allBadges);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setError('Failed to load badges');
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [profile?.id]);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  if (loading) {
    return (
      <div className="sagp-content-area p-6 lg:p-8 space-y-6">
        <div className="text-center text-sagp-muted">Loading badges...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sagp-content-area p-6 lg:p-8 space-y-6">
        <div className="sagp-card bg-red-950/20 border border-red-900/40 p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="sagp-content-area p-6 lg:p-8 space-y-6">
        <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Lock className="h-12 w-12 sagp-text-muted opacity-30" />
          <p className="sagp-heading-3 sagp-text-muted">No badges yet</p>
          <p className="sagp-text-muted text-sm max-w-xs">
            Complete games, maintain streaks, and ace phishing simulations to unlock badges.
          </p>
          <a href="/games" className="sagp-btn sagp-btn-primary mt-2">
            Start Training
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-8">
      {/* Earned Badges Section */}
      {earnedBadges.length > 0 && (
        <div className="space-y-4">
          <h2 className="sagp-heading-2 flex items-center gap-2">
            <Award className="h-6 w-6 sagp-text-accent" />
            Earned Badges ({earnedBadges.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="sagp-card bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-cyan-500/40 p-4 flex flex-col items-center gap-3 hover:border-cyan-500/60 transition-colors"
              >
                <div className="h-16 w-16 flex items-center justify-center text-3xl rounded-lg bg-cyan-500/20">
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} className="h-12 w-12" />
                  ) : (
                    <Award className="h-12 w-12 sagp-text-accent" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="sagp-heading-4 text-white">{badge.name}</h3>
                  <p className="sagp-text-muted text-sm mt-1">{badge.description}</p>
                </div>
                <div className="text-xs text-cyan-400 mt-2">
                  Earned {new Date(badge.earned_at!).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges Section */}
      {lockedBadges.length > 0 && (
        <div className="space-y-4">
          <h2 className="sagp-heading-2 flex items-center gap-2">
            <Lock className="h-6 w-6 sagp-text-muted" />
            Locked Badges ({lockedBadges.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="sagp-card bg-slate-900/50 border border-slate-700/40 p-4 flex flex-col items-center gap-3 opacity-60 hover:opacity-75 transition-opacity"
              >
                <div className="h-16 w-16 flex items-center justify-center text-3xl rounded-lg bg-slate-700/30 grayscale">
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} className="h-12 w-12" />
                  ) : (
                    <Award className="h-12 w-12 text-slate-500" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="sagp-heading-4 text-slate-400">{badge.name}</h3>
                  <p className="sagp-text-muted text-sm mt-1">{badge.description}</p>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
