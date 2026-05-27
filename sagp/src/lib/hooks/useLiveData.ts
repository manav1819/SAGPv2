'use client';

/**
 * Realtime data hooks for SAGP dashboards.
 *
 * Each hook:
 *   1. Calls the corresponding server action to load initial data (SSR-equivalent).
 *   2. Subscribes to Supabase Realtime INSERT events on the relevant table.
 *   3. Updates state immediately when a new row arrives — no manual refresh needed.
 *
 * The realtime subscription fires when the pipeline writes a new risk_scores
 * or security_personas row after a game session completes. The dashboard
 * widget updates within ~200ms of the backend finishing.
 *
 * Usage:
 *   const { data, isLoading } = useEmployeeDashboard(userId, orgId);
 */

import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getEmployeeDashboardData,
  getAdminDashboardData,
  type EmployeeDashboardData,
  type AdminDashboardData,
} from '@/lib/actions/dashboard';

// ── Employee dashboard hook ──────────────────────────────────────────────────

export function useEmployeeDashboard(userId: string | undefined, orgId: string | undefined) {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();
  const channelsRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']>[]>([]);

  const load = () => {
    if (!userId || !orgId) return;
    startTransition(async () => {
      const result = await getEmployeeDashboardData(userId, orgId);
      setData(result);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (!userId || !orgId) return;

    // Initial load
    load();

    const supabase = createClient();

    // Subscribe to new risk_scores rows for this user
    const riskChannel = supabase
      .channel(`risk_scores:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'risk_scores', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();

    // Subscribe to new persona rows for this user
    const personaChannel = supabase
      .channel(`security_personas:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_personas', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();

    // Subscribe to leaderboard updates (streak + points)
    const leaderboardChannel = supabase
      .channel(`leaderboard:${userId}:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();

    channelsRef.current = [riskChannel, personaChannel, leaderboardChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId]);

  return { data, isLoading, reload: load };
}

// ── Admin dashboard hook ─────────────────────────────────────────────────────

export function useAdminDashboard(orgId: string | undefined) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();
  const channelsRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']>[]>([]);

  const load = () => {
    if (!orgId) return;
    startTransition(async () => {
      const result = await getAdminDashboardData(orgId);
      setData(result);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (!orgId) return;

    load();

    const supabase = createClient();

    // Re-fetch when any risk score is inserted for this org
    const riskChannel = supabase
      .channel(`admin_risk:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'risk_scores', filter: `org_id=eq.${orgId}` },
        () => load()
      )
      .subscribe();

    // Re-fetch when leaderboard is updated for this org
    const leaderChannel = supabase
      .channel(`admin_leaderboard:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard', filter: `org_id=eq.${orgId}` },
        () => load()
      )
      .subscribe();

    channelsRef.current = [riskChannel, leaderChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return { data, isLoading, reload: load };
}

// ── Persona label helpers ────────────────────────────────────────────────────

export const PERSONA_LABELS: Record<string, string> = {
  fast_clicker:     'Fast Clicker',
  sentinel:         'Sentinel',
  hesitant_worker:  'Hesitant Worker',
  diligent_analyst: 'Diligent Analyst',
  repeat_offender:  'Repeat Offender',
  provisional:      'Provisional',
};

export const RISK_TIER_COLORS: Record<string, string> = {
  low:      'text-green-400',
  medium:   'text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
};
