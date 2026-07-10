-- ===========================================================================
-- Superadmin RLS fix — 2026-07-10
-- ===========================================================================
-- Bug: organizations/org_memberships/profiles RLS only ever granted
-- org-scoped access (self row, or rows within orgs the caller already
-- belongs to). A platform superadmin had no policy path to see ALL orgs —
-- the superadmin dashboard query returned zero rows even though
-- organizations had 3 rows, because RLS silently filtered everything out.
--
-- Fix: add an is_superadmin() SECURITY DEFINER helper (same recursion-safe
-- pattern already used by get_my_admin_org_ids()) plus additive
-- superadmin-bypass policies. Postgres OR's multiple permissive policies
-- together, so these extend existing access without narrowing it.
--
-- Applied directly to the project via the Supabase MCP `apply_migration`
-- tool on 2026-07-10; this file mirrors that change for the migration
-- history / local development.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid() AND org_role = 'superadmin'
    )
    OR (
      NOT EXISTS (SELECT 1 FROM org_memberships WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
      )
    );
$$;

COMMENT ON FUNCTION public.is_superadmin() IS
  'True if the caller is a platform superadmin: either an org_memberships row with org_role=superadmin, or (only when they have zero memberships) profiles.role=superadmin. org_memberships always wins once it exists — see resolveUserRole() in the app for the matching precedence.';

-- organizations: superadmin sees + manages every org, not just ones they
-- personally belong to.
DROP POLICY IF EXISTS "Superadmins see all organizations" ON organizations;
CREATE POLICY "Superadmins see all organizations" ON organizations
  FOR SELECT USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmins manage organizations" ON organizations;
CREATE POLICY "Superadmins manage organizations" ON organizations
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- org_memberships: superadmin sees + manages every membership row — needed
-- to list org_admins/employee counts per org and to reassign org_admin.
DROP POLICY IF EXISTS "Superadmins see all org memberships" ON org_memberships;
CREATE POLICY "Superadmins see all org memberships" ON org_memberships
  FOR SELECT USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmins manage org memberships" ON org_memberships;
CREATE POLICY "Superadmins manage org memberships" ON org_memberships
  FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- profiles: superadmin needs to read every profile to show org_admin /
-- employee names on the platform dashboard.
DROP POLICY IF EXISTS "Superadmins see all profiles" ON profiles;
CREATE POLICY "Superadmins see all profiles" ON profiles
  FOR SELECT USING (is_superadmin());
