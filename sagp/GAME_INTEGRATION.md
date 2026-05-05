# Game Bridge & Game Server Integration Guide

## Complete System Overview

The SAGP Game System consists of two main components:

1. **Game Bridge** (Main Platform) - Handles token generation and result verification
2. **Game Server** (Separate Service) - Runs Phaser.js games and collects events

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
└─────────────────────────────────────────────────────────────┘
         ▲                                      ▲
         │ Game Token                          │ Result
         │ (JWT)                               │ (Signed)
         │                                      │
         ▼                                      ▼
┌──────────────────────────────────┐   ┌──────────────────────┐
│   MAIN PLATFORM (Next.js)        │   │   GAME SERVER        │
│  - issueGameToken()              │   │  (Express + Phaser)  │
│  - validateGameToken()           │   │  - Token validation  │
│  - verifyGameResult()            │   │  - Scene rendering   │
│  - /api/game/result              │   │  - Event tracking    │
└──────────────────────────────────┘   │  - Result signing    │
                                        └──────────────────────┘
                                              ▲
                                              │
                                              ▼
                                        ┌──────────────────────┐
                                        │   Phaser.js Game     │
                                        │  - Quiz              │
                                        │  - Phishing Inbox    │
                                        │  - Scenarios         │
                                        │  - Drag & Drop       │
                                        └──────────────────────┘
```

## Setup Instructions

### Part 1: Main Platform Configuration

#### 1.1 Environment Variables

Update `.env.local`:

```env
# Game Server URL
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001

# Must match game-server/.env GAME_SERVER_SECRET
GAME_SERVER_SECRET=dev-secret-12345
```

#### 1.2 Available Imports

**Token Generation:**
```typescript
import { issueGameToken } from '@/lib/game-bridge/token';
import type { GameTokenPayload } from '@/lib/game-bridge/token';
```

**Result Verification:**
```typescript
import {
  verifyGameResult,
  validateResultPayload,
  signGameResult,
  type GameResult
} from '@/lib/game-bridge/verify';
```

### Part 2: Game Server Setup

#### 2.1 Install Dependencies

```bash
cd game-server
npm install
```

#### 2.2 Configuration

Copy `.env.example` to `.env`:

```env
PORT=3001
GAME_SERVER_SECRET=dev-secret-12345
MAIN_PLATFORM_URL=http://localhost:3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

**Critical:** Both platforms must have the same `GAME_SERVER_SECRET`

#### 2.3 Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run start
```

## Implementation Examples

### Example 1: Launch a Game from a Button

**Component:**
```typescript
'use client';

import { issueGameToken } from '@/lib/game-bridge/token';
import { Button } from '@/components/ui/button';

interface GameButtonProps {
  sessionId: string;
  userId: string;
  moduleId: string;
  moduleVersion: number;
  orgId: string;
}

export function PlayGameButton({
  sessionId,
  userId,
  moduleId,
  moduleVersion,
  orgId,
}: GameButtonProps) {
  const handleClick = () => {
    try {
      // Generate JWT token
      const token = issueGameToken(
        sessionId,
        userId,
        moduleId,
        moduleVersion,
        'casino_quiz',  // game type
        orgId
      );

      // Redirect to game server
      const gameUrl = `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game?token=${token}`;
      window.location.href = gameUrl;
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return <Button onClick={handleClick}>Play Quiz Game</Button>;
}
```

### Example 2: Process Game Results

**API Route: `app/api/game/result/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyGameResult, validateResultPayload } from '@/lib/game-bridge/verify';

export async function POST(request: NextRequest) {
  const { result, signature } = await request.json();

  // Verify signature
  if (!verifyGameResult(result, signature)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  }

  // Validate structure
  const validated = validateResultPayload(result);
  if (!validated) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }

  // Process result
  console.log(`User ${validated.user_id} scored ${validated.score}/${validated.max_score}`);

  // TODO: Save to database
  // await saveGameResult(validated);

  return NextResponse.json({ success: true });
}
```

### Example 3: Game Launcher Component

See `src/components/GameLauncher.tsx` for a complete, reusable component.

**Usage:**
```typescript
import { GameLauncher } from '@/components/GameLauncher';

export function ModuleGameSection() {
  return (
    <GameLauncher
      sessionId="sess-123"
      userId="user-456"
      moduleId="mod-789"
      moduleVersion={1}
      orgId="org-000"
    />
  );
}
```

## Game Types Reference

### 1. Casino Quiz (`casino_quiz`)

3-lives multiple choice quiz with slot machine aesthetic.

**When to use:** Knowledge assessment, quiz-style learning

**Sample content:**
```typescript
const questions = [
  {
    text: 'What is phishing?',
    answers: [
      'Stealing credentials via email',
      'Fishing online',
      'Networking protocol',
      'Browser plugin'
    ],
    correct: 0
  }
];
```

**Events emitted:**
- `answer` - Question answered
- `life_lost` - Lost a life

**Scoring:** 10 points per correct answer

---

### 2. Phishing Inbox (`phishing_inbox`)

Email identification game - spot phishing attempts.

**When to use:** Phishing awareness, email security

**Sample content:**
```typescript
const emails = [
  {
    id: 'email1',
    from: 'support@paypa1.com',
    subject: 'Verify Account',
    body: 'Click here to verify...',
    isPhishing: true,
    indicators: [
      'Misspelled domain',
      'Urgent language',
      'Credential request'
    ]
  }
];
```

**Events emitted:**
- `phish_identified` - Correct identification
- `phish_error` - Incorrect classification

**Scoring:** 10 points per correct identification

---

### 3. Scenario (`scenario`)

Branching narratives with consequence-based scoring.

**When to use:** Decision-making, security scenarios

**Sample content:**
```typescript
const scenarios = [
  {
    story: 'Your IT asks for your password via email...',
    choices: [
      {
        text: 'Reply with password',
        consequence: 'Account compromised!',
        impact: -10
      },
      {
        text: 'Report to IT and ignore',
        consequence: 'Correct!',
        impact: 10
      }
    ]
  }
];
```

**Events emitted:**
- `scenario_choice` - Decision made

**Scoring:** Variable based on choice impact

---

### 4. Drag & Drop (`drag_drop`)

Match threats to mitigations or categorize items.

**When to use:** Matching concepts, threat assessment

**Sample content:**
```typescript
const pairs = [
  {
    id: 'pair1',
    threat: 'Phishing Email',
    mitigation: 'User Training'
  },
  {
    id: 'pair2',
    threat: 'Weak Password',
    mitigation: 'MFA'
  }
];
```

**Events emitted:**
- `pair_matched` - Successful match

**Scoring:** 10 points per pair

---

## Event System

### Event Structure

```typescript
interface GameEvent {
  event_type: string;           // 'answer', 'life_lost', etc.
  timestamp: number;            // When event occurred
  data?: Record<string, unknown>; // Event-specific data
}
```

### Event Batching

- Collected on client side
- Sent to server every 30 seconds
- Or when 10+ events accumulated
- Final flush on completion

### Accessing Events in Results

```typescript
const result = {
  // ... other fields
  events: [
    {
      event_type: 'answer',
      timestamp: 1710134400000,
      data: {
        question_index: 0,
        answer_index: 1,
        correct: true
      }
    },
    // ...
  ]
};
```

## Token Management

### Token Lifecycle

1. **Generation** (Main Platform)
   - `issueGameToken()` creates JWT
   - Signed with `GAME_SERVER_SECRET`
   - Expires in 15 minutes
   - Single-use only

2. **Validation** (Game Server)
   - User navigates to `/game?token=JWT`
   - `validateGameToken()` verifies signature
   - Token marked as consumed
   - Game session created

3. **Usage** (Game Client)
   - Token stored in game session
   - Sent with result submission
   - Cannot be reused

### Token Fields

```typescript
{
  token_id: string;        // UUID, unique identifier
  session_id: string;      // Learning session
  user_id: string;         // User identifier
  module_id: string;       // Module identifier
  module_version: number;  // Module version
  game_type: string;       // Game type
  org_id: string;          // Organization
  iat: number;             // Issued at (seconds)
  exp: number;             // Expires (seconds)
}
```

## Result Structure

### Complete Result Payload

```typescript
{
  token_id: string;
  session_id: string;
  user_id: string;
  module_id: string;
  module_version: number;
  game_type: string;
  org_id: string;
  score: number;           // Points earned
  max_score: number;       // Maximum possible
  completed: boolean;      // Whether finished
  duration_seconds: number; // Time elapsed
  events: GameEvent[];     // All game events
  timestamp: number;       // Creation time
}
```

### Example Result

```json
{
  "token_id": "123e4567-e89b-12d3-a456-426614174000",
  "session_id": "sess-abc123",
  "user_id": "user-xyz789",
  "module_id": "phishing-101",
  "module_version": 1,
  "game_type": "casino_quiz",
  "org_id": "org-default",
  "score": 30,
  "max_score": 40,
  "completed": true,
  "duration_seconds": 245,
  "events": [
    {
      "event_type": "answer",
      "timestamp": 1710134400123,
      "data": { "question_index": 0, "correct": true }
    }
  ],
  "timestamp": 1710134645123
}
```

## Security Best Practices

### 1. Secret Management
```typescript
// GOOD - Environment variable
const secret = process.env.GAME_SERVER_SECRET;

// BAD - Hardcoded
const secret = 'hardcoded-secret';
```

### 2. Signature Verification
```typescript
// Always verify before processing
const isValid = verifyGameResult(result, signature);
if (!isValid) {
  throw new Error('Signature verification failed');
}
```

### 3. CORS Configuration
```env
# Only allow trusted origins
CORS_ORIGIN=https://main.example.com,https://game.example.com
```

### 4. Token Reuse Prevention
```typescript
// Game server marks tokens as consumed
markTokenConsumed(payload.token_id);
// Subsequent uses with same token will fail
```

## Testing

### 1. Test Token Generation

```bash
curl -X POST http://localhost:3000/api/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "userId": "test-user",
    "moduleId": "test-module",
    "gameType": "casino_quiz"
  }'
```

### 2. Test Game Server Health

```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"..."}
```

### 3. Test Game Launch

Visit: `http://localhost:3001/game?token=YOUR_JWT_TOKEN`

Should load and display the game.

### 4. Test Result Processing

```bash
curl -X POST http://localhost:3000/api/game/result \
  -H "Content-Type: application/json" \
  -d '{
    "result": { ... },
    "signature": "..."
  }'
```

## Deployment

### Game Server Deployment

**Option 1: Vercel**
```bash
vercel deploy --prod
```

**Option 2: Railway**
- Connect GitHub repo
- Set environment variables
- Deploy

**Option 3: Docker**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD npm run start
EXPOSE 3001
```

### Environment Variables for Production

**Game Server:**
```env
PORT=3001
GAME_SERVER_SECRET=your-prod-secret-minimum-32-chars
MAIN_PLATFORM_URL=https://main.example.com
NODE_ENV=production
CORS_ORIGIN=https://main.example.com
```

**Main Platform:**
```env
NEXT_PUBLIC_GAME_SERVER_URL=https://game.example.com
GAME_SERVER_SECRET=your-prod-secret-minimum-32-chars
```

## Troubleshooting

### Issue: "Invalid token"
**Causes:**
- Secrets don't match
- Token expired (15 min limit)
- Token already used
- Signature validation failed

**Solution:**
```bash
# Verify secrets match
echo $GAME_SERVER_SECRET
# Should be identical on both platforms
```

### Issue: Game page blank
**Causes:**
- Phaser CDN unreachable
- Scene class not found
- JavaScript error in browser

**Solution:**
```typescript
// Check browser console
console.log(window.Phaser); // Should exist
console.log(CasinoQuizScene); // Should exist
```

### Issue: Results not saving
**Causes:**
- `/api/game/result` doesn't exist
- CORS configuration incorrect
- Server communication error

**Solution:**
```bash
# Check network requests in browser DevTools
# Verify endpoint exists
curl http://localhost:3000/api/game/result -X OPTIONS
```

## Files Overview

### Main Platform

| File | Purpose |
|------|---------|
| `src/lib/game-bridge/token.ts` | Token generation |
| `src/lib/game-bridge/verify.ts` | Result verification |
| `src/app/api/game/result/route.ts` | Result endpoint |
| `src/components/GameLauncher.tsx` | UI component |

### Game Server

| File | Purpose |
|------|---------|
| `src/index.ts` | Express server |
| `src/auth.ts` | Token validation |
| `src/event-handler.ts` | Event tracking |
| `src/scene-router.ts` | Game type routing |
| `src/scenes/*.ts` | Phaser game scenes |

## Next Steps

1. Update module loading to use custom content
2. Implement database storage for results
3. Add gamification (achievements, leaderboards)
4. Integrate with user progression system
5. Deploy to production environments
6. Monitor analytics and performance

## Support & Documentation

- **Quick Start:** `GAME_QUICKSTART.md`
- **Full Guide:** `GAME_SERVER_README.md`
- **API Reference:** See endpoint docs in `GAME_SERVER_README.md`
