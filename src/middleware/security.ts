/**
 * Security Headers and CORS Configuration
 * Part of Phase 6.2.6: Add security headers and CORS configuration
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// ==========================================
// Security Headers Configuration
// ==========================================

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' https://*.firebaseio.com https://*.googleapis.com ${isProd ? '' : "'unsafe-inline' 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com ${isProd ? '' : 'ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*'}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "form-action 'self'",
  ];

  if (isProd) {
    cspDirectives.push('report-uri /api/security/csp-report');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};

// ==========================================
// CORS Configuration
// ==========================================

// Allowed origins based on environment
const getAllowedOrigins = (): (string | RegExp)[] => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return [
      'https://3wm-sonik.com',
      'https://www.3wm-sonik.com',
      'https://endless-lamp-461614-k2.web.app',
      'https://endless-lamp-461614-k2.firebaseapp.com',
    ];
  }

  // Development origins
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    // Replit/Cloud IDE origins (as regex patterns)
    /\.replit\.co$/,
    /\.replit\.dev$/,
    /\.run\.app$/,
  ];
};

// CORS options
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed (supports regex patterns)
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: [
    'X-CSRF-Token',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

// ==========================================
// Content Security Policy Builder
// ==========================================

interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  mediaSrc?: string[];
  workerSrc?: string[];
  frameSrc?: string[];
  formAction?: string[];
}

export const buildCSP = (config: CSPConfig): string => {
  const directives: string[] = [];

  if (config.defaultSrc) {
    directives.push(`default-src ${config.defaultSrc.join(' ')}`);
  }
  if (config.scriptSrc) {
    directives.push(`script-src ${config.scriptSrc.join(' ')}`);
  }
  if (config.styleSrc) {
    directives.push(`style-src ${config.styleSrc.join(' ')}`);
  }
  if (config.imgSrc) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }
  if (config.connectSrc) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }
  if (config.fontSrc) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }
  if (config.mediaSrc) {
    directives.push(`media-src ${config.mediaSrc.join(' ')}`);
  }
  if (config.workerSrc) {
    directives.push(`worker-src ${config.workerSrc.join(' ')}`);
  }
  if (config.frameSrc) {
    directives.push(`frame-src ${config.frameSrc.join(' ')}`);
  }
  if (config.formAction) {
    directives.push(`form-action ${config.formAction.join(' ')}`);
  }

  return directives.join('; ');
};

// Custom CSP middleware
export const customCSP = (config: CSPConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const csp = buildCSP(config);
    res.setHeader('Content-Security-Policy', csp);
    next();
  };
};

// ==========================================
// HSTS Configuration
// ==========================================

export const hstsConfig = {
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true,
};

export const hstsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.secure) {
    const directives = [`max-age=${hstsConfig.maxAge}`];

    if (hstsConfig.includeSubDomains) {
      directives.push('includeSubDomains');
    }

    if (hstsConfig.preload) {
      directives.push('preload');
    }

    res.setHeader('Strict-Transport-Security', directives.join('; '));
  }

  next();
};

// ==========================================
// No-Index for Non-Production
// ==========================================

export const noIndexMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
};

// ==========================================
// Security Middleware Bundle
// ==========================================

// Apply all security middleware at once
export const applySecurityMiddleware = (app: any) => {
  // CORS
  app.use(corsMiddleware);

  // Security headers
  app.use(securityHeaders);

  // HSTS (production only)
  app.use(hstsMiddleware);

  // No-index for non-production
  app.use(noIndexMiddleware);

  return app;
};

// ==========================================
// API Security Headers for API Routes
// ==========================================

export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // API-specific headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Response-Time', Date.now().toString());

  // Rate limit info (if available)
  const rateLimitRemaining = res.getHeader('X-RateLimit-Remaining');
  if (rateLimitRemaining) {
    res.setHeader('X-RateLimit-Remaining', rateLimitRemaining);
  }

  next();
};

// ==========================================
// WebSocket Security Headers
// ==========================================

export const websocketSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // WebSocket upgrade headers
  res.setHeader('X-WebSocket-Protocol', '3wm-sonik-v1');

  // Additional WebSocket security
  res.setHeader('X-WebSocket-Allow-Origin', getAllowedOrigins().join(', '));

  next();
};

// ==========================================
// Download Security Headers
// ==========================================

export const downloadSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent execution of downloaded files
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');

  // Force download for certain file types
  if (req.path.endsWith('.wav') || req.path.endsWith('.mp3') || req.path.endsWith('.flac')) {
    res.setHeader('Content-Disposition', 'attachment');
  }

  next();
};

// ==========================================
// Error Response Security
// ==========================================

export const secureErrorResponse = (res: Response, statusCode: number, message: string) => {
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    // Don't expose stack traces in production
    ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack }),
  });
};

// ==========================================
// Request ID Middleware
// ==========================================

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

// ==========================================
// Request Logging Middleware (Security)
// ==========================================

export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request details for security monitoring
  const logData = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  };

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.log('[Security]', JSON.stringify(logData));
  }

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[Request] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// ==========================================
// Export All Security Middleware
// ==========================================

export const securityMiddleware = {
  headers: securityHeaders,
  cors: corsMiddleware,
  hsts: hstsMiddleware,
  noIndex: noIndexMiddleware,
  api: apiSecurityHeaders,
  websocket: websocketSecurityHeaders,
  download: downloadSecurityHeaders,
  requestId: requestIdMiddleware,
  logging: securityLoggingMiddleware,
  applyAll: applySecurityMiddleware,
};
