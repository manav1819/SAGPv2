import crypto from 'crypto';
import axios from 'axios';

const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || 'your-secret-key';
const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'http://localhost:3000';
const EVENT_BATCH_INTERVAL = 30000; // Send events every 30 seconds

export interface GameEvent {
  event_type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface GameSession {
  token_id: string;
  session_id: string;
  user_id: string;
  module_id: string;
  module_version: number;
  game_type: string;
  org_id: string;
  startTime: number;
  events: GameEvent[];
  score: number;
  maxScore: number;
  completed: boolean;
}

class EventHandler {
  private activeSessions: Map<string, GameSession> = new Map();
  private batchIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Creates a new game session
   */
  createSession(
    tokenId: string,
    sessionId: string,
    userId: string,
    moduleId: string,
    moduleVersion: number,
    gameType: string,
    orgId: string
  ): GameSession {
    const session: GameSession = {
      token_id: tokenId,
      session_id: sessionId,
      user_id: userId,
      module_id: moduleId,
      module_version: moduleVersion,
      game_type: gameType,
      org_id: orgId,
      startTime: Date.now(),
      events: [],
      score: 0,
      maxScore: 100,
      completed: false,
    };

    this.activeSessions.set(tokenId, session);

    // Start batch sending for this session
    this.startBatchSending(tokenId);

    return session;
  }

  /**
   * Gets an active session
   */
  getSession(tokenId: string): GameSession | undefined {
    return this.activeSessions.get(tokenId);
  }

  /**
   * Adds an event to a session
   */
  addEvent(
    tokenId: string,
    eventType: string,
    data?: Record<string, unknown>
  ): void {
    const session = this.activeSessions.get(tokenId);
    if (!session) {
      console.error(`Session not found: ${tokenId}`);
      return;
    }

    const event: GameEvent = {
      event_type: eventType,
      timestamp: Date.now(),
      data,
    };

    session.events.push(event);
  }

  /**
   * Updates session score
   */
  updateScore(tokenId: string, score: number, maxScore?: number): void {
    const session = this.activeSessions.get(tokenId);
    if (!session) return;

    session.score = score;
    if (maxScore !== undefined) {
      session.maxScore = maxScore;
    }
  }

  /**
   * Marks session as completed
   */
  completeSession(tokenId: string): void {
    const session = this.activeSessions.get(tokenId);
    if (!session) return;

    session.completed = true;

    // Send final result immediately
    this.sendResult(session);

    // Clean up
    this.stopBatchSending(tokenId);
    this.activeSessions.delete(tokenId);
  }

  /**
   * Sends accumulated events to the main platform
   */
  private async sendEvents(session: GameSession): Promise<void> {
    if (session.events.length === 0) return;

    try {
      // In production, implement proper authentication
      // This could be a service-to-service token or API key
      await axios.post(
        `${MAIN_PLATFORM_URL}/api/game/events`,
        {
          token_id: session.token_id,
          session_id: session.session_id,
          events: session.events.splice(0), // Send and clear
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to send events:', error);
      // In production, implement retry logic
    }
  }

  /**
   * Sends final game result to the main platform
   */
  private async sendResult(session: GameSession): Promise<void> {
    const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);

    const result = {
      token_id: session.token_id,
      session_id: session.session_id,
      user_id: session.user_id,
      module_id: session.module_id,
      module_version: session.module_version,
      game_type: session.game_type,
      org_id: session.org_id,
      score: session.score,
      max_score: session.maxScore,
      completed: session.completed,
      duration_seconds: durationSeconds,
      events: session.events,
      timestamp: Date.now(),
    };

    // Sign the result
    const signature = this.signResult(result);

    try {
      await axios.post(
        `${MAIN_PLATFORM_URL}/api/game/result`,
        {
          result,
          signature,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Result sent for session: ${session.session_id}`);
    } catch (error) {
      console.error('Failed to send result:', error);
      // In production, implement retry logic or fallback
    }
  }

  /**
   * Signs a result with HMAC-SHA256
   */
  private signResult(result: Record<string, unknown>): string {
    const payloadString = JSON.stringify(result, Object.keys(result).sort());
    return crypto
      .createHmac('sha256', GAME_SERVER_SECRET)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Starts batch sending events for a session
   */
  private startBatchSending(tokenId: string): void {
    const interval = setInterval(() => {
      const session = this.activeSessions.get(tokenId);
      if (session && !session.completed) {
        this.sendEvents(session);
      }
    }, EVENT_BATCH_INTERVAL);

    this.batchIntervals.set(tokenId, interval);
  }

  /**
   * Stops batch sending for a session
   */
  private stopBatchSending(tokenId: string): void {
    const interval = this.batchIntervals.get(tokenId);
    if (interval) {
      clearInterval(interval);
      this.batchIntervals.delete(tokenId);
    }
  }
}

export const eventHandler = new EventHandler();
