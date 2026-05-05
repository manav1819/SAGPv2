import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Anon client — used only to call auth.signUp (works with publishable key)
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Service-role client — used for DB writes that bypass RLS.
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, orgId, joinCode, department } =
      await request.json();

    // ── 1. Basic validation ──────────────────────────────────────────────────
    if (!firstName?.trim() || !lastName?.trim() || !email || !password || !orgId || !joinCode?.trim()) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // ── 2. Look up the selected organisation ────────────────────────────────
    const { data: org, error: orgLookupError } = await serviceClient
      .from('organizations')
      .select('id, name, domain, join_code')
      .eq('id', orgId)
      .maybeSingle();

    if (orgLookupError || !org) {
      return NextResponse.json({ message: 'Organisation not found' }, { status: 400 });
    }

    // ── 3. Validate join code ────────────────────────────────────────────────
    if (org.join_code.toUpperCase() !== joinCode.trim().toUpperCase()) {
      return NextResponse.json(
        { message: 'Invalid join code. Please check with your Admin.', code: 'INVALID_JOIN_CODE' },
        { status: 400 }
      );
    }

    // ── 4. Validate email domain (if org has a domain restriction) ───────────
    if (org.domain) {
      const emailDomain = cleanEmail.split('@')[1] ?? '';
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

    // ── 5. Duplicate email check ─────────────────────────────────────────────
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { message: 'An account with this email already exists.', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    // ── 6. Create auth user — role is always 'employee' ──────────────────────
    const { data: authData, error: authError } = await anonClient.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          role:       'employee',
        },
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return NextResponse.json(
          { message: 'An account with this email already exists.', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { message: 'Account created — please check your email to confirm before logging in.' },
        { status: 201 }
      );
    }

    const userId = authData.user.id;

    // ── 7. Upsert profile — always employee ──────────────────────────────────
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert(
        {
          id:           userId,
          email:        cleanEmail,
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
          role:         'employee',
          display_name: `${firstName.trim()} ${lastName.trim()}`,
          is_active:    true,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[register] profile upsert error:', profileError.message);
    }

    // ── 8. Upsert org membership ─────────────────────────────────────────────
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
      console.error('[register] membership error:', membershipError.message);
    }

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: { id: userId, email: cleanEmail, role: 'employee' },
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('[register] unexpected error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
