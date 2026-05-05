import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface SaveGameStateRequest {
  sessionId: string;
  gameState: Record<string, unknown>;
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

    const body: SaveGameStateRequest = await request.json();

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

    // Update game state
    const { data: updated, error: updateError } = await client
      .from('game_sessions')
      .update({
        game_state: body.gameState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save game state' },
        { status: 400 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
