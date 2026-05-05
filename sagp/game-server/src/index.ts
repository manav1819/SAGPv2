import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { validateGameToken, markTokenConsumed } from './auth';
import { eventHandler } from './event-handler';
import { getSceneClass, isValidGameType } from './scene-router';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  })
);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Static file serving for game assets
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Game endpoint - validates token and serves game
 * GET /game?token=JWT
 */
app.get('/game', (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  // Validate and decode token
  const payload = validateGameToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Validate game type
  if (!isValidGameType(payload.game_type)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  // Mark token as consumed
  markTokenConsumed(payload.token_id);

  // Create game session
  const session = eventHandler.createSession(
    payload.token_id,
    payload.session_id,
    payload.user_id,
    payload.module_id,
    payload.module_version,
    payload.game_type,
    payload.org_id
  );

  // Get scene class name
  const sceneClass = getSceneClass(payload.game_type);

  // Render game HTML
  const gameHtml = renderGameHtml(sceneClass, token, payload);
  res.setHeader('Content-Type', 'text/html');
  res.send(gameHtml);
});

/**
 * Health status endpoint
 * GET /api/health
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sessions_active: eventHandler['activeSessions'].size,
  });
});

/**
 * Event logging endpoint (optional, for real-time event tracking)
 * POST /api/events
 */
app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { token_id, event_type, data } = req.body;

    if (!token_id || !event_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = eventHandler.getSession(token_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    eventHandler.addEvent(token_id, event_type, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

/**
 * Endpoint for game to save progress
 * POST /api/save-state
 */
app.post('/api/save-state', (req: Request, res: Response) => {
  try {
    const { token_id, score, state } = req.body;

    if (!token_id) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    const session = eventHandler.getSession(token_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update score if provided
    if (score !== undefined) {
      eventHandler.updateScore(token_id, score);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving state:', error);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

/**
 * Endpoint for completing game
 * POST /api/game/complete
 */
app.post('/api/game/complete', (req: Request, res: Response) => {
  try {
    const { token_id } = req.body;

    if (!token_id) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    eventHandler.completeSession(token_id);
    res.json({ success: true, message: 'Game completed and result sent' });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ error: 'Failed to complete game' });
  }
});

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Renders the game HTML page with Phaser loaded
 */
function renderGameHtml(sceneClass: string, token: string, payload: any): string {
  const sceneCode = getSceneCode(sceneClass);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAGP Game - ${sceneClass}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #1a1a1a;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 10px;
            overflow: hidden;
        }
        #game {
            background: #000;
            border: 2px solid #333;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
            max-width: 100vw;
            max-height: 100vh;
        }
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            color: #fff;
            z-index: 9999;
            flex-direction: column;
            gap: 20px;
        }
        .spinner {
            border: 4px solid #333;
            border-top: 4px solid #0ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="game"></div>
    <div id="loading">
        <div class="spinner"></div>
        <div>Loading Game...</div>
    </div>

    <script>
        // Inject payload for scene initialization
        window.gamePayload = ${JSON.stringify(payload)};
        window.gameToken = '${token}';

        // GameEventHandler for client-side event management
        class GameEventHandler {
            constructor() {
                this.events = [];
                this.batchInterval = setInterval(() => this.flushEvents(), 30000);
            }

            addEvent(tokenId, eventType, data) {
                this.events.push({
                    event_type: eventType,
                    timestamp: Date.now(),
                    data: data || {}
                });
            }

            updateScore(tokenId, score, maxScore) {
                fetch('/api/save-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token_id: tokenId,
                        score: score,
                        max_score: maxScore
                    })
                }).catch(err => console.error('Failed to save score:', err));
            }

            completeSession(tokenId) {
                clearInterval(this.batchInterval);
                this.flushEvents();

                setTimeout(() => {
                    fetch('/api/game/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token_id: tokenId })
                    }).catch(err => console.error('Failed to complete session:', err));
                }, 500);
            }

            flushEvents() {
                if (this.events.length === 0) return;

                const eventsToSend = [...this.events];
                this.events = [];

                fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token_id: window.gameToken,
                        events: eventsToSend
                    })
                }).catch(err => console.error('Failed to send events:', err));
            }
        }

        const gameEventHandler = new GameEventHandler();
    </script>

    <!-- Scene code injected here -->
    <script>
${sceneCode}
    </script>

    <script>
        // Initialize Phaser game
        const config = {
            type: Phaser.AUTO,
            width: Math.max(800, window.innerWidth - 20),
            height: Math.max(600, window.innerHeight - 20),
            parent: 'game',
            scene: [],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            }
        };

        const game = new Phaser.Game(config);

        // Wait for Phaser to initialize, then add our scene
        setTimeout(() => {
            const SceneClass = window['${sceneClass}'];
            if (SceneClass) {
                const scene = new SceneClass();
                game.scene.add('${sceneClass}', scene, true);
                game.scene.start('${sceneClass}', {
                    tokenId: window.gamePayload.token_id,
                    gameEventHandler: gameEventHandler
                });

                // Hide loading indicator
                const loading = document.getElementById('loading');
                if (loading) loading.style.display = 'none';
            } else {
                console.error('Scene class not found: ${sceneClass}');
                const loading = document.getElementById('loading');
                if (loading) loading.innerHTML = '<div style="color: #f00;">Error: Scene not found</div>';
            }
        }, 100);
    </script>
</body>
</html>`;
}

/**
 * Returns the scene code based on the scene class name
 */
function getSceneCode(sceneClass: string): string {
  const sceneCodes: Record<string, string> = {
    CasinoQuizScene: getCasinoQuizCode(),
    PhishingInboxScene: getPhishingInboxCode(),
    ScenarioScene: getScenarioCode(),
    DragDropScene: getDragDropCode(),
  };

  const code = sceneCodes[sceneClass];
  if (!code) {
    console.error(`Scene code not found for: ${sceneClass}`);
    return '<script>console.error("Scene not found");</script>';
  }

  return `<script>${code}</script>`;
}

/**
 * Returns scene implementation code
 */
function getCasinoQuizCode(): string {
  // Import from CasinoQuizScene.ts
  const { CasinoQuizSceneCode } = require('./scenes/CasinoQuizScene');
  return CasinoQuizSceneCode;
}

function getPhishingInboxCode(): string {
  // Import from PhishingInboxScene.ts
  const { PhishingInboxSceneCode } = require('./scenes/PhishingInboxScene');
  return PhishingInboxSceneCode;
}

function getScenarioCode(): string {
  // Import from ScenarioScene.ts
  const { ScenarioSceneCode } = require('./scenes/ScenarioScene');
  return ScenarioSceneCode;
}

function getDragDropCode(): string {
  // Import from DragDropScene.ts
  const { DragDropSceneCode } = require('./scenes/DragDropScene');
  return DragDropSceneCode;
}

// Start server
app.listen(PORT, () => {
  console.log(`🎮 Game Server running on port ${PORT}`);
  console.log(`📍 Game endpoint: http://localhost:${PORT}/game?token=YOUR_TOKEN`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});
