'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { signInWithEmail, signInWithSSO } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    setIsLoading(true);

    try {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        setError(result.error ?? 'Login failed');
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsPending(false);
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: 'google' | 'azure' | 'okta') => {
    setError(null);
    setIsPending(true);
    const result = await signInWithSSO(provider);
    if (!result.success || !result.url) {
      setError(result.error ?? 'SSO failed');
      setIsPending(false);
    } else {
      window.location.href = result.url;
    }
  };

  return (
    <div className="sagp-card sagp-card-glow w-full p-8">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="sagp-brand-mark h-12 w-12">
          <ShieldCheck className="h-6 w-6" />
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
          <label className="sagp-label text-xs" htmlFor="password">Password</label>
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
  );
}
