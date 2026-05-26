# SAGP Codebase Index

> **How to use this file**
> Before touching any file, look it up here. The index tells you: what the file does, what it exports, and what imports it. After making a change, update the relevant rows so the index stays accurate.
> Last indexed: 2026-05-26

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Folder Map](#2-folder-map)
3. [Route Architecture](#3-route-architecture)
4. [File-by-File Reference](#4-file-by-file-reference)
   - [src/app (routing)](#srcapp)
   - [src/components](#srccomponents)
   - [src/engines/analytics](#srcenginesanalytics)
   - [src/engines/gamification](#srcenginesgamification)
   - [src/engines/training](#srcenginestraining)
   - [src/lib](#srclib)
   - [src/config](#srcconfig)
   - [src/types](#srctypes)
   - [src/middleware.ts](#srcmiddlewarets)
   - [scripts](#scripts)
   - [supabase](#supabase)
   - [public](#public)
5. [Dependency Graph](#5-dependency-graph)
6. [Key Patterns & Conventions](#6-key-patterns--conventions)
7. [Database Tables](#7-database-tables)
8. [Environment Variables](#8-environment-variables)

---

## 1. Project Overview

SAGP is a **Next.js 16 / TypeScript / Supabase** application. The main app lives in `sagp/`. Key systems:

| System | Location | Purpose |
|---|---|---|
| Risk Scoring Engine | `src/engines/analytics/risk-score.ts` | Per-user dynamic risk score (0–100) with decay, spike, recovery |
| Persona Engine | `src/engines/analytics/persona.ts` | Classifies users into 6 behavioral personas on a 2D axis |
| Gamification Engine | `src/engines/gamification/` | Points, badges, streaks, leaderboard, battles, remediation |
| Training Engine | `src/engines/training/` | CRUD for modules and progress tracking |
| Game Bridge | `src/lib/game-bridge/` | JWT issuance + HMAC result verification for embedded games |
| Auth | `src/lib/auth/`, `src/lib/stores/`, `src/lib/providers/` | Supabase auth + Zustand store |
| UI | `src/components/ui/` | Custom design-system components (no Radix, no shadcn) |

**Tech stack:** Next.js 16, React 19, TypeScript 5, Supabase (SSR), Zustand, TailwindCSS v4, Recharts, Framer Motion, `jsonwebtoken`, `uuid`, `date-fns`, `bcryptjs`, `lucide-react`.

---

## 2. Folder Map

```
SAGPv2/
└── sagp/                          ← Next.js project root
    ├── public/
    │   ├── phishing-game/         ← iframe game: phishing simulator assets
    │   └── 3dGame/                ← iframe game: 3D office (Vite/Phaser build)
    ├── scripts/
    │   └── sync-games.ts          ← CLI: upserts GAMES registry into Supabase
    ├── src/
    │   ├── app/                   ← Next.js App Router
    │   │   ├── (auth)/            ← route group: /login, /register, etc.
    │   │   ├── (employee)/        ← route group: /dashboard, /modules, /games, /leaderboard, /badges, /profile
    │   │   ├── (admin)/           ← route group: /admin/*
    │   │   ├── (superadmin)/      ← route group: /superadmin/*
    │   │   ├── 3dGame/            ← redirect → /3dGame/index.html
    │   │   ├── layout.tsx         ← root layout (AuthProvider + ToastProvider)
    │   │   ├── page.tsx           ← root redirect → /dashboard or /login
    │   │   ├── globals.css        ← Tailwind base + SAGP custom CSS vars
    │   │   └── sagp-style-export.css ← design token exports
    │   ├── components/
    │   │   ├── admin/             ← AdminSidebar, AdminTopBar
    │   │   ├── employee/          ← EmployeeSidebar, CertificateAward
    │   │   ├── superadmin/        ← SuperadminSidebar
    │   │   ├── games/             ← IframeGame, PhaserGame, ScormGame
    │   │   └── ui/                ← design system (Button, Card, Input, …)
    │   ├── config/
    │   │   └── games.config.ts    ← game registry (GAMES array)
    │   ├── engines/
    │   │   ├── analytics/         ← risk-score, persona, company-score, compliance
    │   │   ├── gamification/      ← points, badges, streaks, leaderboard, battles, remediation
    │   │   └── training/          ← module CRUD, progress
    │   ├── games/                 ← placeholder for native Phaser scene TS files
    │   ├── lib/
    │   │   ├── auth/actions.ts    ← server actions: signIn, signUp, signOut, getSession
    │   │   ├── game-bridge/       ← token.ts (JWT issue), verify.ts (HMAC verify)
    │   │   ├── hooks/useAuth.ts   ← thin hook over Zustand auth store
    │   │   ├── providers/auth-provider.tsx ← mounts auth listener, populates store
    │   │   ├── stores/auth-store.ts ← Zustand store: user, profile, membership
    │   │   ├── supabase/
    │   │   │   ├── client.ts      ← browser Supabase client
    │   │   │   ├── server.ts      ← server + service-role clients
    │   │   │   └── middleware.ts  ← session refresh + route-guard logic
    │   │   └── utils.ts           ← cn() helper (clsx + twMerge)
    │   ├── middleware.ts           ← Next.js edge middleware (delegates to lib/supabase/middleware.ts)
    │   └── types/
    │       └── database.ts        ← all DB types + enums
    └── supabase/
        ├── schema.sql             ← full schema (607 lines)
        └── migrations/            ← 3 timestamped migration files
```

---

## 3. Route Architecture

### Route Groups & URL Mapping

| Route Group | Layout Component | Sidebar | URL Prefix | Notes |
|---|---|---|---|---|
| `(auth)` | `AuthLayout` | none | `/login`, `/register`, `/sso-callback`, `/oauth`, `/complete-profile` | Matrix-rain CSS background |
| `(employee)` | `EmployeeLayout` | `EmployeeSidebar` | `/dashboard`, `/modules`, `/games`, `/leaderboard`, `/badges`, `/profile` | `'use client'`, reads `useAuth()` |
| `(admin)` | `AdminLayout` | `AdminSidebar` | `/admin/*` | Server component layout |
| `(superadmin)` | `SuperadminLayout` | `SuperadminSidebar` | `/superadmin/*` | Server component layout |

### Navigation items (for quick reference)

**Admin sidebar** routes: `/admin/dashboard`, `/admin/modules`, `/admin/users`, `/admin/analytics`, `/admin/compliance`, `/admin/phishing`, `/admin/leaderboard`, `/admin/battles`, `/admin/settings`, `/admin/audit-log`

**Employee sidebar** routes: `/dashboard`, `/modules`, `/games`, `/leaderboard`, `/badges`, `/profile`

**Superadmin sidebar** routes: `/superadmin/dashboard`, `/superadmin/organizations`, `/superadmin/admins`

### Middleware Route Guards (`src/lib/supabase/middleware.ts`)

- **Auth routes** (`/login`, `/register`, `/sso-callback`, `/oauth`): redirect logged-in users to their role dashboard.
- **`/complete-profile`**: allowed for OAuth users who have no org membership yet.
- **Protected routes**: any route not in the public list requires an authenticated session; unauthenticated users are redirected to `/login`.
- **Role → dashboard** mapping: `superadmin` → `/superadmin/dashboard`, `org_admin` → `/admin/dashboard`, others → `/dashboard`.

---

## 4. File-by-File Reference

### `src/app`

| File | Type | Exports | Key Imports | Notes |
|---|---|---|---|---|
| `layout.tsx` | Root Layout | `default RootLayout`, `metadata` | `AuthProvider`, `ToastProvider`, `@vercel/analytics` | Wraps entire app; sets `<html lang="en" className="dark">` |
| `page.tsx` | Root Page | `default Home` | `useAuth`, `useRouter` | Client component; redirects to `/dashboard` or `/login` based on auth state |
| `(auth)/layout.tsx` | Layout | `default AuthLayout` | — | Matrix-rain animation via CSS; `sagp-login-page` class |
| `(employee)/layout.tsx` | Layout | `default EmployeeLayout` | `EmployeeSidebar`, `useAuth` | `'use client'`; passes `user.email` and hardcoded `streak=7` to sidebar |
| `(admin)/layout.tsx` | Layout | `default AdminLayout` | `AdminSidebar` | Server component |
| `(superadmin)/layout.tsx` | Layout | `default SuperadminLayout` | `SuperadminSidebar` | Server component |
| `3dGame/page.tsx` | Page | `default ThreeDGameRedirectPage` | `next/navigation` | Hard redirects to `/3dGame/index.html` |

---

### `src/components`

#### `components/admin/`

| File | Exports | Props / Notes |
|---|---|---|
| `admin-sidebar.tsx` | `AdminSidebar` | `'use client'`; uses `usePathname`, `useRouter`; 10 nav items; sign-out calls `POST /api/auth/logout` |
| `admin-top-bar.tsx` | `AdminTopBar` | Props: `breadcrumbs[]`, `title?`, `actions?`; renders breadcrumb trail |

#### `components/employee/`

| File | Exports | Props / Notes |
|---|---|---|
| `employee-sidebar.tsx` | `EmployeeSidebar` | Props: `userName`, `streak?`, `activeBattle?`; 6 nav items + battle/streak display |
| `certificate-award.tsx` | `CertificateAward` | Props: `learnerName`, `moduleTitle`, `completedAt?`, `score?`, `showConfetti?`; prints via `window.print()` |

#### `components/superadmin/`

| File | Exports | Props / Notes |
|---|---|---|
| `superadmin-sidebar.tsx` | `SuperadminSidebar` | `'use client'`; 3 nav items; sign-out calls `POST /api/auth/logout` |

#### `components/games/`

| File | Exports | Props / Notes |
|---|---|---|
| `IframeGame.tsx` | `IframeGame` | Props: `game: GameConfig`, `playerName`, `sessionRef`; embeds `game.iframeUrl` in full-screen iframe; listens for `GAME_COMPLETE` postMessage; posts to `/api/game/result` |
| `PhaserGame.tsx` | `PhaserGame` | Props: `game: GameConfig`, `playerName`; dynamic-imports Phaser scene from `src/games/<id>/index.ts`; boots `Phaser.Game` in a div |
| `ScormGame.tsx` | `ScormGame` | Props: `game: GameConfig`, `playerName`; embeds `public/games/<id>/<scormPath>`; expects SCORM API on `window.API` / `window.API_1484_11` |

#### `components/ui/`

All components are `'use client'`. They implement a custom design system (no Radix/shadcn) using `cva` + `cn()` with SAGP CSS class names.

| File | Exports | Notes |
|---|---|---|
| `index.ts` | Re-exports all UI primitives | Single import point: `@/components/ui` |
| `button.tsx` | `Button`, `buttonVariants`, `ButtonProps` | Variants: `primary`, `secondary`, `destructive`, `ghost`, `outline`; sizes: `sm`, `md`, `lg`; has `isLoading` spinner |
| `input.tsx` | `Input`, `InputProps` | Supports `label`, `error`, `helperText` |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Uses `sagp-card sagp-neon-card` CSS classes |
| `badge-ui.tsx` | `Badge`, `badgeVariants`, `BadgeProps` | Variants map to risk tiers (`low`, `medium`, `high`, `critical`) + general purpose |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | Custom context-based; controlled or uncontrolled |
| `dropdown-menu.tsx` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` | Custom context-based |
| `select.tsx` | `Select`, `SelectProps` | Native `<select>` wrapper with label/error/options prop |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Custom context-based; controlled or uncontrolled |
| `table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | Thin styled wrappers |
| `toast.tsx` | `ToastProvider`, `useToast`, `Toast`, `ToastType` | Context-based toast queue; auto-dismiss; 4 types |
| `use-toast.ts` | `useToast` (enhanced), `ToastProvider`, `ToastProps` | Wraps base `useToast`; maps `variant` → type string |
| `avatar.tsx` | `Avatar`, `AvatarProps` | Sizes: `sm/md/lg/xl`; falls back to initials from `name` |
| `progress-bar.tsx` | `ProgressBar`, `ProgressBarProps` | Props: `value`, `max`, `animated`, `label`, `showValue` |
| `skeleton.tsx` | `Skeleton` | Animated pulse placeholder |

---

### `src/engines/analytics`

All engine files import `createServiceRoleClient` from `@/lib/supabase/server`.

| File | Exports | What it does |
|---|---|---|
| `index.ts` | `processGameEvents(sessionId)`, re-exports everything from sub-modules | Orchestrator: runs risk score + persona after a game session |
| `risk-score.ts` | `computeRiskScore(userId, orgId)`, `scoreUser(…)`, `classifyRiskTier(score)`, constants: `FORMULA_VERSION`, `WEIGHTS`, `HALF_LIFE_DAYS`, `PHISH_SEVERITY`, `ARM_BASE`, `ARM_MODIFIERS`, types: `RiskScoreExplanation`, `ScoreComponent`, `RoleContext`, `PhishingEvent`, `TrainingEvent` | Dynamic 0–100 score: `ARM × Σ wₖSₖ(t) + Spike(t) − Recovery(t)`. Pure scoring fns are DB-free and unit-testable. Writes to `risk_scores` table. Formula version = `2.0.0` |
| `persona.ts` | `classifyPersona(signals)`, `classifyPersonaFromDb(userId, orgId)`, `PERSONA_PLAYBOOK`, `PERSONA_FORMULA_VERSION`, types: `PersonaResult`, `PersonaSignals`, `RemediationAction` | 2-D behavioral space (Velocity × Vigilance). Maps to 6 personas. Each persona has a `RemediationAction` playbook. Writes to `security_personas` table. Version = `2.0.0` |
| `company-score.ts` | `computeCompanyScore(orgId)`, `getScoreHistory(orgId)` | Aggregates risk scores + completion rates for an org into a 0–100 company score |
| `compliance.ts` | `generateComplianceReport(orgId, framework, generatedBy)`, `getCompletionMatrix(orgId)` | Checks per-user completion of framework-tagged modules; writes to `compliance_reports` |

**Risk score constants (do not change without bumping `FORMULA_VERSION`):**
- Weights: `phishing=0.4`, `training=0.2`, `remediation=0.2`, `trend=0.2`
- Half-lives: `behavior=45d`, `spike=7d`, `recovery=30d`
- Spike magnitude: `25` pts; Max recovery credit: `10` pts
- ARM base range: `1.00` (standard) → `1.70` (executive)

**Personas (6 types):**
`fast_clicker`, `sentinel`, `hesitant_worker`, `diligent_analyst`, `repeat_offender`, `provisional`

---

### `src/engines/gamification`

| File | Exports | What it does |
|---|---|---|
| `index.ts` | `processSessionCompletion(sessionId)`, re-exports sub-module functions | Master orchestrator: points → score update → remediation → streak → badges → leaderboard |
| `points.ts` | `calculatePoints(session, module, timeTakenSeconds)` | Base × difficulty × speed bonus × first-attempt bonus × streak multiplier; phishing report = +50 pts; integrity flag = 0 pts |
| `badges.ts` | `checkAndAwardBadges(userId, orgId)` | Iterates all badges, checks criteria (points, streak, risk_tier, sessions_count, phish_reports, completion_rate), awards new ones |
| `leaderboard.ts` | `updateLeaderboard(userId, orgId)`, `getLeaderboard(orgId, scope, limit)` | Upserts org-scope + department-scope leaderboard rows; recalculates ranks |
| `streaks.ts` | `updateStreak(userId, orgId)`, `checkStreakFreeze(userId, orgId, date)` | Increments/resets streak; respects `streak_freeze_days`; updates `longest_streak` |
| `battles.ts` | `createBattle(orgId, config, userId)`, `getBattleStandings(battleId)`, `completeBattle(battleId)` | Department vs department competitions on `total_points`, `completion_rate`, or `avg_score` |
| `remediation.ts` | `classifySession(timeTaken, estimatedMins, passed)`, `getRemediationAction(timeBucket, quizResult, attemptNumber)`, `logRemediation(sessionId, action)` | 3×2 remediation matrix (time bucket × pass/fail); escalates on repeated failures |

**Points formula bonuses:**
- Speed (<60% of estimated time): `×1.2`
- First attempt: `×1.15`
- Streak bonus: `+1% per streak day`, max `+25%`
- Phishing report event: `+50 flat`

**Remediation matrix (time bucket × result):**
| | pass | fail attempt 1 | fail attempt 2 | fail attempt 3+ |
|---|---|---|---|---|
| `less` | no_action | assign_full_module | assign_detailed_module | assign_interactive_module |
| `medium` | no_action | assign_full_module | assign_review_module | assign_reinforcement |
| `more` | assign_optimization_tips | assign_foundational_module | assign_step_by_step_module | escalate_to_manager |

---

### `src/engines/training`

| File | Exports | What it does |
|---|---|---|
| `index.ts` | `createModule`, `updateModule`, `listModules`, `getModuleWithVersion`, `trackProgress`, `getUserProgress`, `startGameSession`, `completeGameSession` | Full CRUD for `modules` + `module_versions`; progress tracking; session lifecycle |

---

### `src/lib`

| File | Exports | Key imports | Notes |
|---|---|---|---|
| `utils.ts` | `cn(...inputs)` | `clsx`, `tailwind-merge` | Used by every UI component |
| `auth/actions.ts` | `signInWithEmail`, `signUpWithEmail`, `signInWithSSO`, `signOut`, `getSession`, `getCurrentProfile`, `AuthSignUpMetadata` | `createServerSupabaseClient`, `Profile`, `OrgMembership` | `'use server'` — Next.js server actions |
| `stores/auth-store.ts` | `useAuthStore` | `zustand`, `@supabase/supabase-js`, `Profile`, `OrgMembership` | Zustand store; state: `user`, `profile`, `membership`, `isLoading`, `error` |
| `hooks/useAuth.ts` | `useAuth()` | `useAuthStore` | Thin selector hook; returns `{ user, profile, membership, isLoading }` |
| `providers/auth-provider.tsx` | `AuthProvider` | `createClient` (browser), `useAuthStore` | `'use client'`; on mount calls `GET /api/auth/profile`; subscribes to `onAuthStateChange` |
| `supabase/client.ts` | `createClient()` | `@supabase/ssr` | Browser-side client using `NEXT_PUBLIC_*` vars |
| `supabase/server.ts` | `createServerSupabaseClient()`, `createServiceRoleClient()` | `@supabase/ssr`, `next/headers` | Server-side clients; `createServiceRoleClient` uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS |
| `supabase/middleware.ts` | `updateSession(request)` | `@supabase/ssr`, `next/server` | Refreshes Supabase session cookie; implements role-based route guards |
| `game-bridge/token.ts` | `issueGameToken(…)`, `verifyGameToken(token)`, `GameTokenPayload` | `jsonwebtoken`, `uuid` | Issues HS256 JWT (15 min TTL, single-use intent); secret = `GAME_SERVER_SECRET` |
| `game-bridge/verify.ts` | `verifyGameResult(payload, signature)`, `validateResultPayload(data)`, `GameResult` | `crypto` (Node) | HMAC-SHA256 signature verification for game results; constant-time comparison |

---

### `src/config`

| File | Exports | Notes |
|---|---|---|
| `games.config.ts` | `GAMES: GameConfig[]`, `DIFFICULTY_LABELS`, `gameHref(game)`, `GameConfig` (interface) | Single source of truth for the game registry. `sync:games` script upserts this into Supabase `games` table. 4 active games: `phishing`, `vishing`, `3d-office`, `social-engineering` |

**Active games registry:**
| id | title | type | URL |
|---|---|---|---|
| `phishing` | Phishing Simulator | iframe | `/phishing-game/index.html` → custom page `/game/phishing` |
| `vishing` | Vishing Simulator | iframe | `/Social-Engineering/social-engineering-gameV2.html` → `/game/vishing` |
| `3d-office` | CyberGuard: Office Security | iframe | `/3dGame/index.html` |
| `social-engineering` | Don't Get Played | iframe | `/Social%20engineering%20game/social-engineering-gameV2.html` |

---

### `src/types`

| File | Exports | Notes |
|---|---|---|
| `database.ts` | All DB interfaces + enums | Single source of truth for TypeScript ↔ Postgres types |

**Enums:**
`UserRole`, `ModuleCategory`, `Difficulty`, `GameType`, `SessionStatus`, `TimeBucket`, `QuizResult`, `RiskTier`, `SecurityPersona`, `BadgeType`, `ComplianceFramework`, `PhishingEventType`, `GameEventType`, `LeaderboardScope`

**Interfaces (one per DB table):**
`Organization`, `Profile`, `OrgMembership`, `Module`, `ModuleVersion`, `GameSession`, `GameEvent`, `Badge`, `UserBadge`, `LeaderboardEntry`, `UserStreak`, `RiskScore`, `SecurityPersonaRecord`, `Progress`, `PhishingCampaign`, `PhishingEvent`, `DepartmentBattle`, `RemediationLog`, `AuditLog`, `Notification`, `ComplianceReport`

---

### `src/middleware.ts`

Edge middleware entry point. Just delegates to `updateSession(request)` from `@/lib/supabase/middleware`. Matcher excludes static files and images.

---

### `scripts`

| File | Purpose |
|---|---|
| `sync-games.ts` | Reads `GAMES` from `games.config.ts`; upserts each into Supabase `games` table via service-role client. Run with `npm run sync:games`. Requires `.env.local`. |

---

### `supabase`

| File | Notes |
|---|---|
| `schema.sql` | Full schema (607 lines) — reference for table definitions, RLS policies, indexes |
| `migrations/20260321000000_phishing_sim_module.sql` | Phishing simulation module migration |
| `migrations/20260518000000_game_registry.sql` | Games table + registry migration |
| `migrations/20260520000000_risk_engine_v2.sql` | Risk engine v2 schema changes |

---

### `public`

| Path | Contents |
|---|---|
| `public/phishing-game/` | Self-contained iframe game: `index.html`, `assets/` (character sprites, `emails.json`) |
| `public/3dGame/` | Vite-built Phaser game: `index.html`, `src/main.js`, `assets/`, `dist/`, `dist2/` |

---

## 5. Dependency Graph

```
src/app/layout.tsx
  └─ src/lib/providers/auth-provider.tsx
       └─ src/lib/stores/auth-store.ts  (Zustand)
       └─ src/lib/supabase/client.ts
  └─ src/components/ui/toast.tsx

src/app/(employee)/layout.tsx
  └─ src/components/employee/employee-sidebar.tsx
       └─ src/lib/hooks/useAuth.ts
            └─ src/lib/stores/auth-store.ts
       └─ src/components/ui/button.tsx
  └─ src/lib/hooks/useAuth.ts

src/middleware.ts
  └─ src/lib/supabase/middleware.ts
       └─ src/lib/supabase/server.ts  (for role lookups)

src/engines/analytics/index.ts
  └─ src/engines/analytics/risk-score.ts
       └─ src/lib/supabase/server.ts (createServiceRoleClient)
       └─ src/types/database.ts
  └─ src/engines/analytics/persona.ts
       └─ src/engines/analytics/risk-score.ts  (PHISH_SEVERITY, HALF_LIFE_DAYS, types)
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts
  └─ src/engines/analytics/company-score.ts
       └─ src/lib/supabase/server.ts
  └─ src/engines/analytics/compliance.ts
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts

src/engines/gamification/index.ts
  └─ src/engines/gamification/points.ts
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts
  └─ src/engines/gamification/badges.ts
       └─ src/lib/supabase/server.ts
  └─ src/engines/gamification/leaderboard.ts
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts
  └─ src/engines/gamification/streaks.ts
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts
  └─ src/engines/gamification/remediation.ts
       └─ src/lib/supabase/server.ts
       └─ src/types/database.ts

src/components/ui/* 
  └─ src/lib/utils.ts (cn)

src/config/games.config.ts
  ← scripts/sync-games.ts (reads GAMES for DB sync)
  ← src/components/games/*.tsx (typed with GameConfig)
```

---

## 6. Key Patterns & Conventions

### Supabase client usage
- **Browser components**: `createClient()` from `@/lib/supabase/client.ts`
- **Server components / server actions**: `createServerSupabaseClient()` from `@/lib/supabase/server.ts`
- **Engine functions** (bypass RLS): `createServiceRoleClient()` from `@/lib/supabase/server.ts`

### Auth flow
1. `AuthProvider` mounts → calls `supabase.auth.getUser()` + `GET /api/auth/profile`
2. Populates Zustand store (`useAuthStore`) with `user`, `profile`, `membership`
3. Components read via `useAuth()` hook (thin selector over the store)
4. Middleware refreshes session cookie on every request and enforces role-based routing

### Engine invocation pattern
- Game session ends → call `processSessionCompletion(sessionId)` (gamification) and `processGameEvents(sessionId)` (analytics)
- Both are async orchestrators; individual sub-functions are exported for targeted use

### Game bridge flow
1. Server issues JWT via `issueGameToken(…)` → passes to iframe/game
2. Game POSTs result + HMAC signature to API route
3. API route calls `verifyGameResult(payload, signature)` before processing

### CSS class conventions
All custom classes use the `sagp-` prefix (e.g. `sagp-card`, `sagp-btn-primary`, `sagp-badge-danger`). Defined in `globals.css` and `sagp-style-export.css`. Component files use `cn()` to merge these with Tailwind utilities.

### Import alias
`@/` maps to `sagp/src/` (configured in `tsconfig.json`).

---

## 7. Database Tables

| Table | Key columns | Written by |
|---|---|---|
| `organizations` | `id`, `name`, `domain`, `join_code`, `settings` | auth actions / superadmin |
| `profiles` | `id`, `email`, `first_name`, `last_name`, `role` | auth on sign-up |
| `org_memberships` | `user_id`, `org_id`, `department`, `org_role` | auth on sign-up / admin |
| `modules` | `id`, `org_id`, `title`, `game_type`, `compliance_tags`, `is_active` | training engine |
| `module_versions` | `module_id`, `version_number`, `content` | training engine |
| `game_sessions` | `id`, `user_id`, `module_id`, `status`, `score`, `passed`, `time_bucket` | training engine |
| `game_events` | `session_id`, `event_type`, `reaction_ms`, `is_correct`, `points_delta` | game bridge |
| `badges` | `id`, `name`, `badge_type`, `criteria` | seeded by admin |
| `user_badges` | `user_id`, `badge_id`, `earned_at` | gamification/badges |
| `leaderboard` | `user_id`, `org_id`, `scope`, `total_points`, `rank` | gamification/leaderboard |
| `user_streaks` | `user_id`, `org_id`, `current_streak`, `longest_streak`, `streak_freeze_days` | gamification/streaks |
| `risk_scores` | `user_id`, `org_id`, `total_score`, `risk_tier`, `computed_at` | analytics/risk-score |
| `security_personas` | `user_id`, `org_id`, `persona`, `confidence`, `signals` | analytics/persona |
| `progress` | `user_id`, `module_id`, `org_id`, `status`, `best_score`, `attempts` | training engine |
| `phishing_campaigns` | `org_id`, `name`, `template`, `status` | admin |
| `phishing_events` | `campaign_id`, `user_id`, `event_type` | phishing sim |
| `department_battles` | `org_id`, `departments[]`, `metric`, `status` | gamification/battles |
| `remediation_logs` | `session_id`, `time_bucket`, `quiz_result`, `action_taken` | gamification/remediation |
| `audit_logs` | `actor_id`, `action`, `entity_type`, `old_values`, `new_values` | various |
| `notifications` | `user_id`, `type`, `read` | various |
| `compliance_reports` | `org_id`, `framework`, `report_data` | analytics/compliance |
| `games` | `id`, `title`, `type`, `active` | scripts/sync-games |

---

## 8. Environment Variables

| Variable | Used in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all supabase clients | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + middleware clients | Anon/public key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | `createServiceRoleClient()`, `sync-games.ts` | Service role key (bypasses RLS — server only) |
| `GAME_SERVER_SECRET` | `lib/game-bridge/token.ts`, `lib/game-bridge/verify.ts` | HMAC secret for game JWT + result signing |

---

## Updating This Index

When you modify a file:
1. Find its row in **Section 4** and update exports, imports, or notes.
2. If you add/remove a file, add/remove its row and update **Section 5** (dependency graph).
3. If you add a DB table, add a row to **Section 7**.
4. If you add an env var, add it to **Section 8**.
5. Update the "Last indexed" date at the top.
