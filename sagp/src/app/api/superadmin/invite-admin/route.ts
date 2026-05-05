import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function requireSuperadmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'superadmin') return null;
  return user;
}

// POST — invite a new Admin for an organisation
export async function POST(request: NextRequest) {
  const caller = await requireSuperadmin();
  if (!caller) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { email, orgId, firstName, lastName } = await request.json();

    if (!email || !orgId) {
      return NextResponse.json({ message: 'email and orgId are required' }, { status: 400 });
    }

    // Verify the org exists
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .maybeSingle();

    if (orgError || !org) {
      return NextResponse.json({ message: 'Organisation not found' }, { status: 400 });
    }

    // Send invite via Supabase Auth admin API
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: {
          first_name: firstName?.trim() ?? '',
          last_name:  lastName?.trim()  ?? '',
          role:       'org_admin',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }
    );

    if (inviteError) {
      // If the user already exists in auth, we can still promote them
      const msg = inviteError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        // Try to find and promote the existing user
        const { data: existingProfile } = await serviceClient
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (existingProfile) {
          await serviceClient
            .from('profiles')
            .update({ role: 'org_admin' })
            .eq('id', existingProfile.id);

          await serviceClient
            .from('org_memberships')
            .upsert(
              { user_id: existingProfile.id, org_id: orgId, org_role: 'org_admin' },
              { onConflict: 'user_id,org_id' }
            );

          return NextResponse.json({ message: 'Existing user promoted to Admin for this organisation.' });
        }
      }
      return NextResponse.json({ message: inviteError.message }, { status: 400 });
    }

    const adminUserId = inviteData.user.id;

    // Upsert profile with org_admin role
    await serviceClient
      .from('profiles')
      .upsert(
        {
          id:           adminUserId,
          email:        email.toLowerCase().trim(),
          first_name:   firstName?.trim() ?? '',
          last_name:    lastName?.trim()  ?? '',
          display_name: firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : email,
          role:         'org_admin',
          is_active:    true,
        },
        { onConflict: 'id' }
      );

    // Create org membership
    await serviceClient
      .from('org_memberships')
      .upsert(
        { user_id: adminUserId, org_id: orgId, org_role: 'org_admin' },
        { onConflict: 'user_id,org_id' }
      );

    return NextResponse.json(
      { message: `Invite sent to ${email}. They will receive an email to set their password.` },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/superadmin/invite-admin]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
