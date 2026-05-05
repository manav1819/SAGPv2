import jwt from 'jsonwebtoken';

const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || 'your-secret-key';

// In-memory store for consumed tokens
// In production, use a Redis cache or database
const consumedTokens = new Set<string>();

export interface GameTokenPayload {
  token_id: string;
  session_id: string;
  user_id: string;
  module_id: string;
  module_version: number;
  game_type: string;
  org_id: string;
  iat: number;
  exp: number;
}

/**
 * Validates a game token and returns the decoded payload
 * @throws Error if token is invalid or expired
 */
export function validateGameToken(token: string): GameTokenPayload {
  try {
    const decoded = jwt.verify(token, GAME_SERVER_SECRET, {
      algorithms: ['HS256'],
    }) as GameTokenPayload;

    // Check if token has already been used
    if (consumedTokens.has(decoded.token_id)) {
      throw new Error('Token has already been used');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Marks a token as consumed (single-use enforcement)
 */
export function markTokenConsumed(tokenId: string): void {
  consumedTokens.add(tokenId);

  // Clean up old entries periodically
  // In production, implement proper token storage/cleanup
}

/**
 * Checks if a token has been consumed
 */
export function isTokenConsumed(tokenId: string): boolean {
  return consumedTokens.has(tokenId);
}

/**
 * Clears all consumed tokens (for testing/development only)
 */
export function clearConsumedTokens(): void {
  consumedTokens.clear();
}

/**
 * Gets stats on consumed tokens
 */
export function getTokenStats(): { consumedCount: number } {
  return {
    consumedCount: consumedTokens.size,
  };
}
