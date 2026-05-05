# SAGP Dashboard Access Cheatsheet

## Quick Navigation by Role

### 🔴 SUPERADMIN (Platform Owner)

**Entry Point:** http://localhost:3000/admin/dashboard

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Admin Dashboard | `/admin/dashboard` | Global KPIs, all organizations |
| Organization Settings | `/admin/settings` | Platform-wide config |
| Audit Log | `/admin/audit` | Complete system audit trail |

**Superadmin Capabilities:**
- Manage all organizations
- Impersonate org admins
- View cross-org analytics
- Configure global settings

---

### 🟠 ORG_ADMIN (Organization Administrator)

**Entry Point:** http://localhost:3000/admin/dashboard

| Dashboard | URL | Purpose | Key Action |
|-----------|-----|---------|-----------|
| **Admin Dashboard** | `/admin/dashboard` | Organization KPIs | Monitor Company Security Score |
| **Modules** | `/admin/modules` | Module catalog | Create/Edit/Delete |
| **Create Module** | `/admin/modules/create` | Module editor | New training content |
| **Module Versions** | `/admin/modules/[id]/versions` | Version history | Restore old versions |
| **User Management** | `/admin/users` | Employee roster | CSV import, activate/deactivate |
| **Analytics** | `/admin/analytics` | Org-wide trends | Heatmaps, risk distribution |
| **Employee Reports** | `/admin/reports/[userId]` | Individual profiles | Risk breakdown, remediation |
| **Phishing Campaigns** | `/admin/phishing` | Phishing simulations | Launch + view results |
| **Compliance** | `/admin/compliance` | Framework reports | NIST, ISO27001, SOC2, PCI-DSS, HIPAA |
| **Department Battles** | `/admin/battles` | Team competitions | Create inter-dept challenges |
| **Settings** | `/admin/settings` | Org configuration | SSO, streak rules, notifications |
| **Audit Log** | `/admin/audit` | Org activity log | Who did what and when |

**Org Admin Capabilities:**
- Full module lifecycle (CRUD)
- User provisioning & deactivation
- Launch phishing campaigns
- Generate compliance reports
- Configure SSO
- Monitor all analytics
- Manage department battles

---

### 🟡 MANAGER (Department Manager)

**Entry Point:** http://localhost:3000/dashboard

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| **Dashboard** | `/dashboard` | Team overview (manager view) |
| **Modules** | `/modules` | Browse all modules (read-only) |
| **Module Detail** | `/modules/[id]` | View module info |
| **Leaderboard** | `/leaderboard` | Department-scoped ranking |
| **Employee Report** | `/admin/reports/[userId]` | View team member details |
| **Profile** | `/profile` | Personal analytics |

**Manager Capabilities:**
- View department-only data
- Monitor team progress
- See risk scores & personas
- View completion rates
- Cannot modify modules or users

---

### 🟢 EMPLOYEE (Training Participant)

**Entry Point:** http://localhost:3000/dashboard

| Dashboard | URL | Purpose | Interaction |
|-----------|-----|---------|-------------|
| **Dashboard** | `/dashboard` | Personal hub | Security Persona, Streak, Points |
| **Modules** | `/modules` | Training catalog | Browse & filter |
| **Module Detail** | `/modules/[id]` | Module info | View prerequisites, past attempts |
| **Play Game** | `/game/[sessionId]` | Phaser game | Full-screen game play |
| **Leaderboard** | `/leaderboard` | Ranking system | 4 scopes: Global/Org/Dept/Weekly |
| **Badges** | `/badges` | Achievement gallery | View earned & locked badges |
| **Profile** | `/profile` | Personal stats | Risk score radar, preferences |

**Employee Capabilities:**
- Play assigned modules
- View personal progress
- Earn badges & streaks
- See ranking on leaderboard
- View personal risk & persona
- Cannot modify anything

---

## No Hardcoded Credentials

| Type | Requirement |
|------|-------------|
| Admin Account | Create via `/register`, set role to "admin" |
| Demo Data | Create manually through UI or SQL seed |
| Passwords | Supabase Auth (bcrypt, no hardcoding) |
| API Keys | `.env.local` (Supabase credentials + game server secret) |

**Setup Process:**
1. Go to `/register`
2. Create account with role = "admin"
3. Login to `/admin/dashboard`
4. Create test modules
5. Create test users

---

## Default Seeded Data

### 10 Pre-Configured Badges

```
✓ First Steps        — Complete 1 module
✓ Phish Detector     — Complete 10 phishing modules
✓ Week Warrior       — 7-day streak
✓ Month Master       — 30-day streak
✓ Perfect Score      — 100% on hard module
✓ Phishing Expert    — Complete all phishing modules
✓ Phish Hunter       — Report 3 phishing emails
✓ Speed Demon        — 5 modules with speed bonus
✓ Security Champion  — Outstanding performance (manual)
✓ Knowledge Seeker   — 25 modules completed
```

All earned automatically on session completion when criteria met.

---

## Feature Access Matrix

### By Role

|  | SUPERADMIN | ORG_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Create Modules | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ |
| View All Orgs | ✓ | ✗ | ✗ | ✗ |
| Launch Phishing | ✓ | ✓ | ✗ | ✗ |
| Generate Reports | ✓ | ✓ | ✓ (dept only) | ✗ |
| Play Games | ✓ | ✓ | ✓ | ✓ |
| View Leaderboard | ✓ | ✓ | ✓ | ✓ |
| View Own Risk | ✓ | ✓ | ✓ | ✓ |
| Configure Battles | ✓ | ✓ | ✗ | ✗ |
| Audit Log | ✓ | ✓ (org only) | ✗ | ✗ |

---

## Game Types & How to Access

### 1. Casino Quiz (`/game/[sessionId]`)
- Multiple choice format
- 3-lives system
- Timer visible
- Scoring: correct answers + speed bonus

### 2. Phishing Inbox (`/game/[sessionId]`)
- Email identification
- Click phishing = fail + recorded
- Report Phishing = bonus points
- Auto-remediation on click

### 3. Scenario (`/game/[sessionId]`)
- Branching story
- Multiple choice decisions
- Consequence text per branch
- Score based on choices

### 4. Drag & Drop (`/game/[sessionId]`)
- Threat-to-mitigation matching
- Email sorting (Safe/Phish)
- Time pressure
- Difficulty affects time limit

---

## Real-Time Features

| Feature | How It Works | Latency |
|---------|--------------|---------|
| **Leaderboard Updates** | Supabase Realtime WebSocket | <500ms |
| **Badge Notifications** | Push notifications | Real-time |
| **Streak Notifications** | 8 PM reminder if at risk | Scheduled |
| **Game Results** | Signed callback from game server | Immediate |
| **Compliance Reports** | Pre-computed async | On demand |

---

## Points System Quick Reference

```
Base Points × Difficulty × Bonuses = Final Points

Example:
- Base: 100 pts
- Hard: × 1.3 = 130 pts
- Speed (<60% time): × 1.2 = 156 pts
- First attempt: × 1.15 = 179 pts
- 7-day streak: × 1.07 = 192 pts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 192 points awarded
```

**Caps:**
- Speed bonus: 20%
- First attempt: 15%
- Streak multiplier: +1% per day, cap 25%

---

## Compliance Framework Support

Each module can be tagged with one or more frameworks:

| Framework | Use Case |
|-----------|----------|
| **NIST CSF** | US government agencies, contractors |
| **ISO 27001** | International information security standard |
| **SOC 2** | Service organizations, SaaS providers |
| **PCI-DSS** | Payment card processing |
| **HIPAA** | Healthcare providers, medical data |

Employee completion on tagged modules → Compliance matrix report

---

## Common Workflows

### Workflow 1: Setup & Deploy

```
1. Create Supabase project
2. Run supabase/schema.sql
3. npm install && npm run dev (both services)
4. Go to /register → create admin account
5. /admin/modules/create → first module
6. /admin/users → add employees
7. Employees login & see modules
```

### Workflow 2: Launch Phishing Campaign

```
1. /admin/phishing → New Campaign
2. Select employees/departments
3. Acknowledge legal disclosure
4. Launch
5. Emails sent with tracking pixel + link
6. View analytics in real-time
7. Employees auto-assigned remediation
```

### Workflow 3: Generate Compliance Report

```
1. /admin/compliance
2. Select framework (e.g., NIST CSF)
3. View completion matrix
4. Export CSV/PDF
5. Share with audit team
```

### Workflow 4: Monitor Team Performance

```
1. /dashboard (manager view)
2. See department overview
3. Click employee → /admin/reports/[userId]
4. View risk breakdown, remediation log
5. Recommend additional modules
```

---

## Troubleshooting Access Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Can't see `/admin/*` | Not org_admin role | Update `profiles.role = 'org_admin'` in SQL |
| Modules not visible | Not created by admin | Go to `/admin/modules/create` |
| Game won't load | Game server down | `cd game-server && npm run dev` |
| Can't login | Account doesn't exist | Go to `/register` to create |
| Leaderboard static | Realtime off | Refresh page, check WebSocket |

---

**Last Updated:** March 2026 | **SAGP v2.0** 🚀

