import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createModule, listModules } from '@/engines/training';
import { NextRequest, NextResponse } from 'next/server';

interface CreateModuleRequest {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  game_type: 'quiz' | 'phishing_sim' | 'scenario' | 'drag_drop';
  points_value: number;
  estimated_mins: number;
  compliance_tags: string[];
  prerequisites: string[];
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

    const params = request.nextUrl.searchParams;
    const category = params.get('category');
    const difficulty = params.get('difficulty');
    const isActive = params.get('is_active') === 'true';

    const filters: any = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (params.get('is_active') !== null) filters.is_active = isActive;

    const modules = await listModules(membership.org_id, filters);

    return NextResponse.json({ modules });
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

    // Check if user is org admin
    const { data: membership } = await client
      .from('org_memberships')
      .select('org_id, org_role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership || !['org_admin', 'superadmin'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: CreateModuleRequest = await request.json();

    const module = await createModule(
      {
        ...body,
        org_id: membership.org_id,
      },
      user.id
    );

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 400 }
    );
  }
}
