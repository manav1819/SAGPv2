'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCurrentProfile } from '@/lib/auth/actions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setMembership, setIsLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const initializeAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);

          const result = await getCurrentProfile();
          if (result.success && result.profile) {
            setProfile(result.profile);
            if (result.membership) {
              setMembership(result.membership);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const result = await getCurrentProfile();
        if (result.success && result.profile) {
          setProfile(result.profile);
          if (result.membership) {
            setMembership(result.membership);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setMembership(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [setUser, setProfile, setMembership, setIsLoading]);

  return <>{children}</>;
}
