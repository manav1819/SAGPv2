'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * /complete-profile
 *
 * Shown to new OAuth users who have authenticated but haven't
 * joined an organisation yet (no org_membership row).
 * Middleware guards this route: unauthenticated users are sent to /login.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Look up the org by join code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('join_code', joinCode.trim().toUpperCase())
        .maybeSingle();

      if (orgError || !org) {
        setError('Invalid join code. Please check with your organisation admin.');
        return;
      }

      // Upsert profile with display name
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email ?? '',
          first_name: firstName,
          last_name: lastName,
          role: 'employee',
          is_active: true,
        });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Create membership
      const { error: membershipError } = await supabase
        .from('org_memberships')
        .insert({
          user_id: user.id,
          org_id: org.id,
          org_role: 'employee',
        });

      if (membershipError) {
        setError(membershipError.message);
        return;
      }

      router.push('/dashboard');
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
        <h1 className="sagp-heading-2 sagp-neon-text">Complete Your Profile</h1>
        <p className="sagp-text-muted text-sm">Enter your name and your organisation's join code.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <label className="sagp-label text-xs" htmlFor="joinCode">Organisation Join Code</label>
          <input
            id="joinCode"
            type="text"
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. ACME-2024"
            className="sagp-input tracking-widest uppercase"
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
          {isPending ? 'Joining…' : 'Join Organisation'}
        </button>
      </form>
    </div>
  );
}
