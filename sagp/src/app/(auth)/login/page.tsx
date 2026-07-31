'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmail, signInWithSSO, signInWithMagicLink } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/stores/auth-store';

const matrixBits = [
  '0101101010010110',
  '1010011100101101',
  '0011010110100101',
  '1100101011010010',
  '0110010111010100',
  '1001110100101011',
  '0100111011010010',
  '1110010100110101',
  '0010110101101001',
  '1011010010110010',
  '0110100101110010',
  '1101011010010100',
  '0100101110011010',
  '1010110010101101',
  '0011101011010010',
  '1101001010110100',
];

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLinkPending, setIsMagicLinkPending] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoginComplete(false);
    setIsPending(true);
    setIsLoading(true);

    try {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        setError(result.error ?? 'Login failed');
      } else {
        setIsLoginComplete(true);
        router.push('/dashboard');
      }
    } finally {
      setIsPending(false);
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your email above first, then click "Email me a magic link"');
      return;
    }
    setError(null);
    setIsMagicLinkPending(true);
    try {
      const result = await signInWithMagicLink(email);
      if (!result.success) {
        setError(result.error ?? 'Could not send magic link');
      } else {
        setMagicLinkSent(true);
      }
    } finally {
      setIsMagicLinkPending(false);
    }
  };

  const handleSSO = async (provider: 'google' | 'azure' | 'okta') => {
    setError(null);
    setIsLoginComplete(false);
    setIsPending(true);
    const result = await signInWithSSO(provider);
    if (!result.success || !result.url) {
      setError(result.error ?? 'SSO failed');
      setIsPending(false);
    } else {
      setIsLoginComplete(true);
      window.location.assign(result.url);
    }
  };

  return (
    <div className={`sagp-card sagp-card-glow sagp-login-panel w-full p-8 ${isLoginComplete ? 'is-authenticated' : ''}`}>
      <div className="sagp-login-matrix-flow" aria-hidden="true">
        {matrixBits.map((bits, index) => (
          <span
            key={`${bits}-${index}`}
            style={{
              '--login-matrix-left': `${7 + index * 5.8}%`,
              '--login-matrix-delay': `${index * -0.31}s`,
              '--login-matrix-start-x': `${(index - 8) * -0.08}rem`,
              '--login-matrix-end-x': `${(8 - index) * 0.16}rem`,
            } as CSSProperties}
          >
            {bits}
          </span>
        ))}
      </div>

      <div className="sagp-login-content">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="sagp-brand-mark h-12 w-12">
          <Image src="/sagp-logo.png" alt="SAGP" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
        <h1 className="sagp-heading-2 sagp-neon-text">SAGP</h1>
        <p className="sagp-text-muted text-sm">Security Awareness Gamification Platform</p>
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="sagp-label text-xs" htmlFor="password">Password</label>
            <a href="/forgot-password" className="sagp-link text-xs">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="sagp-input"
          />
        </div>

        {magicLinkSent && (
          <p className="rounded-md bg-cyan-900/20 px-3 py-2 text-xs text-cyan-300 border border-cyan-500/30">
            Magic link sent to {email}. Check your inbox.
          </p>
        )}

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
          {isPending ? 'Signing in…' : 'Sign In'}
        </button>

        <button
          type="button"
          disabled={isMagicLinkPending}
          onClick={handleMagicLink}
          className="sagp-btn sagp-btn-ghost w-full text-xs"
        >
          {isMagicLinkPending ? 'Sending magic link…' : 'Email me a magic link instead'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700" />
        <span className="sagp-text-muted text-xs">or continue with</span>
        <div className="h-px flex-1 bg-slate-700" />
      </div>

      {/* SSO buttons */}
      <div className="flex flex-col gap-2">
        {(['google', 'azure', 'okta'] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={isPending}
            onClick={() => handleSSO(provider)}
            className="sagp-btn sagp-btn-secondary w-full capitalize"
          >
            {provider === 'azure' ? 'Microsoft / Azure' : provider}
          </button>
        ))}
      </div>

      {/* Register link */}
      <p className="mt-6 text-center text-xs sagp-text-muted">
        No account?{' '}
        <a href="/register" className="sagp-link">
          Create one
        </a>
      </p>
      </div>
    </div>
  );
}
