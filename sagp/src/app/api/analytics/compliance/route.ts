import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateComplianceReport, getCompletionMatrix } from '@/engines/analytics/compliance';
import { NextRequest, NextResponse } from 'next/server';
import type { ComplianceFramework } from '@/types/database';

interface GenerateReportRequest {
  framework: ComplianceFramework;
}

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

    // Check if user has permission to view compliance reports
    if (!['org_admin', 'superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const params = request.nextUrl.searchParams;
    const framework = params.get('framework') as ComplianceFramework;
    const includeMatrix = params.get('matrix') === 'true';

    if (!framework) {
      return NextResponse.json(
        { error: 'Framework parameter required' },
        { status: 400 }
      );
    }

    // Get latest report for this framework
    const { data: reports } = await client
      .from('compliance_reports')
      .select()
      .eq('org_id', membership.org_id)
      .eq('framework', framework)
      .order('generated_at', { ascending: false })
      .limit(1);

    let report = reports?.[0];

    // Generate new report if not found or if stale (>1 day old)
    if (!report || new Date(report.generated_at).getTime() < Date.now() - 86400000) {
      report = await generateComplianceReport(
        membership.org_id,
        framework,
        user.id
      );
    }

    let matrix = null;
    if (includeMatrix) {
      matrix = await getCompletionMatrix(membership.org_id, framework);
    }

    return NextResponse.json({
      report,
      matrix: includeMatrix ? matrix : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check if user has permission to generate reports
    if (!['org_admin', 'superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: GenerateReportRequest = await request.json();

    const report = await generateComplianceReport(
      membership.org_id,
      body.framework,
      user.id
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
