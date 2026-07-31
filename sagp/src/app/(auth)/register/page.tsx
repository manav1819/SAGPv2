'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signUpWithEmail } from '@/lib/auth/actions';

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signUpWithEmail(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: 'employee',
      });

      if (!result.success) {
        setError(result.error ?? 'Registration failed');
      } else {
        // Supabase may send a confirmation email; redirect to login with a hint
        router.push('/login');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="sagp-card sagp-card-glow w-full p-8">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="sagp-brand-mark h-12 w-12">
          <Image src="/sagp-logo.png" alt="SAGP" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
        <h1 className="sagp-heading-2 sagp-neon-text">Create Account</h1>
        <p className="sagp-text-muted text-sm">Join your organisation's security programme</p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="sagp-label text-xs" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="sagp-input"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="sagp-label text-xs" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              className="sagp-input"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="sagp-label text-xs" htmlFor="email">Work email</label>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
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
          {isPending ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs sagp-text-muted">
        Already have an account?{' '}
        <a href="/login" className="sagp-link">
          Sign in
        </a>
      </p>
    </div>
  );
}
