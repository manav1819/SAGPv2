'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Share2, Lock } from 'lucide-react';

const BADGE_TYPES: Record<string, { color: string; icon: string }> = {
  Achievement: { color: 'text-purple-400', icon: '🏆' },
  Streak: { color: 'text-orange-400', icon: '🔥' },
  Score: { color: 'text-blue-400', icon: '⭐' },
  Completion: { color: 'text-green-400', icon: '✅' },
  'Phish Hunter': { color: 'text-red-400', icon: '🎣' },
  'Speed Run': { color: 'text-yellow-400', icon: '⚡' },
  Special: { color: 'text-pink-400', icon: '💎' },
};

const MOCK_BADGES = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Complete your first module',
    type: 'Completion',
    earned: true,
    earnedDate: '2024-02-15',
    rarity: 'Common',
  },
  {
    id: 2,
    name: '7-Day Streak',
    description: 'Maintain a 7-day training streak',
    type: 'Streak',
    earned: true,
    earnedDate: '2024-03-10',
    rarity: 'Uncommon',
  },
  {
    id: 3,
    name: 'Phishing Master',
    description: 'Achieve 95%+ on 5 phishing modules',
    type: 'Phish Hunter',
    earned: true,
    earnedDate: '2024-02-28',
    rarity: 'Rare',
  },
  {
    id: 4,
    name: 'Speed Demon',
    description: 'Complete a module in 50% of estimated time',
    type: 'Speed Run',
    earned: true,
    earnedDate: '2024-03-05',
    rarity: 'Uncommon',
  },
  {
    id: 5,
    name: 'Perfect Score',
    description: 'Achieve 100% on any module',
    type: 'Score',
    earned: false,
    earnedDate: null,
    rarity: 'Rare',
  },
  {
    id: 6,
    name: 'Security Guardian',
    description: 'Complete all compliance modules',
    type: 'Achievement',
    earned: false,
    earnedDate: null,
    rarity: 'Epic',
  },
  {
    id: 7,
    name: '30-Day Streak',
    description: 'Maintain a 30-day training streak',
    type: 'Streak',
    earned: false,
    earnedDate: null,
    rarity: 'Epic',
  },
  {
    id: 8,
    name: 'Legend',
    description: 'Earn 10,000 total XP',
    type: 'Special',
    earned: false,
    earnedDate: null,
    rarity: 'Legendary',
  },
];

const RARITY_COLORS: Record<string, string> = {
  Common: 'bg-slate-700',
  Uncommon: 'bg-green-900',
  Rare: 'bg-blue-900',
  Epic: 'bg-purple-900',
  Legendary: 'bg-yellow-900',
};

export default function BadgesPage() {
  const [selectedBadge, setSelectedBadge] = useState<(typeof MOCK_BADGES)[0] | null>(null);

  const earnedBadges = MOCK_BADGES.filter((b) => b.earned);
  const lockedBadges = MOCK_BADGES.filter((b) => !b.earned);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Badge Collection</h1>
        <p className="mt-1 text-slate-400">
          Earn badges by completing achievements and reaching milestones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <p className="text-sm text-slate-400">Badges Earned</p>
            <p className="text-3xl font-bold text-white">
              {earnedBadges.length} / {MOCK_BADGES.length}
            </p>
          </div>
        </Card>
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <p className="text-sm text-slate-400">Completion Rate</p>
            <p className="text-3xl font-bold text-teal-400">
              {Math.round((earnedBadges.length / MOCK_BADGES.length) * 100)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-white">Earned Badges</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {earnedBadges.map((badge) => {
              const badgeInfo = BADGE_TYPES[badge.type] || BADGE_TYPES['Achievement'];
              return (
                <Card
                  key={badge.id}
                  className={`cursor-pointer border-slate-700 transition-transform hover:scale-105 ${
                    RARITY_COLORS[badge.rarity]
                  }`}
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="p-6 text-center">
                    <div className="mb-3 text-4xl">{badgeInfo.icon}</div>
                    <h3 className="mb-1 font-semibold text-white">{badge.name}</h3>
                    <Badge className="mb-3 border-slate-600 bg-slate-700 text-slate-200">
                      {badge.rarity}
                    </Badge>
                    <p className="mb-4 text-xs text-slate-400">{badge.description}</p>
                    <p className="text-xs text-slate-500">
                      Earned {badge.earnedDate}
                    </p>
                    <button className="mt-3 flex items-center justify-center gap-2 text-xs text-teal-400 hover:text-teal-300 w-full">
                      <Share2 className="h-3 w-3" />
                      Share
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-white">Locked Badges</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {lockedBadges.map((badge) => {
              const badgeInfo = BADGE_TYPES[badge.type] || BADGE_TYPES['Achievement'];
              return (
                <Card
                  key={badge.id}
                  className="border-slate-700 bg-slate-800 opacity-60"
                >
                  <div className="relative p-6 text-center">
                    {/* Lock Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900 bg-opacity-50">
                      <Lock className="h-8 w-8 text-slate-400" />
                    </div>

                    <div className="mb-3 text-4xl blur-sm">{badgeInfo.icon}</div>
                    <h3 className="mb-1 font-semibold text-slate-400 blur-sm">
                      {badge.name}
                    </h3>
                    <Badge className="mb-3 border-slate-600 bg-slate-700 text-slate-500">
                      {badge.rarity}
                    </Badge>
                    <p className="mb-4 text-xs text-slate-500">{badge.description}</p>
                    <p className="text-xs text-slate-600">Locked</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <Card
            className="border-slate-700 bg-slate-800 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="mb-4 text-6xl">
                {BADGE_TYPES[selectedBadge.type]?.icon || '🏆'}
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">{selectedBadge.name}</h2>
              <Badge className={`mb-4 ${RARITY_COLORS[selectedBadge.rarity]} text-white`}>
                {selectedBadge.rarity}
              </Badge>
              <p className="mb-4 text-slate-400">{selectedBadge.description}</p>
              {selectedBadge.earned && (
                <p className="mb-6 text-sm text-teal-400">
                  Earned on {selectedBadge.earnedDate}
                </p>
              )}
              <Button
                onClick={() => setSelectedBadge(null)}
                variant="primary"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
