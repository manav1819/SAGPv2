-- ============================================================
-- SAGP — Superadmin Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- STEP 1 ─ First create the auth user via Supabase Dashboard:
--   Auth → Users → "Add user" → enter email + password → Create
--   Then copy the UUID shown in the user list.
--
-- STEP 2 ─ Paste that UUID where it says <<PASTE_UUID_HERE>> below
--   and customise the email/name to match what you used in Step 1.
--
-- STEP 3 ─ Run this script in the SQL Editor.
-- ============================================================

-- ── CONFIG: edit these three lines ──────────────────────────
DO $$
DECLARE
  v_user_id   UUID   := '<<PASTE_UUID_HERE>>';      -- UUID from Auth → Users
  v_email     TEXT   := 'superadmin@sagp.io';        -- must match what you entered in Dashboard
  v_org_name  TEXT   := 'SAGP Platform';             -- name for the platform-level org
  v_first     TEXT   := 'Super';
  v_last      TEXT   := 'Admin';

  v_org_id UUID;
BEGIN

  -- ── 1. Set role to superadmin in profiles ──────────────────
  INSERT INTO public.profiles (id, email, first_name, last_name, role, display_name, is_active)
  VALUES (v_user_id, v_email, v_first, v_last, 'superadmin', v_first || ' ' || v_last, true)
  ON CONFLICT (id) DO UPDATE
    SET role         = 'superadmin',
        first_name   = v_first,
        last_name    = v_last,
        display_name = v_first || ' ' || v_last,
        is_active    = true;

  RAISE NOTICE '✓ Profile set to superadmin for %', v_email;

  -- ── 2. Create (or find) the platform-level organisation ────
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE name ILIKE v_org_name
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, domain)
    VALUES (v_org_name, null)
    RETURNING id INTO v_org_id;
    RAISE NOTICE '✓ Organisation "%" created (id: %)', v_org_name, v_org_id;
  ELSE
    RAISE NOTICE '✓ Organisation "%" already exists (id: %)', v_org_name, v_org_id;
  END IF;

  -- ── 3. Create (or update) org membership ───────────────────
  INSERT INTO public.org_memberships (user_id, org_id, org_role, department)
  VALUES (v_user_id, v_org_id, 'superadmin', 'Platform')
  ON CONFLICT (user_id, org_id) DO UPDATE
    SET org_role   = 'superadmin',
        department = 'Platform';

  RAISE NOTICE '✓ Org membership set to superadmin';

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE '  Superadmin setup complete!';
  RAISE NOTICE '  Login: %', v_email;
  RAISE NOTICE '  → Will redirect to /admin/dashboard';
  RAISE NOTICE '══════════════════════════════════════';

END $$;


-- ============================================================
-- QUICK ROLE CHANGE — use this to promote any existing user
-- to any role without re-running the full script above.
-- ============================================================
-- Uncomment and edit:

-- UPDATE public.profiles
-- SET role = 'org_admin'          -- options: employee | manager | org_admin | superadmin
-- WHERE email = 'user@example.com';

-- UPDATE public.org_memberships
-- SET org_role = 'org_admin'
-- WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');


-- ============================================================
-- VERIFY — run this SELECT after the script to confirm setup
-- ============================================================

SELECT
  p.email,
  p.first_name || ' ' || p.last_name  AS full_name,
  p.role                               AS profile_role,
  m.org_role                           AS membership_role,
  o.name                               AS organisation,
  p.is_active
FROM public.profiles p
LEFT JOIN public.org_memberships m ON m.user_id = p.id
LEFT JOIN public.organizations   o ON o.id = m.org_id
ORDER BY p.role DESC, p.email;
