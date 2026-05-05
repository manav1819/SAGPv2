import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service-role client for DB writes that bypass RLS
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // ── 1. Identify the caller from their Supabase session cookie ────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll:    () => cookieStore.getAll(),
          setAll:    () => {},
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Parse body ────────────────────────────────────────────────────────
    const { orgId, joinCode, department } = await request.json();

    if (!orgId) {
      return NextResponse.json({ message: 'Organisation is required' }, { status: 400 });
    }
    if (!joinCode?.trim()) {
      return NextResponse.json({ message: 'Join code is required' }, { status: 400 });
    }

    const userId    = user.id;
    const userEmail = user.email ?? '';

    // ── 3. Look up organisation ───────────────────────────────────────────────
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, name, domain, join_code')
      .eq('id', orgId)
      .maybeSingle();

    if (orgError || !org) {
      return NextResponse.json({ message: 'Organisation not found' }, { status: 400 });
    }

    // ── 4. Validate join code ────────────────────────────────────────────────
    if (org.join_code.toUpperCase() !== joinCode.trim().toUpperCase()) {
      return NextResponse.json(
        { message: 'Invalid join code. Please check with your Admin.', code: 'INVALID_JOIN_CODE' },
        { status: 400 }
      );
    }

    // ── 5. Validate email domain ─────────────────────────────────────────────
    if (org.domain) {
      const emailDomain = userEmail.split('@')[1] ?? '';
      const orgDomain   = org.domain.replace(/^@/, '').toLowerCase();
      if (emailDomain.toLowerCase() !== orgDomain) {
        return NextResponse.json(
          {
            message: `Your email must use the @${orgDomain} domain for this organisation.`,
            code: 'DOMAIN_MISMATCH',
          },
          { status: 400 }
        );
      }
    }

    // ── 6. Upsert profile — always employee for OAuth sign-up flow ───────────
    const firstName   = user.user_metadata?.full_name?.split(' ')[0] ?? '';
    const lastName    = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '';
    const displayName = user.user_metadata?.full_name ?? userEmail;

    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert(
        {
          id:           userId,
          email:        userEmail,
          first_name:   firstName,
          last_name:    lastName,
          display_name: displayName,
          role:         'employee',
          is_active:    true,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[complete-profile] profile upsert error:', profileError.message);
    }

    // ── 7. Upsert org membership ──────────────────────────────────────────────
    const { error: membershipError } = await serviceClient
      .from('org_memberships')
      .upsert(
        {
          user_id:    userId,
          org_id:     org.id,
          department: department || null,
          org_role:   'employee',
        },
        { onConflict: 'user_id,org_id' }
      );

    if (membershipError) {
      console.error('[complete-profile] membership error:', membershipError.message);
    }

    return NextResponse.json(
      { message: 'Profile completed', role: 'employee' },
      { status: 200 }
    );

  } catch (err) {
    console.error('[complete-profile] unexpected error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
