import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Profile, OrgMembership } from '@/types/database';

/**
 * GET /api/auth/profile
 *
 * Returns the authenticated user's profile and org memberships.
 * Called by AuthProvider on mount and on every auth-state change.
 *
 * Response shape:
 *   { profile: Profile | null, organizations: OrgMembership[] }
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', profile: null, organizations: [] },
        { status: 401 }
      );
    }

    // Fetch the user's profile row
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[/api/auth/profile] profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: profileError.message, profile: null, organizations: [] },
        { status: 500 }
      );
    }

    // Fetch all org memberships (array — caller takes [0] as primary org)
    const { data: memberships } = await supabase
      .from('org_memberships')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      profile: (profile as Profile) ?? null,
      organizations: (memberships as OrgMembership[]) ?? [],
    });
  } catch (err) {
    console.error('[/api/auth/profile] unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', profile: null, organizations: [] },
      { status: 500 }
    );
  }
}
