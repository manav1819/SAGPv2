import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types/database';

export interface ResolvedRole {
  /** The user's effective app role for routing / access-control decisions. */
  role: UserRole;
  /** The org this role applies to (null when resolved via the no-membership fallback). */
  orgId: string | null;
  /** True when the role came from an org_memberships row rather than the profiles fallback. */
  hasMembership: boolean;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  superadmin: 3,
  org_admin: 2,
  manager: 1,
  employee: 0,
};

/**
 * Resolves the authoritative app role for a user.
 *
 * `org_memberships.org_role` is the source of truth once a user has joined an
 * organisation. `profiles.role` is only a signup-time default (copied from
 * auth metadata by the `handle_new_user` trigger) and must never override an
 * existing membership — that drift is exactly what caused a user with
 * org_memberships.org_role='org_admin' to be routed to /superadmin because a
 * stale profiles.role='superadmin' was being read instead (bugfix 2026-07-10).
 *
 * If a user somehow holds multiple memberships, the highest-privilege role
 * wins and its org_id is returned (ties broken by earliest joined_at) so
 * routing is deterministic instead of depending on default row order.
 *
 * The profiles.role fallback only fires when the user has zero membership
 * rows — this is the intentional path for a platform-level superadmin who
 * isn't tied to any single organisation.
 */
export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedRole> {
  const { data: memberships } = await supabase
    .from('org_memberships')
    .select('org_id, org_role, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (memberships && memberships.length > 0) {
    const best = memberships.reduce((acc, row) => {
      const rowPriority = ROLE_PRIORITY[row.org_role as UserRole] ?? -1;
      const accPriority = ROLE_PRIORITY[acc.org_role as UserRole] ?? -1;
      return rowPriority > accPriority ? row : acc;
    });

    return {
      role: best.org_role as UserRole,
      orgId: best.org_id as string,
      hasMembership: true,
    };
  }

  // No org membership at all — fall back to the platform-level profiles.role.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return {
    role: (profile?.role as UserRole) ?? 'employee',
    orgId: null,
    hasMembership: false,
  };
}

/** Maps a resolved role to its dashboard landing route. */
export function dashboardPathForRole(role: UserRole): string {
  if (role === 'superadmin') return '/superadmin/dashboard';
  if (role === 'org_admin' || role === 'manager') return '/admin/dashboard';
  return '/dashboard';
}
