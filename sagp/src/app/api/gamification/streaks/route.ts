import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const client = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await client
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    // Get user's streak
    const { data: streak, error: streakError } = await client
      .from('user_streaks')
      .select()
      .eq('user_id', user.id)
      .eq('org_id', membership.org_id)
      .single();

    if (streakError && streakError.code !== 'PGRST116') {
      throw streakError;
    }

    if (!streak) {
      return NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        streak_freeze_days: [],
      });
    }

    return NextResponse.json(streak);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
