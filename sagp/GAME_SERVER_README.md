# SAGP Game Bridge & Game Server Documentation

## Overview

This documentation covers the Game Bridge (JWT token system) and the Phaser.js Game Server for the SAGP project. The system enables secure game session management with event tracking and result verification.

## Architecture

```
┌─────────────────────────────────────────┐
│      Main Platform (Next.js)            │
│  - Game Bridge (token.ts, verify.ts)    │
│  - Issues JWT tokens                    │
│  - Receives game results                │
└────────────┬────────────────────────────┘
             │ JWT Token
             ▼
┌─────────────────────────────────────────┐
│    Game Server (Express.js)             │
│  - Token validation (auth.ts)           │
│  - Event handling (event-handler.ts)    │
│  - Phaser scenes (4 game types)         │
│  - Sends results back                   │
└─────────────────────────────────────────┘
```

## Game Bridge (Main Platform)

### Files

- **`src/lib/game-bridge/token.ts`** - JWT token issuance
- **`src/lib/game-bridge/verify.ts`** - Result verification and validation

### Token Issuance

```typescript
import { issueGameToken } from '@/lib/game-bridge/token';

const token = issueGameToken(
  sessionId,      // User's learning session ID
  userId,         // User ID
  moduleId,       // Learning module ID
  moduleVersion,  // Module version
  gameType,       // 'casino_quiz' | 'phishing_inbox' | 'scenario' | 'drag_drop'
  orgId           // Organization ID
);

// Token is valid for 15 minutes and single-use
// Redirect user: `${GAME_SERVER_URL}/game?token=${token}`
```

### Token Payload

```typescript
{
  token_id: string;           // UUID, uniquely identifies this token
  session_id: string;         // Learning session identifier
  user_id: string;            // User identifier
  module_id: string;          // Module identifier
  module_version: number;     // Module version
  game_type: string;          // Game type identifier
  org_id: string;             // Organization identifier
  iat: number;                // Issued at timestamp (seconds)
  exp: number;                // Expiration timestamp (seconds, +15 min)
}
```

### Result Verification

```typescript
import { verifyGameResult, validateResultPayload, signGameResult } from '@/lib/game-bridge/verify';

// Verify the signature
const isValid = verifyGameResult(resultPayload, signature);

// Validate the result structure
const validated = validateResultPayload(resultData);
if (!validated) {
  console.error('Invalid result');
}

// Create a signature for a result (game server does this)
const signature = signGameResult(resultPayload);
```

### Result Payload Structure

```typescript
{
  token_id: string;
  session_id: string;
  user_id: string;
  module_id: string;
  module_version: number;
  game_type: string;
  org_id: string;
  score: number;                // Final score achieved
  max_score: number;            // Maximum possible score
  completed: boolean;           // Whether game was completed
  duration_seconds: number;     // Time spent in game
  events: Array<{
    event_type: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }>;
  timestamp: number;            // When result was created
}
```

## Game Server

### Setup

```bash
cd game-server
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
GAME_SERVER_SECRET=your-secret-key-must-match-main-platform
MAIN_PLATFORM_URL=http://localhost:3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run start
```

### Endpoints

#### GET /game?token=JWT
Validates token and serves the game page with Phaser.js loaded.

**Response:** HTML page with Phaser game and selected scene

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T01:00:00.000Z"
}
```

#### GET /api/health
Detailed health with session count.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T01:00:00.000Z",
  "sessions_active": 5
}
```

#### POST /api/events
Log game events (called by game client).

**Request:**
```json
{
  "token_id": "token-uuid",
  "event_type": "answer",
  "data": {
    "question_index": 0,
    "answer_index": 1,
    "correct": true
  }
}
```

#### POST /api/save-state
Save game progress.

**Request:**
```json
{
  "token_id": "token-uuid",
  "score": 50,
  "max_score": 100
}
```

#### POST /api/game/complete
Mark game as completed and send final result to main platform.

**Request:**
```json
{
  "token_id": "token-uuid"
}
```

## Game Types

### 1. Casino Quiz Scene
**Type:** `casino_quiz`

Quiz game with slot machine aesthetic.

**Features:**
- Multiple choice questions
- 3-lives system
- Score tracking
- Visible timer
- Wrong answers cost a life
- Game ends on loss or completion

**Events:**
- `answer` - User answers a question
- `life_lost` - User loses a life

### 2. Phishing Inbox Scene
**Type:** `phishing_inbox`

Email inbox with phishing identification task.

**Features:**
- Email list UI
- Phishing indicators displayed
- Must identify phishing vs safe emails
- Report Phishing or Mark as Safe buttons
- Score based on correct identification

**Events:**
- `phish_identified` - User correctly identifies phishing
- `phish_error` - User incorrectly classifies email

### 3. Scenario Scene
**Type:** `scenario`

Branching narrative with security decisions.

**Features:**
- Story-based scenarios
- Multiple choice branches
- Consequence text for decisions
- Score impact varies by choice
- Path tracking

**Events:**
- `scenario_choice` - User makes a decision

### 4. Drag & Drop Scene
**Type:** `drag_drop`

Match threats to mitigations or sort items.

**Features:**
- Drag and drop mechanics
- Threat-to-mitigation matching
- Visual feedback on matches
- Time pressure
- Score based on correct matches

**Events:**
- `pair_matched` - User successfully matches a pair

## Client-Side Integration

### In Your Game Application Component

```typescript
import { issueGameToken } from '@/lib/game-bridge/token';

function startGame(gameType: string) {
  const token = issueGameToken(
    sessionId,
    userId,
    moduleId,
    moduleVersion,
    gameType,
    orgId
  );

  // Redirect to game server
  const gameUrl = `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game?token=${token}`;
  window.location.href = gameUrl;
}
```

### Handling Game Results

Create an API route to receive game results:

```typescript
// app/api/game/result/route.ts
import { verifyGameResult, validateResultPayload } from '@/lib/game-bridge/verify';

export async function POST(request: Request) {
  const { result, signature } = await request.json();

  // Verify signature
  if (!verifyGameResult(result, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Validate payload
  const validated = validateResultPayload(result);
  if (!validated) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Process result - save to database, update session, etc.
  // ...

  return Response.json({ success: true });
}
```

## Event Tracking

### Event Types

Events are automatically collected by the game scenes and sent to the main platform.

**Common events:**
- `answer` - Question answered
- `life_lost` - Lost a life
- `phish_identified` - Correctly identified phishing
- `phish_error` - Incorrectly classified email
- `scenario_choice` - Made a scenario decision
- `pair_matched` - Matched a drag-drop pair
- `hint_used` - Used a hint (optional)

### Event Batching

Events are accumulated on the client and sent in batches:
- Every 30 seconds (periodic flush)
- On game completion (immediate)
- In batches of 10+ events

## Security Considerations

1. **Token Validation**
   - Tokens are single-use (marked as consumed after first use)
   - Tokens expire after 15 minutes
   - Tokens are HMAC-SHA256 signed

2. **Result Verification**
   - Results are signed with HMAC-SHA256
   - Signatures use constant-time comparison (timing attack resistant)
   - All required fields validated

3. **CORS**
   - Configured to only allow specified origins
   - Credentials included in requests

4. **Secret Management**
   - `GAME_SERVER_SECRET` must match between platforms
   - Use strong cryptographic secrets in production
   - Never commit secrets to version control

## Troubleshooting

### Token Not Validating
- Ensure `GAME_SERVER_SECRET` matches on both platforms
- Check that token hasn't expired (15 min limit)
- Verify token hasn't been used before

### Game Not Loading
- Check browser console for errors
- Verify Phaser CDN is accessible
- Ensure scene class exists for game type

### Results Not Saving
- Check `MAIN_PLATFORM_URL` configuration
- Verify the `/api/game/result` endpoint exists on main platform
- Check network tab for failed requests

### CORS Issues
- Verify `CORS_ORIGIN` includes your domain
- Check browser console for CORS error details
- Restart game server after config changes

## Performance Notes

- Game server should run on separate port from main platform
- Can be deployed as a microservice
- In-memory token storage suitable for development; use Redis for production
- Phaser scenes compile to ~100KB+ depending on complexity

## Future Enhancements

- Redis-based token storage for distributed systems
- Leaderboard integration
- Difficulty levels / adaptive gameplay
- Asset preloading optimization
- WebSocket support for real-time updates
- Analytics integration
- Custom content loading from modules
