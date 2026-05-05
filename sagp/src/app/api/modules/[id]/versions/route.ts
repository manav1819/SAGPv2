import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getModuleVersions, restoreVersion } from '@/engines/training';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const versions = await getModuleVersions(id);

    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface RestoreVersionRequest {
  versionId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check permissions
    const { data: module } = await client
      .from('modules')
      .select('org_id')
      .eq('id', id)
      .single();

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    const { data: membership } = await client
      .from('org_memberships')
      .select('org_role')
      .eq('user_id', user.id)
      .eq('org_id', module.org_id)
      .single();

    if (!membership || !['org_admin', 'superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: RestoreVersionRequest = await request.json();

    const restored = await restoreVersion(id, body.versionId, user.id);

    return NextResponse.json(restored, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 400 }
    );
  }
}
