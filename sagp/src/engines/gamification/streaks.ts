import { createServiceRoleClient } from '@/lib/supabase/server';
import type { UserStreak } from '@/types/database';

export async function updateStreak(userId: string, orgId: string): Promise<UserStreak> {
  const client = await createServiceRoleClient();

  const today = new Date().toISOString().split('T')[0];

  // Get or create streak record
  let { data: streak, error: fetchError } = await client
    .from('user_streaks')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (!streak) {
    // Create new streak
    const { data: newStreak, error: createError } = await client
      .from('user_streaks')
      .insert({
        user_id: userId,
        org_id: orgId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        streak_freeze_days: [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;
    return newStreak;
  }

  const lastActivityDate = new Date(streak.last_activity_date).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const streakFreezeExcluded = (streak.streak_freeze_days || []).some(
    (date: string) => date === today
  );

  let currentStreak = streak.current_streak || 0;
  let longestStreak = streak.longest_streak || 0;

  if (streakFreezeExcluded) {
    // Don't increment on freeze days
  } else if (lastActivityDate === today) {
    // Already completed today
  } else if (lastActivityDate === yesterday) {
    // Continuing streak
    currentStreak += 1;
    longestStreak = Math.max(currentStreak, longestStreak);
  } else {
    // Streak broken, reset to 1
    currentStreak = 1;
  }

  const { data: updated, error: updateError } = await client
    .from('user_streaks')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated;
}

export async function checkStreakFreeze(
  orgId: string,
  date: string
): Promise<string[]> {
  const client = await createServiceRoleClient();

  // Fetch organization settings to check for excluded days (holidays, etc.)
  const { data: org } = await client
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  const settings = org?.settings as Record<string, any>;
  const excludedDates = settings?.streak_freeze_dates || [];

  return excludedDates;
}

export async function addStreakFreezeDay(
  userId: string,
  orgId: string,
  date: string
): Promise<UserStreak> {
  const client = await createServiceRoleClient();

  const { data: streak } = await client
    .from('user_streaks')
    .select()
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (!streak) {
    throw new Error('Streak not found');
  }

  const freezeDays = streak.streak_freeze_days || [];
  if (!freezeDays.includes(date)) {
    freezeDays.push(date);
  }

  const { data: updated, error } = await client
    .from('user_streaks')
    .update({
      streak_freeze_days: freezeDays,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}
