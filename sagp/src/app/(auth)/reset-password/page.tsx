'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updatePassword } from '@/lib/auth/actions';

/**
 * /reset-password
 *
 * Reached only after /auth/confirm exchanges a recovery token_hash for a
 * session (see src/app/auth/confirm/route.ts). Middleware requires
 * authentication for this route, so if a recovery session wasn't
 * established the user is bounced to /login first.
 */
export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsPending(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error ?? 'Could not update password');
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="sagp-card sagp-card-glow w-full p-8">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="sagp-brand-mark h-12 w-12">
          <Image src="/sagp-logo.png" alt="SAGP" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
        <h1 className="sagp-heading-2 sagp-neon-text">Set New Password</h1>
        <p className="sagp-text-muted text-sm">Choose a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="sagp-label text-xs" htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="sagp-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="sagp-label text-xs" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
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
          {isPending ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
