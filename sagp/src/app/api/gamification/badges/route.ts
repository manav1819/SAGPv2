import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface BadgeRow {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_type: string;
}

export async function GET() {
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

    // Get user's badges
    const { data: userBadges } = await client
      .from('user_badges')
      .select('*, badges: badge_id (id, name, description, icon_url, badge_type)')
      .eq('user_id', user.id);

    const badges = userBadges?.map((ub) => ({
      ...(ub.badges as BadgeRow),
      earned_at: ub.earned_at,
    })) || [];

    return NextResponse.json({
      badges,
      total_earned: badges.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
