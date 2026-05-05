import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // ── Public (auth) routes ────────────────────────────────────────────────
  const authRoutes = ['/login', '/register', '/sso-callback', '/oauth'];
  if (authRoutes.some(r => path.startsWith(r))) {
    if (user) {
      // Already logged in — check if they need to complete their profile first
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        // New OAuth user: redirect to complete-profile
        const url = request.nextUrl.clone();
        url.pathname = '/complete-profile';
        return NextResponse.redirect(url);
      }

      // Fully registered → send to the right dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role ?? 'employee';
      let dest: string;
      if (role === 'superadmin') {
        dest = '/superadmin/dashboard';
      } else if (role === 'org_admin') {
        dest = '/admin/dashboard';
      } else {
        dest = '/dashboard';
      }

      const url = request.nextUrl.clone();
      url.pathname = dest;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // /complete-profile — authenticated users only, never redirect mid-setup
  if (path.startsWith('/complete-profile')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── All other routes require authentication ─────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // ── Fetch role for protected-route checks (one query, reused below) ─────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? 'employee';

  // ── Superadmin-only routes (/superadmin/**) ──────────────────────────────
  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') {
      const url = request.nextUrl.clone();
      // Redirect to their appropriate dashboard
      url.pathname = role === 'org_admin' ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── Admin routes — org_admin and superadmin only ─────────────────────────
  if (path.startsWith('/admin')) {
    if (!['superadmin', 'org_admin'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── Employee routes — block admins from accidentally landing here ────────
  // (Admins who visit /dashboard, /modules, etc. get redirected to admin panel)
  const employeeRoutes = ['/dashboard', '/modules', '/leaderboard', '/badges', '/profile', '/game'];
  if (employeeRoutes.some(r => path.startsWith(r))) {
    if (role === 'superadmin') {
      const url = request.nextUrl.clone();
      url.pathname = '/superadmin/dashboard';
      return NextResponse.redirect(url);
    }
    if (role === 'org_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
