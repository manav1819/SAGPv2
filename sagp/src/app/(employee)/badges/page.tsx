'use client';

import { useEffect, useState } from 'react';
import { Award, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';

interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  badge_type: string;
  earned_at: string;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      const response = await fetch('/api/gamification/badges');
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges || []);
      }
      setIsLoading(false);
    };

    loadBadges();
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white sagp-neon-text">
          Badge Collection
        </h1>
        <p className="mt-1 sagp-text-muted">Earned badges appear after completed game activity.</p>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center sagp-text-muted">Loading earned badges...</Card>
      ) : badges.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="mx-auto mb-4 h-10 w-10 sagp-text-cyan" />
          <h2 className="font-heading text-xl font-bold text-white">No badges earned yet</h2>
          <p className="mx-auto mt-2 max-w-xl sagp-text-muted">
            Badges unlock only after you complete qualifying modules or games.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <div className="p-6">
                <p className="text-sm sagp-text-muted">Badges Earned</p>
                <p className="text-3xl font-bold text-white">{badges.length}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm sagp-text-muted">Latest Badge</p>
                <p className="text-3xl font-bold sagp-text-cyan">{badges[0]?.name}</p>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-white">Earned Badges</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {badges.map((badge) => (
                <Card
                  key={badge.id}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="p-6 text-center">
                    <div className="mb-3 text-4xl">{badge.icon_url || '🏆'}</div>
                    <h3 className="mb-2 font-semibold text-white">{badge.name}</h3>
                    <Badge className="mb-3">{badge.badge_type}</Badge>
                    <p className="mb-4 text-xs sagp-text-muted">{badge.description}</p>
                    <p className="text-xs sagp-text-soft">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                    <button className="mt-3 flex w-full items-center justify-center gap-2 text-xs sagp-text-cyan hover:text-white">
                      <Share2 className="h-3 w-3" />
                      Share
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <Card className="max-w-md" onClick={(event) => event.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="mb-4 text-6xl">{selectedBadge.icon_url || '🏆'}</div>
              <h2 className="mb-2 text-2xl font-bold text-white">{selectedBadge.name}</h2>
              <Badge className="mb-4">{selectedBadge.badge_type}</Badge>
              <p className="mb-4 sagp-text-muted">{selectedBadge.description}</p>
              <p className="mb-6 text-sm sagp-text-cyan">
                Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
              </p>
              <Button onClick={() => setSelectedBadge(null)} className="w-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
