import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || 'your-secret-key';

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
 * Issues a JWT token for the game server
 * Token is single-use, valid for 15 minutes
 */
export function issueGameToken(
  sessionId: string,
  userId: string,
  moduleId: string,
  moduleVersion: number,
  gameType: string,
  orgId: string
): string {
  const tokenId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 15 * 60; // 15 minutes

  const payload: GameTokenPayload = {
    token_id: tokenId,
    session_id: sessionId,
    user_id: userId,
    module_id: moduleId,
    module_version: moduleVersion,
    game_type: gameType,
    org_id: orgId,
    iat: now,
    exp: now + expiresIn,
  };

  return jwt.sign(payload, GAME_SERVER_SECRET, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Verifies a game token and returns the decoded payload
 */
export function verifyGameToken(token: string): GameTokenPayload | null {
  try {
    const decoded = jwt.verify(token, GAME_SERVER_SECRET, {
      algorithms: ['HS256'],
    });
    return decoded as GameTokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
