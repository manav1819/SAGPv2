import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkPrerequisites } from '@/engines/training';
import { NextRequest, NextResponse } from 'next/server';

interface CreateSessionRequest {
  module_id: string;
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

    const body: CreateSessionRequest = await request.json();

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

    // Check prerequisites
    const hasPrerequisites = await checkPrerequisites(user.id, body.module_id);

    if (!hasPrerequisites) {
      return NextResponse.json(
        { error: 'Prerequisites not met' },
        { status: 403 }
      );
    }

    // Get module
    const { data: module } = await client
      .from('modules')
      .select()
      .eq('id', body.module_id)
      .single();

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Get latest module version
    const { data: latestVersion } = await client
      .from('module_versions')
      .select()
      .eq('module_id', body.module_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    // Check if user already has an incomplete session for this module
    const { data: existingSession } = await client
      .from('game_sessions')
      .select()
      .eq('user_id', user.id)
      .eq('module_id', body.module_id)
      .neq('status', 'completed')
      .limit(1)
      .single();

    // Get or count attempts
    const { data: attempts } = await client
      .from('game_sessions')
      .select()
      .eq('user_id', user.id)
      .eq('module_id', body.module_id)
      .eq('status', 'completed');

    const attemptNumber = (attempts?.length || 0) + 1;

    // Create session
    const { data: session, error: sessionError } = await client
      .from('game_sessions')
      .insert({
        user_id: user.id,
        module_id: body.module_id,
        module_version_id: latestVersion?.id || '',
        org_id: membership.org_id,
        status: 'in_progress',
        score: null,
        passed: null,
        time_taken_seconds: null,
        attempt_number: attemptNumber,
        integrity_flag: false,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 400 }
      );
    }

    // Generate JWT token for game server
    const token = Buffer.from(
      JSON.stringify({
        sessionId: session.id,
        userId: user.id,
        moduleId: body.module_id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64');

    return NextResponse.json({
      session,
      token,
      module: {
        id: module.id,
        title: module.title,
        game_type: module.game_type,
        points_value: module.points_value,
        estimated_mins: module.estimated_mins,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
