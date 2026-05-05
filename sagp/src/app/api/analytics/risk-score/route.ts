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
      .select('org_id, org_role')
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
    const targetUserId = params.get('userId') || user.id;

    // Check if user has permission to view this data
    if (targetUserId !== user.id) {
      if (!['org_admin', 'manager', 'superadmin'].includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Get latest risk score
    const { data: riskScore } = await client
      .from('risk_scores')
      .select()
      .eq('user_id', targetUserId)
      .eq('org_id', membership.org_id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (!riskScore) {
      return NextResponse.json({
        total_score: 0,
        risk_tier: 'low',
        phishing_susceptibility: 0,
        incorrect_answer_rate: 0,
        reaction_time_deviation: 0,
        remediation_failure_rate: 0,
        computed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(riskScore);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
