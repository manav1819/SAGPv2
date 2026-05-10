'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * /oauth/consent
 *
 * Entry-point for the Google OAuth flow.
 * Supabase generates a "Preview Authorization URL" pointing here so you can
 * test the full sign-in round-trip from the dashboard.
 *
 * Visiting this page immediately triggers supabase.auth.signInWithOAuth, which
 * redirects the browser to Google's consent screen.  After the user approves,
 * Google sends them back to /sso-callback where the session is created.
 */
export default function OAuthConsentPage() {
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/sso-callback`,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-slate-300">Redirecting to Google…</p>
      </div>
    </div>
  );
}
