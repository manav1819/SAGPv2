'use server';

/**
 * Server actions for the superadmin dashboard.
 *
 * Follows the same convention as getAdminDashboardData / getOrgEmployees in
 * @/lib/actions/dashboard.ts: verify the caller's role server-side using the
 * cookie-bound client (which IS subject to RLS — self-row access only), then
 * do the actual privileged read/write with the service-role client. RLS on
 * organizations/org_memberships/profiles also now grants superadmins direct
 * access (see supabase/migrations/20260710000000_superadmin_rls_fix.sql), so
 * this isn't the only enforcement boundary — but a server-verified role check
 * before ever touching the service-role client is the same defense-in-depth
 * pattern already used for the org_admin dashboard.
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { resolveUserRole } from '@/lib/auth/resolve-role';
import type { UserRole } from '@/types/database';

async function requireSuperadmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not signed in.' };

  const resolved = await resolveUserRole(supabase, user.id);
  if (resolved.role !== 'superadmin') {
    return { error: 'Superadmin access required.' };
  }

  return { userId: user.id };
}

// ── Platform-wide organisation list ──────────────────────────────────────────

export interface SuperadminOrgRow {
  orgId: string;
  name: string;
  joinCode: string;
  createdAt: string;
  employeeCount: number;
  totalMembers: number;
  orgAdmin: {
    userId: string;
    name: string;
    email: string;
  } | null;
}

export async function getSuperadminOrganizations(): Promise<
  { success: true; orgs: SuperadminOrgRow[] } | { success: false; error: string }
> {
  const auth = await requireSuperadmin();
  if ('error' in auth) return { success: false, error: auth.error };

  const client = await createServiceRoleClient();

  const [{ data: orgs, error: orgsError }, { data: memberships }] = await Promise.all([
    client
      .from('organizations')
      .select('id, name, join_code, created_at')
      .order('created_at', { ascending: false }),
    client
      .from('org_memberships')
      .select('user_id, org_id, org_role'),
  ]);

  if (orgsError) return { success: false, error: orgsError.message };

  const membershipRows = (memberships ?? []) as Array<{ user_id: string; org_id: string; org_role: UserRole }>;

  const adminUserIds = [...new Set(membershipRows.filter((m) => m.org_role === 'org_admin').map((m) => m.user_id))];
  const profileById = new Map<string, { first_name: string; last_name: string; email: string }>();
  if (adminUserIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', adminUserIds);
    for (const p of profiles ?? []) {
      profileById.set(p.id, p);
    }
  }

  const rows: SuperadminOrgRow[] = (orgs ?? []).map((org) => {
    const orgMemberships = membershipRows.filter((m) => m.org_id === org.id);
    const adminRow = orgMemberships.find((m) => m.org_role === 'org_admin');
    const adminProfile = adminRow ? profileById.get(adminRow.user_id) : undefined;

    return {
      orgId: org.id,
      name: org.name,
      joinCode: org.join_code,
      createdAt: org.created_at,
      employeeCount: orgMemberships.filter((m) => m.org_role === 'employee').length,
      totalMembers: orgMemberships.length,
      orgAdmin: adminRow
        ? {
            userId: adminRow.user_id,
            name: adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}`.trim() : 'Unknown',
            email: adminProfile?.email ?? 'unknown',
          }
        : null,
    };
  });

  return { success: true, orgs: rows };
}

// ── Platform KPIs ─────────────────────────────────────────────────────────────

export interface SuperadminPlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  platformCompletionPct: number;
}

export async function getSuperadminPlatformStats(): Promise<
  { success: true; stats: SuperadminPlatformStats } | { success: false; error: string }
> {
  const auth = await requireSuperadmin();
  if ('error' in auth) return { success: false, error: auth.error };

  const client = await createServiceRoleClient();

  const [orgsRes, usersRes, progressRes, completedRes] = await Promise.all([
    client.from('organizations').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('progress').select('id', { count: 'exact', head: true }),
    client.from('progress').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  const totalProgress = progressRes.count ?? 0;
  const completedProgress = completedRes.count ?? 0;

  return {
    success: true,
    stats: {
      totalOrganizations: orgsRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      platformCompletionPct: totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0,
    },
  };
}

// ── Reassign org_admin ────────────────────────────────────────────────────────

/**
 * Makes `targetEmail` the org_admin of `orgId`, writing directly to
 * org_memberships (not local state). The previous org_admin(s) for that org
 * are demoted to 'employee' rather than removed — they keep their place in
 * the org, they just lose admin rights. If the target user already belongs
 * to a different org, this moves their membership to `orgId` (per spec:
 * "update role/org_id for the target user").
 *
 * profiles.role is opportunistically kept in sync on the affected rows so
 * this action doesn't reintroduce the profiles/org_memberships drift that
 * caused Bug 1 — org_memberships remains the authoritative source either way.
 */
export async function reassignOrgAdmin(
  orgId: string,
  targetEmail: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await requireSuperadmin();
  if ('error' in auth) return { success: false, error: auth.error };

  const normalizedEmail = targetEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: 'Enter the email of the user to promote.' };
  }

  const client = await createServiceRoleClient();

  const { data: org, error: orgError } = await client
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .maybeSingle();
  if (orgError) return { success: false, error: orgError.message };
  if (!org) return { success: false, error: 'Organisation not found.' };

  const { data: targetProfile, error: profileError } = await client
    .from('profiles')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  if (profileError) return { success: false, error: profileError.message };
  if (!targetProfile) {
    return { success: false, error: `No user found with email ${targetEmail}. They must have an account already.` };
  }

  // Demote any existing org_admin(s) for this org (excluding the target, in
  // case they're already the admin — no-op reassignment).
  const { data: currentAdmins, error: currentAdminsError } = await client
    .from('org_memberships')
    .select('id, user_id')
    .eq('org_id', orgId)
    .eq('org_role', 'org_admin');
  if (currentAdminsError) return { success: false, error: currentAdminsError.message };

  for (const admin of currentAdmins ?? []) {
    if (admin.user_id === targetProfile.id) continue;
    const { error } = await client
      .from('org_memberships')
      .update({ org_role: 'employee' })
      .eq('id', admin.id);
    if (error) return { success: false, error: error.message };
    await client.from('profiles').update({ role: 'employee' }).eq('id', admin.user_id);
  }

  // Promote (or move + promote) the target user.
  const { data: existingMembership, error: existingError } = await client
    .from('org_memberships')
    .select('id')
    .eq('user_id', targetProfile.id)
    .maybeSingle();
  if (existingError) return { success: false, error: existingError.message };

  if (existingMembership) {
    const { error } = await client
      .from('org_memberships')
      .update({ org_id: orgId, org_role: 'org_admin' })
      .eq('id', existingMembership.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await client.from('org_memberships').insert({
      user_id: targetProfile.id,
      org_id: orgId,
      org_role: 'org_admin',
    });
    if (error) return { success: false, error: error.message };
  }

  await client.from('profiles').update({ role: 'org_admin' }).eq('id', targetProfile.id);

  return { success: true, error: null };
}
