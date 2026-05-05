import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public endpoint — returns the org list for the sign-up dropdown.
// Only exposes id, name, and domain (no join code).
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const { data, error } = await serviceClient
      .from('organizations')
      .select('id, name, domain')
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/organizations]', error.message);
      return NextResponse.json({ message: 'Failed to fetch organisations' }, { status: 500 });
    }

    return NextResponse.json({ organizations: data ?? [] });
  } catch (err) {
    console.error('[GET /api/organizations] unexpected error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
