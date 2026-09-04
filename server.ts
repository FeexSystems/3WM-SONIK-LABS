import * as dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import path from 'path';
import express from 'express';
import { envConfig } from './src/config/environment';
import { swaggerSpec } from './src/config/swagger';
import swaggerUi from 'swagger-ui-express';

// Security Middleware Imports
import {
  corsMiddleware,
  securityHeaders,
  hstsMiddleware,
  noIndexMiddleware,
  apiSecurityHeaders,
  requestIdMiddleware,
  securityLoggingMiddleware,
} from './src/middleware/security';
import { sanitizeInput } from './src/middleware/validation';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';
import apiRoutes from './src/routes';
import statusMonitor from 'express-status-monitor';
import compression from 'compression';

import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin with environment configuration
const firebaseAdminConfig = envConfig.getFirebaseAdminConfig();
if (getApps().length === 0) {
  if (firebaseAdminConfig) {
    try {
      initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: firebaseAdminConfig.projectId,
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      // Fallback for development
      if (envConfig.isDevelopment()) {
        initializeApp({
          projectId: envConfig.getConfig().firebaseProjectId ?? 'demo-project',
        });
      }
    }
  } else {
    console.warn('Firebase Admin configuration not available - using fallback');
    initializeApp({
      projectId: envConfig.getConfig().firebaseProjectId ?? 'demo-project',
    });
  }
}

// Main Server Startup
function startServer() {
  // Validate environment configuration
  try {
    envConfig.getConfig();
    console.warn('[Environment] Configuration validated successfully');
  } catch (error) {
    console.error('[Environment] Configuration validation failed:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  const app = express();
  const server = http.createServer(app);
  const config = envConfig.getConfig();
  const PORT = config.port;
  const HOST = process.env.NODE_ENV === 'production' || process.env.PORT ? '0.0.0.0' : config.host;

  // Supabase Realtime replaces Socket.IO here

  // ==========================================
  // Security Middleware Setup
  // ==========================================

  // Apply global security middleware
  // Performance Monitoring
  app.use(statusMonitor());

  // Response Compression
  app.use(compression());

  app.use(requestIdMiddleware);
  app.use(securityLoggingMiddleware);
  app.use(securityHeaders);
  app.use(hstsMiddleware);
  app.use(noIndexMiddleware);

  // Use the new CORS middleware instead of the old one
  app.use(corsMiddleware);

  // Body parsing middleware — voice endpoints are capped at 32kb to bound
  // paid Gemini cost; everything else inherits the 50mb limit for stem uploads.
  // The per-route json({limit:'32kb'}) in voice.routes.ts is defence-in-depth,
  // but the real enforcement must happen here — the global parser runs first.
  const voiceBodyLimit = express.json({ limit: '32kb' });
  const defaultBodyLimit = express.json({ limit: '50mb' });
  app.use((req, res, next) => {
    const isVoice = req.path.startsWith('/api/voice') || req.path.startsWith('/api/v1/voice');
    return (isVoice ? voiceBodyLimit : defaultBodyLimit)(req, res, next);
  });
  const voiceUrlLimit = express.urlencoded({ extended: true, limit: '32kb' });
  const defaultUrlLimit = express.urlencoded({ extended: true, limit: '50mb' });
  app.use((req, res, next) => {
    const isVoice = req.path.startsWith('/api/voice') || req.path.startsWith('/api/v1/voice');
    return (isVoice ? voiceUrlLimit : defaultUrlLimit)(req, res, next);
  });

  // Input sanitization
  app.use(sanitizeInput);

  // ==========================================
  // Mount Modular Versioned API Routes
  // ==========================================

  // API-specific security headers MUST be registered before the router that
  // handles the request, otherwise they never run.
  app.use('/api', apiSecurityHeaders);
  app.use('/api', apiRoutes);

  // ==========================================
  // 1. Core Endpoints
  // ==========================================

  // Swagger API Documentation — never exposed in production unless explicitly enabled
  if (envConfig.isDevelopment() || process.env.ENABLE_API_DOCS === 'true') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // ==========================================
  // Production Static UI Serving (Cloud Run / Standalone)
  // ==========================================
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('{*path}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  });

  // ==========================================
  // Terminal Handlers (must be registered last)
  // ==========================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  
  // ==========================================
  // Gemini Live Bidirectional WebSocket API
  // ==========================================
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request: any, socket: any, head: any) => {
    const url = request.url || '';
    if (url.startsWith('/ws/live/')) {
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: any, request: any) => {
    console.log('[LiveAudio] WebSocket connection established from UI.');
    const sessionId = request.url.split('/').pop();
    
    // TODO: We need to connect this socket to the @google/genai Live API using WebSockets.
    // For now, we will simulate a connection and echo audio back to prove the loop is closed.

    ws.on('message', (message: any) => {
      // In production, this raw PCM16 audio is piped to the Gemini Live API.
      // And the API's return stream is piped back down this socket.
      // For immediate debugging, we log receiving it.
    });

    ws.on('close', () => {
      console.log('[LiveAudio] WebSocket connection closed.');
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.warn(`[Environment] ${envConfig.getConfig().nodeEnv}`);
    console.warn(
      `[Audio Engine] Buffer: ${envConfig.getConfig().audioBufferSize}, Sample Rate: ${envConfig.getConfig().audioSampleRate}Hz, Bit Depth: ${envConfig.getConfig().audioBitDepth}bit`
    );
    console.warn(`🚀 [3WM SONIK] Production Server Listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
