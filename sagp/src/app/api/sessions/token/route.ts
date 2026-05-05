import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const client = await createServerSupabaseClient();
    const { sessionId } = await request.json();

    // Get session
    const { data: session, error: sessionError } = await client
      .from('game_sessions')
      .select()
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Generate JWT token for game server
    const token = Buffer.from(
      JSON.stringify({
        sessionId: session.id,
        userId: session.user_id,
        moduleId: session.module_id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64');

    const gameUrl = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';

    return NextResponse.json({
      token,
      gameUrl,
      sessionId,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
