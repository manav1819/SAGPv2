'use client';

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile, OrgMembership } from '@/types/database';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  membership: OrgMembership | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setMembership: (membership: OrgMembership | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  membership: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setMembership: (membership) => set({ membership }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  signOut: () =>
    set({
      user: null,
      profile: null,
      membership: null,
      error: null,
    }),
}));
