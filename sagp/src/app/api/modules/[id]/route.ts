import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getModuleWithVersion,
  updateModule,
  toggleModuleActive,
} from '@/engines/training';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateModuleRequest {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points_value?: number;
  estimated_mins?: number;
  compliance_tags?: string[];
  prerequisites?: string[];
  change_notes?: string;
}

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

    const moduleWithVersion = await getModuleWithVersion(id);

    return NextResponse.json(moduleWithVersion);
  } catch (error) {
    return NextResponse.json(
      { error: 'Module not found' },
      { status: 404 }
    );
  }
}

export async function PATCH(
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

    const body: UpdateModuleRequest = await request.json();

    const updated = await updateModule(id, body, user.id);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 400 }
    );
  }
}

export async function DELETE(
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

    if (!membership || !['superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Soft delete by deactivating
    const deleted = await toggleModuleActive(id);

    return NextResponse.json(deleted);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 400 }
    );
  }
}
