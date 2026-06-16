/**
 * getSiteURL()
 *
 * Single source of truth for the app's public base URL, used to build
 * Supabase auth email redirects (signup confirmation, magic link,
 * password reset) and OAuth redirectTo targets.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL       — explicit override. Set this in every
 *                                  environment (.env.local for dev,
 *                                  Vercel Project Settings → Environment
 *                                  Variables for Preview/Production).
 *   2. NEXT_PUBLIC_VERCEL_URL /  — auto-injected by Vercel at build time
 *      VERCEL_URL                 (no protocol, e.g. "sag-pv2.vercel.app").
 *                                  Used as a safety net if NEXT_PUBLIC_APP_URL
 *                                  was not configured for a given deployment.
 *   3. http://localhost:3000     — local dev fallback.
 *
 * The result never has a trailing slash, so callers can safely do
 * `${getSiteURL()}/auth/confirm`.
 */
export function getSiteURL(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return withProtocol.replace(/\/+$/, '');
}
