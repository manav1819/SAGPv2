'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCurrentProfile } from '@/lib/auth/actions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setMembership, setIsLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);

          // Fetch profile and membership
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
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
        setMembership(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch profile and membership on state change
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const result = await getCurrentProfile();
          if (result.success && result.profile) {
            setProfile(result.profile);
            if (result.membership) {
              setMembership(result.membership);
            }
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setMembership(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setProfile, setMembership, setIsLoading]);

  return <>{children}</>;
}
