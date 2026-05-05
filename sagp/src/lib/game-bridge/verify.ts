import crypto from 'crypto';

const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || 'your-secret-key';

export interface GameResult {
  token_id: string;
  session_id: string;
  user_id: string;
  module_id: string;
  module_version: number;
  game_type: string;
  org_id: string;
  score: number;
  max_score: number;
  completed: boolean;
  duration_seconds: number;
  events: Array<{
    event_type: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }>;
  timestamp: number;
}

/**
 * Verifies the signature of a game result
 * Uses HMAC-SHA256 with the game server secret
 */
export function verifyGameResult(
  payload: GameResult,
  signature: string
): boolean {
  try {
    // Create the canonical payload string (sorted keys for consistency)
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', GAME_SERVER_SECRET)
      .update(payloadString)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Result verification failed:', error);
    return false;
  }
}

/**
 * Validates and sanitizes a game result payload
 */
export function validateResultPayload(data: unknown): GameResult | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const payload = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = [
    'token_id',
    'session_id',
    'user_id',
    'module_id',
    'module_version',
    'game_type',
    'org_id',
    'score',
    'max_score',
    'completed',
    'duration_seconds',
    'events',
    'timestamp',
  ];

  for (const field of requiredFields) {
    if (!(field in payload)) {
      console.error(`Missing required field: ${field}`);
      return null;
    }
  }

  // Validate field types
  if (typeof payload.token_id !== 'string') return null;
  if (typeof payload.session_id !== 'string') return null;
  if (typeof payload.user_id !== 'string') return null;
  if (typeof payload.module_id !== 'string') return null;
  if (typeof payload.module_version !== 'number') return null;
  if (typeof payload.game_type !== 'string') return null;
  if (typeof payload.org_id !== 'string') return null;
  if (typeof payload.score !== 'number') return null;
  if (typeof payload.max_score !== 'number') return null;
  if (typeof payload.completed !== 'boolean') return null;
  if (typeof payload.duration_seconds !== 'number') return null;
  if (!Array.isArray(payload.events)) return null;
  if (typeof payload.timestamp !== 'number') return null;

  // Validate score ranges
  if (payload.score < 0 || payload.score > payload.max_score) {
    console.error('Score out of valid range');
    return null;
  }

  // Validate events
  const events = payload.events as Array<unknown>;
  for (const event of events) {
    if (typeof event !== 'object' || event === null) {
      return null;
    }
    const eventObj = event as Record<string, unknown>;
    if (typeof eventObj.event_type !== 'string') return null;
    if (typeof eventObj.timestamp !== 'number') return null;
  }

  // All validations passed
  return payload as unknown as GameResult;
}

/**
 * Creates a signature for a game result
 * Used by the game server to sign results
 */
export function signGameResult(payload: GameResult): string {
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto
    .createHmac('sha256', GAME_SERVER_SECRET)
    .update(payloadString)
    .digest('hex');
}
