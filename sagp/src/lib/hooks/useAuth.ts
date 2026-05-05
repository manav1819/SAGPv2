'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuth() {
  const { user, profile, membership, isLoading } = useAuthStore();

  return {
    user,
    profile,
    membership,
    isLoading,
  };
}
