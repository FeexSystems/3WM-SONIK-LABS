/**
 * CSRF Protection Middleware for State-Changing Requests
 * Part of Phase 6.2.5: Implement CSRF protection for state-changing requests
 * Enhanced with Redis-based storage for production scalability
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redisClient } from '../lib/redis';

// ==========================================
// CSRF Token Management
// ==========================================

// Redis enforced storage
// No memory fallback to prevent state desync in clustered environments

// Token expiration time (1 hour)
const TOKEN_EXPIRATION = 60 * 60 * 1000;

// Generate a cryptographically secure CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate a CSRF token
export const validateCSRFToken = async (token: string, sessionToken: string): Promise<boolean> => {
  let stored: { token: string; expiresAt: number } | null = null;

  try {
    const redisToken = await redisClient.get(`csrf:${sessionToken}`);
    if (redisToken) {
      const data = JSON.parse(redisToken);
      stored = { token: data.token, expiresAt: data.expiresAt };
    }
  } catch (error) {
    console.error('[CSRF] Redis validation error:', error);
    return false;
  }

  if (!stored) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > stored.expiresAt) {
    try {
      await redisClient.del(`csrf:${sessionToken}`);
    } catch (e) {
      console.error('[CSRF] Error deleting expired token:', e);
    }
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(stored.token, 'hex'));
};

// Store a CSRF token for a session
export const storeCSRFToken = async (sessionToken: string, token: string): Promise<void> => {
  const expiresAt = Date.now() + TOKEN_EXPIRATION;

  try {
    await redisClient.set(
      `csrf:${sessionToken}`,
      JSON.stringify({ token, expiresAt }),
      TOKEN_EXPIRATION / 1000
    );
  } catch (error) {
    console.error('[CSRF] Redis storage error:', error);
    // Don't swallow the error completely in production, log it heavily
    throw new Error('Failed to persist CSRF token to Redis');
  }
};

// Clean up expired tokens (run periodically)
export const cleanupExpiredTokens = async (): Promise<void> => {
  // Redis handles expiration automatically with TTL
  // No manual cleanup needed
};

// ==========================================
// CSRF Middleware
// ==========================================

// Middleware to generate and attach CSRF token to response
export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const sessionToken = getSessionToken(req);

    if (sessionToken) {
      // Generate new token if none exists or expired
      let stored: { token: string; expiresAt: number } | null = null;

      if (true) {
        try {
          const redisToken = await redisClient.get(`csrf:${sessionToken}`);
          if (redisToken) {
            const data = JSON.parse(redisToken);
            stored = { token: data.token, expiresAt: data.expiresAt };
          }
        } catch (error) {
          console.error('[CSRF] Redis retrieval error:', error);
        }
      }

      if (!stored || Date.now() > stored.expiresAt) {
        const newToken = generateCSRFToken();
        await storeCSRFToken(sessionToken, newToken);
        res.setHeader('X-CSRF-Token', newToken);
      } else {
        res.setHeader('X-CSRF-Token', stored.token);
      }
    }

    next();
    return;
  }

  // For state-changing methods (POST, PUT, PATCH, DELETE), validate token
  const sessionToken = getSessionToken(req);
  const csrfToken = (req.headers['x-csrf-token'] as string) || req.body._csrf || req.query._csrf;

  if (!sessionToken || !csrfToken) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF protection requires a valid token for state-changing requests.',
    });
  }

  const isValid = await validateCSRFToken(csrfToken, sessionToken);
  if (!isValid) {
    return res.status(403).json({
      error: 'CSRF token invalid',
      message: 'The CSRF token provided is invalid or has expired.',
    });
  }

  // Token is valid, proceed
  next();
};

// ==========================================
// Session Token Helpers
// ==========================================

// Get session token from request (from auth middleware or session)
const getSessionToken = (req: Request): string | null => {
  // Try to get from authenticated user
  const userId = (req as any).user?.uid;
  if (userId) {
    return userId;
  }

  // Try to get from session cookie
  const sessionCookie = req.cookies?.session;
  if (sessionCookie) {
    return sessionCookie;
  }

  // Try to get from authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader;
  }

  return null;
};

// ==========================================
// CSRF Token Endpoint
// ==========================================

// Endpoint to get a fresh CSRF token
export const getCSRFToken = async (req: Request, res: Response) => {
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be authenticated to get a CSRF token.',
    });
  }

  const newToken = generateCSRFToken();
  await storeCSRFToken(sessionToken, newToken);

  res.json({
    csrfToken: newToken,
    expiresAt: Date.now() + TOKEN_EXPIRATION,
  });
};

// ==========================================
// CSRF Validation for Specific Endpoints
// ==========================================

// Middleware to validate CSRF token only for specific methods
export const csrfValidate = (methods: string[] = ['POST', 'PUT', 'PATCH', 'DELETE']) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!methods.includes(req.method)) {
      next();
      return;
    }

    const sessionToken = getSessionToken(req);
    const csrfToken = (req.headers['x-csrf-token'] as string) || req.body._csrf || req.query._csrf;

    if (!sessionToken || !csrfToken) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF protection requires a valid token for this request.',
      });
    }

    const isValid = await validateCSRFToken(csrfToken, sessionToken);
    if (!isValid) {
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'The CSRF token provided is invalid or has expired.',
      });
    }

    next();
  };
};

// ==========================================
// Double Submit Cookie Pattern
// ==========================================

// Alternative CSRF protection using double-submit cookie pattern
export const doubleSubmitCookieProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const sessionToken = getSessionToken(req);
    if (sessionToken) {
      const csrfToken = generateCSRFToken();
      await storeCSRFToken(sessionToken, csrfToken);
      res.cookie('csrf_token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRATION / 1000,
      });
    }
    next();
    return;
  }

  // Validate for state-changing methods
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = (req.headers['x-csrf-token'] as string) || req.body._csrf;

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'Both cookie and header CSRF tokens are required.',
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      error: 'CSRF token mismatch',
      message: 'The CSRF tokens do not match.',
    });
  }

  next();
};

// ==========================================
// CSRF Error Handler
// ==========================================

export const handleCSRFError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token.',
    });
  }
  next(err);
};

// ==========================================
// Periodic Cleanup
// ==========================================

// Schedule cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
}
