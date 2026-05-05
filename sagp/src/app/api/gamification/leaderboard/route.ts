import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLeaderboard } from '@/engines/gamification/leaderboard';
import { NextRequest, NextResponse } from 'next/server';
import type { LeaderboardScope } from '@/types/database';

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
      .select('org_id, department')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const params = request.nextUrl.searchParams;
    const scope = (params.get('scope') || 'org') as LeaderboardScope;
    const limit = parseInt(params.get('limit') || '100');

    const leaderboard = await getLeaderboard(
      scope,
      membership.org_id,
      scope === 'department' ? membership.department || undefined : undefined
    );

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, limit),
      total: leaderboard.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
