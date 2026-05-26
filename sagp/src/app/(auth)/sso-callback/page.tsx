'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * /sso-callback
 *
 * Supabase SSO providers redirect here after successful OAuth.
 * We exchange the code for a session then forward the user to
 * their role-appropriate dashboard (middleware handles the role split).
 *
 * Note: the signInWithSSO action uses /auth/sso-callback as the
 * redirectTo URL — if you change that, update both files.
 */
export default function SSOCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Middleware will redirect to the right dashboard based on role
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <div className="sagp-card sagp-card-glow w-full p-8 text-center">
      <div className="mb-6 flex justify-center">
        <div className="sagp-brand-mark h-12 w-12 animate-pulse">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>
      <h2 className="sagp-heading-3 sagp-neon-text mb-2">Completing Sign-In…</h2>
      <p className="sagp-text-muted text-sm">Please wait while we verify your credentials.</p>
    </div>
  );
}
