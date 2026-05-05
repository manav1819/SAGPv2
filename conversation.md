# SAGP Platform — Conversation Context

> **Purpose:** Paste this file's contents into a new chat to resume work on the SAGP platform with full context.

---

## Project Overview

**SAGP** = Security Awareness Gamification Platform v2.0
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + RLS) · Phaser.js game server · Recharts · Zustand · Lucide React
**Location:** `/sessions/clever-vigilant-knuth/mnt/SAGPv2/sagp/` (main app) + `/sessions/clever-vigilant-knuth/mnt/SAGPv2/sagp/game-server/` (Phaser game server)
**Workspace folder:** `/sessions/clever-vigilant-knuth/mnt/SAGPv2/`

---

## Architecture

### Role System
| Role | Access |
|------|--------|
| `superadmin` | Full platform access → `/admin/dashboard` |
| `org_admin` | Organisation management → `/admin/dashboard` |
| `manager` | Department analytics → `/dashboard` |
| `employee` | Training modules → `/dashboard` |

### Two Supabase Clients (critical pattern)
```typescript
// In API routes — DO NOT mix these up
const anonClient    = createClient(URL, ANON_KEY);          // auth.signUp only
const serviceClient = createClient(URL, SERVICE_ROLE_KEY);  // all DB writes (bypasses RLS)
```

### Key DB Tables
`profiles` · `organizations` · `org_memberships` · `modules` · `user_module_progress` · `game_sessions` · `quiz_attempts` · `risk_scores` · `badges` · `user_badges` · `notifications` · `audit_logs`

### Correct Column Names (common source of bugs)
- `profiles`: `id` (not `user_id`), `role`, `first_name`, `last_name`, `display_name`, `is_active`
- `org_memberships`: `user_id`, `org_id` (not `organization_id`), `org_role` (not `role`), `department`
- `organizations`: `name`, `domain` — use `domain: null` (NOT `domain: ''`) to avoid UNIQUE constraint

---

## Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # publishable anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # REAL JWT from Dashboard → Settings → API → service_role
                                               # Must start with eyJ — NOT sb_publishable_...
GAME_SERVER_SECRET=your-game-server-secret
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:2567
```

---

## Supabase Dashboard Setup Required

1. **Disable email confirmation:**
   Authentication → Providers → Email → uncheck "Confirm email"

2. **Get service role key:**
   Settings → API → `service_role` secret → copy the JWT (starts `eyJ...`)
   Paste into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

3. **Run schema:**
   SQL Editor → open `supabase/schema.sql` → Run

---

## Creating a Superadmin

The register page deliberately excludes `superadmin` (security). To create one:

1. Supabase Dashboard → Authentication → Users → **Add user** → enter email + password → Create
2. Copy the UUID shown in the user list
3. Open `superadmin_setup.sql` (in workspace root)
4. Replace `<<PASTE_UUID_HERE>>` with the UUID
5. Update `v_email` to match what you entered
6. SQL Editor → paste script → Run

**Quick role promotion** (for existing users):
```sql
UPDATE public.profiles SET role = 'org_admin' WHERE email = 'user@example.com';
UPDATE public.org_memberships SET org_role = 'org_admin'
  WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');
```

---

## Running the App

```bash
# Main app
cd /path/to/SAGPv2/sagp
npm run dev          # http://localhost:3000

# Game server (separate terminal)
cd game-server
npm run dev          # ws://localhost:2567
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full DB schema — 25 tables, RLS, enums, indexes, seed badges |
| `src/types/database.ts` | TypeScript types for all DB tables |
| `src/lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `src/lib/supabase/server.ts` | Server + service-role clients |
| `src/lib/supabase/middleware.ts` | Role-aware session refresh + route protection |
| `src/middleware.ts` | Next.js middleware entry (calls `updateSession`) |
| `src/app/api/auth/register/route.ts` | Registration API — dual-client, duplicate email check |
| `src/app/(auth)/login/page.tsx` | Login — uses browser client, role-based redirect |
| `src/app/(auth)/register/page.tsx` | Register form — Employee / Manager / Org Admin roles |
| `src/app/admin/dashboard/page.tsx` | Admin dashboard (superadmin + org_admin) |
| `src/app/dashboard/page.tsx` | Employee/manager dashboard |
| `src/engines/gamification/remediation-service.ts` | Adaptive Remediation Matrix |
| `src/engines/analytics/risk-score-service.ts` | Risk score (4-component formula) |
| `src/engines/analytics/persona-service.ts` | 5-persona behavioral classification |
| `game-server/src/scenes/` | Phaser.js game scenes (Casino, Phishing, Scenario, DragDrop) |
| `superadmin_setup.sql` | SQL script to bootstrap a superadmin account |

---

## Bugs Fixed in Previous Session

| Bug | Fix Applied |
|-----|-------------|
| No role dropdown on register | Added `ROLES` array + select in `register/page.tsx` |
| `/admin/dashboard` inaccessible | Login now fetches `profiles.role` and redirects by role; middleware is role-aware |
| No duplicate email check | Pre-flight check against `profiles` + catches Supabase duplicate auth error |
| Registration failing (`sb_publishable` key error) | Switched to `anonClient.auth.signUp` for user creation; service client only for DB writes |
| `domain: ''` UNIQUE constraint on 2nd org | Changed to `domain: null` |
| Wrong table/column names in register API | Fixed: `profiles.id`, `org_memberships.org_id`, `org_memberships.org_role` |
| `Cannot find module 'axios'` in game server | `cd game-server && npm install axios ts-node` |
| Next.js font fetch error in build sandbox | Replaced `next/font/google` with inline `fontFamily` style |
| Duplicate `(auth)` route directories | Merged escaped `\(auth\)` dirs into proper `(auth)` dirs |

---

## Engines & Formulas

### Risk Score
```
riskScore = 0.35 × phishingClickRate
          + 0.25 × incorrectAnswerRate
          + 0.20 × avgReactionTime (normalised)
          + 0.20 × remediationScore
```

### Company Security Score
```
companyScore = 100 − (avgRisk × 0.5)
                   − (incompleteRate × 0.3)
                   − (criticalPct × 0.2)
```

### Security Personas (5 types)
`Careful Defender` · `Speed Runner` · `Clicker` · `Guesser` · `Skeptic`

### Adaptive Remediation Matrix
6-cell grid: `time_bucket` (fast/medium/slow) × `quiz_result` (pass/fail) → action

---

## Notes for Next Session

- Build was verified passing (`✓ Compiled successfully`) after all fixes
- No code changes pending — waiting on user to apply service role key + run superadmin SQL
- If registration still fails after env fix, check Supabase logs: Dashboard → Logs → API
- Game server is a **separate Railway deployment** — not part of the Next.js build
- `src/middleware.ts` shows a Next.js 16 deprecation warning about "middleware" convention — this is cosmetic, build still succeeds
