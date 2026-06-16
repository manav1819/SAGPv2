'use client';

import { useState } from 'react';
import { ShieldCheck, Mail } from 'lucide-react';
import { requestPasswordReset } from '@/lib/auth/actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await requestPasswordReset(email);
      // Always show the "sent" state, even on failure, so we don't leak
      // whether an email address has an account (standard practice).
      if (!result.success) {
        console.error('[forgot-password]', result.error);
      }
      setSent(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="sagp-card sagp-card-glow w-full p-8">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="sagp-brand-mark h-12 w-12">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="sagp-heading-2 sagp-neon-text">Reset Password</h1>
        <p className="sagp-text-muted text-sm text-center">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <Mail className="h-10 w-10 sagp-text-primary" />
          <p className="sagp-text-muted text-sm">
            If an account exists for <strong className="text-slate-200">{email}</strong>,
            a password reset link is on its way. Check your inbox.
          </p>
          <a href="/login" className="sagp-link text-sm">
            Back to sign in
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="sagp-label text-xs" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="sagp-input"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-400 border border-red-500/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="sagp-btn sagp-btn-primary w-full"
          >
            {isPending ? 'Sending…' : 'Send Reset Link'}
          </button>

          <p className="text-center text-xs sagp-text-muted">
            <a href="/login" className="sagp-link">
              Back to sign in
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
