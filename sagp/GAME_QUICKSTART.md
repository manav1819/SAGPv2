# Game Server Quick Start Guide

## Prerequisites

- Node.js 16+ installed
- Two separate terminals open
- `GAME_SERVER_SECRET` must be the same on both platforms

## Step 1: Configure Secrets

**Main Platform (.env.local):**
```
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
GAME_SERVER_SECRET=dev-secret-12345
```

**Game Server (game-server/.env):**
```
PORT=3001
GAME_SERVER_SECRET=dev-secret-12345
MAIN_PLATFORM_URL=http://localhost:3000
NODE_ENV=development
```

**Important:** Both must use the same `GAME_SERVER_SECRET`

## Step 2: Start Game Server

```bash
cd game-server
npm install
npm run dev
```

Expected output:
```
🎮 Game Server running on port 3001
📍 Game endpoint: http://localhost:3001/game?token=YOUR_TOKEN
❤️ Health check: http://localhost:3001/health
```

## Step 3: Start Main Platform

```bash
# In another terminal
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`

## Step 4: Test the System

### 1. Verify Health Endpoints

```bash
# Game server health
curl http://localhost:3001/health

# Should respond with:
# {"status":"ok","timestamp":"..."}
```

### 2. Test Token Issuance

In Next.js API route or component:

```typescript
import { issueGameToken } from '@/lib/game-bridge/token';

const token = issueGameToken(
  'session-123',
  'user-456',
  'module-789',
  1,
  'casino_quiz',
  'org-000'
);

console.log('Token:', token);
```

### 3. Launch a Game

Navigate to any component using `GameLauncher`:

```typescript
import { GameLauncher } from '@/components/GameLauncher';

export function ModuleGame() {
  return (
    <GameLauncher
      sessionId="session-123"
      userId="user-456"
      moduleId="module-789"
      moduleVersion={1}
      orgId="org-000"
    />
  );
}
```

Click any game button to launch.

## Verifying the Game Works

### In Game Server Console

You should see:
```
2026-03-11T01:00:00.000Z GET /game?token=eyJhbGc...
Game session created for user-456
Events received: 5 events
Result sent successfully
```

### Browser Console

After selecting a game:
- Loading spinner appears
- Phaser game initializes
- Scene-specific UI appears

### Game Completion

When game completes:
1. Final score screen appears
2. Server logs: `Result sent for session: session-123`
3. Main platform receives result at `/api/game/result`

## Game Types to Test

| Type | Command | Visual |
|------|---------|--------|
| Casino Quiz | `casino_quiz` | Golden slot machine theme |
| Phishing Inbox | `phishing_inbox` | Email list UI |
| Scenarios | `scenario` | Brown narrative theme |
| Drag & Drop | `drag_drop` | Green matching interface |

## Troubleshooting

### "Cannot GET /game"
- Game server not running
- Wrong port in `GAME_SERVER_SECRET`

### "Invalid token"
- Secrets don't match between platforms
- Token expired (15 min limit)
- Token already used

### Game page blank
- Check browser console for errors
- Verify Phaser CDN is accessible
- Check `NODE_ENV=development`

### Results not saving
- Check `/api/game/result` endpoint exists
- Verify `MAIN_PLATFORM_URL` is correct
- Check network tab for failed requests

## Next Steps

1. **Connect to Database:**
   - Save results to Supabase
   - Update user progress
   - Award achievements

2. **Add Custom Content:**
   - Load questions from modules
   - Dynamically create scenarios
   - Customize difficulty levels

3. **Deploy:**
   - Game server: Vercel, Render, Railway
   - Main platform: Vercel, Netlify

4. **Monitoring:**
   - Add logging/analytics
   - Track game completion rates
   - Monitor server performance

## File Structure Reference

```
sagp/
├── src/lib/game-bridge/       # Token + verification
│   ├── token.ts               # JWT issuance
│   └── verify.ts              # Result verification
├── src/app/api/game/
│   └── result/route.ts        # Result endpoint
├── src/components/
│   └── GameLauncher.tsx       # UI component
└── game-server/
    ├── package.json
    ├── tsconfig.json
    ├── .env                   # Your config
    ├── .env.example
    └── src/
        ├── index.ts           # Express server
        ├── auth.ts            # Token validation
        ├── event-handler.ts   # Event tracking
        ├── scene-router.ts    # Route to scenes
        └── scenes/
            ├── CasinoQuizScene.ts
            ├── PhishingInboxScene.ts
            ├── ScenarioScene.ts
            └── DragDropScene.ts
```

## Common Environment Variables

**Main Platform (.env.local):**
```
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
GAME_SERVER_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Game Server (game-server/.env):**
```
PORT=3001
GAME_SERVER_SECRET=your-secret-here
MAIN_PLATFORM_URL=http://localhost:3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## API Reference

See `GAME_SERVER_README.md` for:
- Endpoint documentation
- Event types
- Result structure
- Integration examples
- Security considerations
