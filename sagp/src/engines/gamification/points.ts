import { createServiceRoleClient } from '@/lib/supabase/server';
import type { GameSession, Module } from '@/types/database';

interface SessionWithModule {
  user_id: string;
  org_id: string;
  module_id: string;
  points_value?: number;
  estimated_mins?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  passed?: boolean;
  integrity_flag?: boolean;
  attempt_number?: number;
  time_taken_seconds?: number;
}

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.3,
};

export async function calculatePoints(
  session: SessionWithModule,
  module: Module | any,
  timeTakenSeconds: number
): Promise<number> {
  const client = await createServiceRoleClient();

  const basePoints = module?.points_value || session.points_value || 100;
  const estimatedMins = module?.estimated_mins || session.estimated_mins || 5;
  const difficulty = module?.difficulty || session.difficulty || 'medium';
  const passed = session.passed || false;
  const attemptNumber = session.attempt_number || 1;

  // Return 0 if failed
  if (!passed) {
    return 0;
  }

  // Apply difficulty multiplier
  let points = basePoints * (DIFFICULTY_MULTIPLIERS[difficulty] || 1.0);

  // Speed bonus: +20% if completed in less than 60% of estimated time
  const estimatedSeconds = estimatedMins * 60;
  if (timeTakenSeconds < estimatedSeconds * 0.6) {
    points *= 1.2;
  }

  // First-attempt bonus: +15% if attempt 1 and passed
  if (attemptNumber === 1) {
    points *= 1.15;
  }

  // Streak multiplier - get user's current streak
  const { data: streak } = await client
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', session.user_id)
    .eq('org_id', session.org_id)
    .single();

  if (streak?.current_streak) {
    const streakBonus = Math.min(streak.current_streak * 0.01, 0.25);
    points *= 1 + streakBonus;
  }

  // Check for phishing report bonus
  const { data: events } = await client
    .from('game_events')
    .select()
    .eq('session_id', (session as any).id || '')
    .eq('event_type', 'report_submitted');

  if (events && events.length > 0) {
    points += 50;
  }

  // Integrity hold - if flagged, return 0
  if (session.integrity_flag) {
    return 0;
  }

  return Math.round(points);
}
