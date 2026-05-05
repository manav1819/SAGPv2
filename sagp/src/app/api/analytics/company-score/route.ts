import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computeCompanyScore, getScoreHistory } from '@/engines/analytics/company-score';
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

    // Check if user has permission to view company score
    if (!['org_admin', 'manager', 'superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const params = request.nextUrl.searchParams;
    const includeHistory = params.get('history') === 'true';
    const historyDays = parseInt(params.get('historyDays') || '30');

    const companyScore = await computeCompanyScore(membership.org_id);

    let history = null;
    if (includeHistory) {
      history = await getScoreHistory(membership.org_id, historyDays);
    }

    return NextResponse.json({
      current: companyScore,
      history: includeHistory ? history : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
