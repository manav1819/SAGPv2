import type { Achievement, AchievementId } from '@/types/game';

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
  first_investigation: {
    id: 'first_investigation',
    title: 'First Investigation',
    description: 'Complete your first scenario.',
    iconKey: 'shield',
    xpReward: 100,
  },
  red_flag_spotter: {
    id: 'red_flag_spotter',
    title: 'Red Flag Spotter',
    description: 'Identify 10 social engineering red flags across all scenarios.',
    iconKey: 'flag',
    xpReward: 250,
  },
  verification_master: {
    id: 'verification_master',
    title: 'Verification Master',
    description: 'Request caller verification in 5 different scenarios.',
    iconKey: 'badge-check',
    xpReward: 300,
  },
  zero_leaks: {
    id: 'zero_leaks',
    title: 'Zero Leaks',
    description: 'Complete 3 scenarios without leaking any information.',
    iconKey: 'lock',
    xpReward: 500,
  },
  speed_analyst: {
    id: 'speed_analyst',
    title: 'Speed Analyst',
    description: 'Correctly identify and end a scam call in under 60 seconds.',
    iconKey: 'zap',
    xpReward: 200,
  },
  clue_hunter: {
    id: 'clue_hunter',
    title: 'Clue Hunter',
    description: 'Discover 20 hidden clues across all scenarios.',
    iconKey: 'search',
    xpReward: 400,
  },
  perfect_escalation: {
    id: 'perfect_escalation',
    title: 'Perfect Escalation',
    description: 'Achieve a perfect clear on any Hard difficulty scenario.',
    iconKey: 'trending-up',
    xpReward: 750,
  },
  master_investigator: {
    id: 'master_investigator',
    title: 'Master Investigator',
    description: 'Complete all 8 scenarios with a success outcome.',
    iconKey: 'award',
    xpReward: 2000,
  },
};
