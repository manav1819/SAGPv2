import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Service-role client — bypasses RLS for writes
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Helper: get or create the phishing_sim module ──────────────────────────
async function getPhishingModuleId(): Promise<string | null> {
  // Try to find the module
  const { data: existing } = await serviceClient
    .from('modules')
    .select('id')
    .eq('game_type', 'phishing_sim')
    .eq('title', 'Phishing Simulator')
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Insert it if missing (idempotent — will only run once)
  const { data: inserted, error } = await serviceClient
    .from('modules')
    .insert({
      title:          'Phishing Simulator',
      description:    'Test your ability to identify phishing emails. 10 emails, 3 lives — spot the threats before they catch you.',
      category:       'phishing',
      difficulty:     'medium',
      game_type:      'phishing_sim',
      points_value:   500,
      estimated_mins: 5,
      is_active:      true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[phishing/complete] Failed to create module:', error.message);
    return null;
  }
  return inserted.id;
}

// ── POST /api/game/phishing/complete ──────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the caller
    const userClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the user's org membership
    const { data: membership } = await serviceClient
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.org_id) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 400 });
    }
    const orgId = membership.org_id;

    // 3. Parse body
    const body = await request.json();
    const { won, sessionData } = body as {
      won:         boolean;
      sessionData: {
        sessionRef:        string;
        finalScore:        number;
        livesUsed:         number;
        livesRemaining:    number;
        accuracy:          number;
        avgResponseTimeMs: number;
        emails: Array<{
          emailNum:    number;
          sender:      string;
          subject:     string;
          trueLabel:   number;
          trueType:    string;
          userGuess:   string;
          correct:     boolean;
          timeTakenMs: number;
        }>;
      };
    };

    if (!sessionData) {
      return NextResponse.json({ error: 'Missing sessionData' }, { status: 400 });
    }

    // 4. Get (or auto-create) the phishing simulator module
    const moduleId = await getPhishingModuleId();
    if (!moduleId) {
      return NextResponse.json({ error: 'Could not resolve module' }, { status: 500 });
    }

    // 5. Determine time_bucket based on average response time
    const avgSecs = (sessionData.avgResponseTimeMs || 0) / 1000;
    const timeBucket: 'less' | 'medium' | 'more' =
      avgSecs < 8  ? 'less'   :
      avgSecs < 18 ? 'medium' :
                     'more';

    // 6. Save game_session
    const { data: session, error: sessionError } = await serviceClient
      .from('game_sessions')
      .insert({
        user_id:             user.id,
        module_id:           moduleId,
        org_id:              orgId,
        status:              'completed',
        score:               sessionData.finalScore,
        passed:              won,
        time_bucket:         timeBucket,
        time_taken_seconds:  Math.round((sessionData.avgResponseTimeMs * sessionData.emails.length) / 1000),
        attempt_number:      1,
        game_state: {
          sessionRef:      sessionData.sessionRef,
          accuracy:        sessionData.accuracy,
          livesUsed:       sessionData.livesUsed,
          livesRemaining:  sessionData.livesRemaining,
          avgResponseTimeMs: sessionData.avgResponseTimeMs,
          emailCount:      sessionData.emails.length,
          // Full email breakdown stored here — visible to admin in DB
          emails:          sessionData.emails,
        },
        ended_at:  new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[phishing/complete] session insert error:', sessionError.message);
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    }

    const dbSessionId = session.id;

    // 7. Save game_events (one per email answered)
    if (sessionData.emails.length > 0) {
      const events = sessionData.emails.map(e => ({
        session_id:          dbSessionId,
        user_id:             user.id,
        event_type:          'answer' as const,
        question_index:      e.emailNum - 1,
        reaction_ms:         e.timeTakenMs,          // admin-visible, NOT shown to employee
        time_to_select_ms:   e.timeTakenMs,
        is_correct:          e.correct,
        choice_selected:     e.userGuess,
        points_delta:        0,                       // not tracking per-event points
        metadata: {
          sender:    e.sender,
          subject:   e.subject,
          trueLabel: e.trueLabel,
          trueType:  e.trueType,
        },
      }));

      const { error: eventsError } = await serviceClient
        .from('game_events')
        .insert(events);

      if (eventsError) {
        // Non-fatal — session is already saved
        console.warn('[phishing/complete] events insert warning:', eventsError.message);
      }
    }

    // 8. Upsert progress record
    await serviceClient
      .from('progress')
      .upsert(
        {
          user_id:      user.id,
          module_id:    moduleId,
          org_id:       orgId,
          status:       won ? 'completed' : 'in_progress',
          best_score:   sessionData.finalScore,
          attempts:     1,
          completed_at: won ? new Date().toISOString() : null,
        },
        {
          onConflict:         'user_id,module_id',
          ignoreDuplicates:   false,
        }
      );

    return NextResponse.json({ success: true, passed: won, sessionId: dbSessionId });
  } catch (err) {
    console.error('[phishing/complete] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
