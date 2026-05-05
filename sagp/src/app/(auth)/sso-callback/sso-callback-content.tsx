'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SSOCallbackContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { toast }    = useToast();
  const supabase     = createClient();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code             = searchParams.get('code');
        const error            = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          toast({
            title:       'Sign-In Failed',
            description: errorDescription || error,
            variant:     'destructive',
          });
          router.push('/login');
          return;
        }

        if (!code) {
          toast({
            title:       'Error',
            description: 'No authorisation code received',
            variant:     'destructive',
          });
          router.push('/login');
          return;
        }

        // Exchange the authorisation code for a Supabase session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError || !data.user) {
          toast({
            title:       'Authentication Failed',
            description: exchangeError?.message || 'Could not complete sign-in',
            variant:     'destructive',
          });
          router.push('/login');
          return;
        }

        // ── Check whether this user already has an org membership ──────────
        // New Google sign-ups won't have one yet → send to complete-profile.
        const { data: membership } = await supabase
          .from('org_memberships')
          .select('org_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!membership) {
          // Brand-new user: collect org / department / role first
          router.push('/complete-profile');
          return;
        }

        // ── Existing user: fetch role and redirect to their dashboard ───────
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = profile?.role ?? 'employee';

        toast({ title: 'Welcome back!', description: 'Signed in with Google.' });

        if (role === 'org_admin' || role === 'superadmin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        toast({
          title:       'Error',
          description: err instanceof Error ? err.message : 'An unexpected error occurred',
          variant:     'destructive',
        });
        router.push('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="border-slate-700 bg-slate-800">
        <div className="flex flex-col items-center justify-center p-8">
          {isProcessing && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
              <p className="mt-4 text-slate-300">Completing sign-in with Google…</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
