import { createServiceRoleClient } from '@/lib/supabase/server';
import { processSessionCompletion } from '@/engines/gamification';
import { processGameEvents } from '@/engines/analytics';
import { NextRequest, NextResponse } from 'next/server';

interface CompleteSessionRequest {
  sessionId: string;
  score: number;
  passed: boolean;
  timeTakenSeconds: number;
  integrityFlag: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token (basic validation)
    try {
      const decoded = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8')
      );

      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await createServiceRoleClient();

    const body: CompleteSessionRequest = await request.json();

    // Get session
    const { data: session } = await client
      .from('game_sessions')
      .select()
      .eq('id', body.sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session
    const { data: updated, error: updateError } = await client
      .from('game_sessions')
      .update({
        status: 'completed',
        score: body.score,
        passed: body.passed,
        time_taken_seconds: body.timeTakenSeconds,
        integrity_flag: body.integrityFlag,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 400 }
      );
    }

    // Update progress
    const { data: existingProgress } = await client
      .from('progress')
      .select()
      .eq('user_id', session.user_id)
      .eq('module_id', session.module_id)
      .eq('org_id', session.org_id)
      .single();

    if (existingProgress) {
      await client
        .from('progress')
        .update({
          status: body.passed ? 'completed' : 'in_progress',
          best_score: Math.max(
            existingProgress.best_score || 0,
            body.score
          ),
          attempts: (existingProgress.attempts || 0) + 1,
          completed_at: body.passed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);
    } else {
      await client.from('progress').insert({
        user_id: session.user_id,
        module_id: session.module_id,
        org_id: session.org_id,
        status: body.passed ? 'completed' : 'in_progress',
        best_score: body.score,
        attempts: 1,
        completed_at: body.passed ? new Date().toISOString() : null,
      });
    }

    // Process gamification (calculate points, badges, streaks, etc.)
    try {
      await processSessionCompletion(body.sessionId);
    } catch (error) {
      console.error('Gamification processing error:', error);
      // Continue even if gamification fails
    }

    // Process analytics
    try {
      await processGameEvents(body.sessionId);
    } catch (error) {
      console.error('Analytics processing error:', error);
      // Continue even if analytics fails
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Session completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
