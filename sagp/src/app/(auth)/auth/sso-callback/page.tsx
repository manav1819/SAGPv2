'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * /auth/sso-callback
 *
 * This is the OAuth redirectTo target used by signInWithSSO() in actions.ts:
 *   redirectTo: `${NEXT_PUBLIC_APP_URL}/auth/sso-callback`
 *
 * Supabase appends ?code=... to this URL after the provider approves the
 * login. The Supabase JS client automatically exchanges the code for a
 * session when the page mounts (via the onAuthStateChange listener in
 * AuthProvider, or the explicit getUser() call below).
 *
 * After the exchange, we redirect to /dashboard and let the server-side
 * middleware route the user to the correct role-based dashboard.
 */
export default function AuthSSOCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // exchangeCodeForSession reads ?code from the URL automatically
    supabase.auth.exchangeCodeForSession(window.location.href).then(
      ({ error }) => {
        if (error) {
          console.error('[/auth/sso-callback] code exchange failed:', error.message);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        } else {
          // Middleware will redirect to the role-appropriate dashboard
          router.replace('/dashboard');
        }
      }
    );
  }, [router]);

  return (
    <div className="sagp-card sagp-card-glow w-full p-8 text-center">
      <div className="mb-6 flex justify-center">
        <div className="sagp-brand-mark h-12 w-12 animate-pulse">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>
      <h2 className="sagp-heading-3 sagp-neon-text mb-2">Completing Sign-In…</h2>
      <p className="sagp-text-muted text-sm">
        Verifying your credentials with the identity provider.
      </p>
    </div>
  );
}
