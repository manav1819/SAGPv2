# SAGP — Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- Git (optional, for cloning)

## Step 1: Setup Supabase Database

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or use existing
3. Copy your project URL and API keys
4. In Supabase → SQL Editor, run all SQL from `supabase/schema.sql`:
   - Creates 25 tables
   - Seeds 10 badges
   - Configures RLS policies

## Step 2: Update Environment Variables

**File:** `sagp/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
GAME_SERVER_SECRET=dev-secret-change-in-prod
JWT_SECRET=dev-jwt-secret-change-in-prod
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Install Dependencies

### Main Platform
```bash
cd sagp
npm install
```

### Game Server
```bash
cd game-server
npm install
```

## Step 4: Start Both Services

**Terminal 1 — Main Platform:**
```bash
cd sagp
npm run dev
```

Expected output:
```
> sagp@1.0.0 dev
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
```

**Terminal 2 — Game Server:**
```bash
cd sagp/game-server
npm run dev
```

Expected output:
```
> sagp-game-server@1.0.0 dev
  🎮 Game Server running on port 3001
  📍 Game endpoint: http://localhost:3001/game?token=YOUR_TOKEN
  ❤️ Health check: http://localhost:3001/health
```

## Step 5: Create First Admin Account

1. Open `http://localhost:3000/register`
2. Fill out registration form:
   - **First Name:** John
   - **Last Name:** Admin
   - **Email:** admin@company.com
   - **Organization:** MyCompany (or leave blank)
   - **Department:** IT
   - **Role:** Choose "Admin" from dropdown
   - **Password:** Create strong password (8+ chars)
3. Click "Register"
4. You'll be auto-logged in

## Step 6: Create First Training Module

1. Go to `http://localhost:3000/admin/dashboard` (should auto-redirect)
2. Click "Create Module" button
3. Fill out form:
   - **Title:** "Phishing Awareness Basics"
   - **Description:** "Learn to identify phishing emails"
   - **Category:** Phishing
   - **Difficulty:** Easy
   - **Game Type:** quiz
   - **Points:** 100
   - **Estimated Time:** 10 minutes
   - **Compliance Tags:** Check "NIST", "ISO27001"
4. Click "Create Module"

## Step 7: Create Test Employee Account

1. Go to `http://localhost:3000/admin/users`
2. Click "Add User"
3. Fill form:
   - **Email:** employee@company.com
   - **First Name:** Jane
   - **Last Name:** Employee
   - **Department:** HR
   - **Role:** Employee
4. Click "Create"
5. Check email for account creation link
6. Set password and login

## Step 8: Test the Game

**As Employee:**
1. Login to `http://localhost:3000` with employee account
2. Go to `/modules`
3. Click the "Phishing Awareness Basics" card
4. Click "Start Game"
5. Play the quiz (multiple choice)
6. Submit and see results

**Expected behavior:**
- Full-screen overlay loads
- Game runs in Phaser scene
- Score calculated with bonuses
- Points awarded to account
- Return to modules list

## Step 9: Check Leaderboard

1. Go to `http://localhost:3000/leaderboard`
2. See your employee on the rankings
3. Try different scopes: Global, Org, Department, Weekly

## Step 10: View Analytics (As Admin)

1. Login as admin account
2. Go to `http://localhost:3000/admin/dashboard`
3. See Company Security Score gauge
4. Go to `/admin/analytics` for completion heatmap, risk distribution
5. Go to `/admin/reports/[userId]` for per-employee report

---

## Troubleshooting

### Game Server Won't Start
```
Error: Cannot find module 'axios'
```
**Solution:**
```bash
cd sagp/game-server
npm install axios ts-node
npm run dev
```

### Can't Connect to Supabase
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```
**Solution:** Check `.env.local` has correct Supabase URL and keys

### Game Overlay Won't Load
- Make sure game server is running on port 3001
- Check browser console for errors
- Verify `NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001`

### "Module not found" Error
- The module may not have been created yet
- Go to `/admin/modules` to verify
- Create a test module via `/admin/modules/create`

### Leaderboard Not Real-Time
- Supabase Realtime may need to be enabled
- Go to Supabase Dashboard → Realtime → Enable for `leaderboard` table
- Refresh page

---

## Common URLs

| Page | URL | Role |
|------|-----|------|
| Home/Dashboard | `http://localhost:3000/` | Any |
| Login | `http://localhost:3000/login` | Public |
| Register | `http://localhost:3000/register` | Public |
| Admin Dashboard | `http://localhost:3000/admin/dashboard` | Admin |
| Modules | `http://localhost:3000/modules` | Employee+ |
| Leaderboard | `http://localhost:3000/leaderboard` | Employee+ |
| Badges | `http://localhost:3000/badges` | Employee+ |
| Profile | `http://localhost:3000/profile` | Employee+ |
| Game | `http://localhost:3000/game/[sessionId]` | During play |

---

## Next Steps

- Read **SAGP_COMPLETE_GUIDE.md** for full feature documentation
- Check **DASHBOARD_ACCESS_CHEATSHEET.md** for role-based access
- Review database schema in `supabase/schema.sql`
- Deploy to production (Railway, Vercel, etc.)

---

**All set!** 🚀 Your SAGP platform is running locally.

