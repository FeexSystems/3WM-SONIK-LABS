/**
 * Rate Limiting Middleware with Per-Endpoint Limits
 * Part of Phase 6.2.4: Add rate limiting middleware with per-endpoint limits
 * Enhanced with Redis-based rate limiting for production scalability
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redisClient } from '../lib/redis';

// Import Redis-based rate limiters
import {
  strictRateLimit as redisStrictRateLimit,
  moderateRateLimit as redisModerateRateLimit,
  lenientRateLimit as redisLenientRateLimit,
  publicRateLimit as redisPublicRateLimit,
  userBasedRateLimit as redisUserBasedRateLimit,
  ipBasedRateLimit as redisIpBasedRateLimit,
  trackCreateRateLimit as redisTrackCreateRateLimit,
  trackUpdateRateLimit as redisTrackUpdateRateLimit,
  trackGenerateStemRateLimit as redisTrackGenerateStemRateLimit,
  trackExportRateLimit as redisTrackExportRateLimit,
  agentCommandRateLimit as redisAgentCommandRateLimit,
  vocalSynthesisRateLimit as redisVocalSynthesisRateLimit,
  vocalLibraryRateLimit as redisVocalLibraryRateLimit,
  projectCreateRateLimit as redisProjectCreateRateLimit,
  projectUpdateRateLimit as redisProjectUpdateRateLimit,
  createRedisRateLimiter,
} from './redisRateLimit';

export { createRedisRateLimiter };

// Helper removed - we exclusively use Redis for rate limits in production

// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// ==========================================
// Rate Limit Configurations per Endpoint Type
// ==========================================

// Strict rate limiting for expensive operations (audio generation, export)
const strictLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many requests for this resource. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Moderate rate limiting for write operations (create, update, delete)
const moderateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many write operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Lenient rate limiting for read operations (GET requests)
const lenientLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Very lenient for health checks and public endpoints
const publicLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: 'Rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
};

// ==========================================
// Rate Limit Middleware Functions
// ==========================================

// Strict rate limiter for expensive operations (memory-based)
export const strictRateLimitMemory = rateLimit(strictLimitConfig);

// Moderate rate limiter for write operations (memory-based)
export const moderateRateLimitMemory = rateLimit(moderateLimitConfig);

// Lenient rate limiter for read operations (memory-based)
export const lenientRateLimitMemory = rateLimit(lenientLimitConfig);

// Public rate limiter for health checks (memory-based)
export const publicRateLimitMemory = rateLimit(publicLimitConfig);

// ==========================================
// Custom Rate Limiters with User-Based Keys (Memory-based fallbacks)
// ==========================================

// User-based rate limiter (uses user ID from auth)
export const userBasedRateLimitMemory = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many requests from your account. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    // Use user ID if available from auth middleware
    const userId = (req as any).user?.uid || req.ip;
    return userId || req.ip || 'unknown';
  },
});

// IP-based rate limiter for unauthenticated requests
export const ipBasedRateLimitMemory = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

// ==========================================
// Endpoint-Specific Rate Limiters (Memory-based fallbacks)
// ==========================================

// Track operations
export const trackCreateRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many track creation attempts. Please wait before creating more tracks.',
});

export const trackUpdateRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many track updates. Please slow down your editing.',
});

export const trackGenerateStemRateLimitMemory = rateLimit({
  ...strictLimitConfig,
  windowMs: 60 * 1000,
  max: 3,
  message:
    'Too many stem generation requests. Audio generation is resource-intensive. Please wait.',
});

export const trackExportRateLimitMemory = rateLimit({
  ...strictLimitConfig,
  windowMs: 60 * 1000,
  max: 2,
  message: 'Too many export requests. Exporting is resource-intensive. Please wait.',
});

// Agent operations
export const agentCommandRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many agent commands. AI processing has limits. Please slow down.',
});

// Vocal operations
export const vocalSynthesisRateLimitMemory = rateLimit({
  ...strictLimitConfig,
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many vocal synthesis requests. Voice generation is resource-intensive.',
});

export const vocalLibraryRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many vocal library operations. Please slow down.',
});

// Project operations
export const projectCreateRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many project creation attempts. Please wait before creating more projects.',
});

export const projectUpdateRateLimitMemory = rateLimit({
  ...moderateLimitConfig,
  windowMs: 60 * 1000,
  max: 40,
  message: 'Too many project updates. Please slow down.',
});

// ==========================================
// Dynamic Rate Limiter Factory
// ==========================================

// Create a custom rate limiter with specific configuration
export const createRateLimiter = (config: Partial<RateLimitConfig>) => {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded.',
    standardHeaders: true,
    legacyHeaders: false,
    ...config,
  });
};

// ==========================================
// Rate Limit Error Handler
// ==========================================

// Custom rate limit error handler
export const handleRateLimitError = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Rate limit exceeded',
    message: 'You have exceeded the rate limit for this endpoint. Please try again later.',
    retryAfter: res.getHeader('Retry-After') || 60,
  });
};

// ==========================================
// Rate Limit Status Check Middleware
// ==========================================

// Middleware to check rate limit status without enforcing
export const checkRateLimitStatus = (limiter: any) => {
  return (req: Request, res: Response, next: any) => {
    const remaining = res.getHeader('X-RateLimit-Remaining');
    const reset = res.getHeader('X-RateLimit-Reset');

    // Add rate limit info to response headers
    res.setHeader(
      'X-RateLimit-Policy',
      JSON.stringify({
        remaining: remaining || 'unknown',
        reset: reset || 'unknown',
      })
    );

    next();
  };
};

// ==========================================
// Adaptive Rate Limiting
// ==========================================

// Adaptive rate limiter that adjusts based on system load
export const adaptiveRateLimit = (baseConfig: RateLimitConfig) => {
  return rateLimit({
    ...baseConfig,
    // Skip successful requests to reduce load
    skipSuccessfulRequests: true,
    // Use a custom key that includes both IP and user ID
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.uid;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
  });
};

// ==========================================
// Rate Limit Whitelist
// ==========================================

// Create a rate limiter with whitelist support
export const createWhitelistedRateLimiter = (config: RateLimitConfig, whitelist: string[] = []) => {
  return rateLimit({
    ...config,
    skip: (req: Request) => {
      const userId = (req as any).user?.uid;
      return whitelist.includes(userId);
    },
  });
};

// ==========================================
// Smart Rate Limiter Selection
// ==========================================

// Export Redis-backed rate limiters unconditionally
export const strictRateLimit = redisStrictRateLimit.middleware();
export const moderateRateLimit = redisModerateRateLimit.middleware();
export const lenientRateLimit = redisLenientRateLimit.middleware();
export const publicRateLimit = redisPublicRateLimit.middleware();
export const userBasedRateLimit = redisUserBasedRateLimit.middleware();
export const ipBasedRateLimit = redisIpBasedRateLimit.middleware();

// Endpoint-specific rate limiters
export const trackCreateRateLimit = redisTrackCreateRateLimit.middleware();
export const trackUpdateRateLimit = redisTrackUpdateRateLimit.middleware();
export const trackGenerateStemRateLimit = redisTrackGenerateStemRateLimit.middleware();
export const trackExportRateLimit = redisTrackExportRateLimit.middleware();
export const agentCommandRateLimit = redisAgentCommandRateLimit.middleware();
export const vocalSynthesisRateLimit = redisVocalSynthesisRateLimit.middleware();
export const vocalLibraryRateLimit = redisVocalLibraryRateLimit.middleware();
export const projectCreateRateLimit = redisProjectCreateRateLimit.middleware();
export const projectUpdateRateLimit = redisProjectUpdateRateLimit.middleware();

// ==========================================
// Export Default Configurations Map
// ==========================================

export const rateLimitConfigs = {
  strict: strictLimitConfig,
  moderate: moderateLimitConfig,
  lenient: lenientLimitConfig,
  public: publicLimitConfig,
};
