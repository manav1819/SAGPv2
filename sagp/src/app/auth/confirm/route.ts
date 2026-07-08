import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /auth/confirm
 *
 * Single landing point for every Supabase email link:
 *   - signup confirmation   (type=signup / type=email)
 *   - magic link sign-in    (type=magiclink / type=email)
 *   - password recovery     (type=recovery)
 *
 * Supabase appends ?token_hash=...&type=... to whatever `emailRedirectTo` /
 * `redirectTo` was passed when the email was requested (see
 * src/lib/auth/actions.ts and src/lib/site-url.ts). This route exchanges
 * that token for a session (verifyOtp), then redirects to `next`
 * (defaults to /dashboard; password-reset links pass next=/reset-password).
 *
 * IMPORTANT: this route must stay reachable for unauthenticated requests —
 * it's listed as a public passthrough in src/lib/supabase/middleware.ts.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }

    const failureUrl = new URL('/login', origin);
    failureUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(failureUrl);
  }

  const invalidUrl = new URL('/login', origin);
  invalidUrl.searchParams.set('error', 'Invalid or expired confirmation link');
  return NextResponse.redirect(invalidUrl);
}
