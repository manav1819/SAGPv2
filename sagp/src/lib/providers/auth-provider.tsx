'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';

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

          const response = await fetch('/api/auth/profile');
          if (response.ok) {
            const data = await response.json();
            setProfile(data.profile ?? null);
            setMembership((data.organizations?.[0] ?? null) as any);
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
        try {
          const response = await fetch('/api/auth/profile');
          if (response.ok) {
            const data = await response.json();
            setProfile(data.profile ?? null);
            setMembership((data.organizations?.[0] ?? null) as any);
          }
        } catch (error) {
          console.error('Failed to fetch profile on auth change:', error);
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
