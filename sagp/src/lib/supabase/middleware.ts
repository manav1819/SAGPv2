import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveUserRole, dashboardPathForRole } from '@/lib/auth/resolve-role';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // /auth/confirm is the emailRedirectTo/redirectTo target for signup
  // confirmation, magic-link, and password-reset emails (see
  // src/app/auth/confirm/route.ts + src/lib/site-url.ts). It must always be
  // reachable — regardless of auth state — so the route handler can exchange
  // the token_hash for a session and issue its own redirect. Never gate this
  // behind the authenticated/unauthenticated checks below.
  if (path.startsWith('/auth/confirm')) {
    return supabaseResponse;
  }

  // Public (auth) routes
  // IMPORTANT: /auth/sso-callback is the OAuth redirectTo URL used by
  // signInWithSSO() in actions.ts (NEXT_PUBLIC_APP_URL + /auth/sso-callback).
  // It must be listed here so Supabase can exchange the auth code BEFORE a
  // session exists. Without it the middleware bounces the unauthenticated
  // callback to /login, breaking SSO entirely.
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/sso-callback',
    '/auth/sso-callback',
    '/oauth',
  ];
  if (authRoutes.some(r => path.startsWith(r))) {
    if (user) {
      // org_memberships is the source of truth for role once a user has
      // joined an org; profiles.role only applies as a fallback for
      // platform-level superadmins with no org membership. See
      // resolveUserRole() for why (bugfix 2026-07-10: a stale
      // profiles.role='superadmin' was overriding a real org_admin
      // membership and misrouting the user).
      const resolved = await resolveUserRole(supabase, user.id);

      if (!resolved.hasMembership && resolved.role !== 'superadmin') {
        const url = request.nextUrl.clone();
        url.pathname = '/complete-profile';
        return NextResponse.redirect(url);
      }

      const url = request.nextUrl.clone();
      url.pathname = dashboardPathForRole(resolved.role);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // /complete-profile: authenticated users only, never redirect mid-setup
  if (path.startsWith('/complete-profile')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Resolve role for protected-route checks. org_memberships wins over
  // profiles.role — see resolveUserRole() for the rationale.
  const resolved = await resolveUserRole(supabase, user.id);
  const role = resolved.role;

  // Users with no org membership (and no platform-superadmin fallback) are
  // locked out of every protected route until they redeem a join code.
  // Without this, someone could sign up and hit /dashboard or /games
  // directly, bypassing the "join an organisation" gate entirely.
  if (!resolved.hasMembership && role !== 'superadmin') {
    const url = request.nextUrl.clone();
    url.pathname = '/complete-profile';
    return NextResponse.redirect(url);
  }

  // Superadmin-only routes
  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'org_admin' || role === 'manager' ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Admin routes: org_admin, manager, and superadmin only
  if (path.startsWith('/admin')) {
    if (!['superadmin', 'org_admin', 'manager'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Employee routes: redirect admins to their panel if they land here.
  const employeeRoutes = [
    '/dashboard',
    '/games',
    '/leaderboard',
    '/badges',
    '/profile',
    '/game',
  ];
  if (employeeRoutes.some(r => path.startsWith(r))) {
    if (role === 'superadmin') {
      const url = request.nextUrl.clone();
      url.pathname = '/superadmin/dashboard';
      return NextResponse.redirect(url);
    }
    if (role === 'org_admin' || role === 'manager') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
