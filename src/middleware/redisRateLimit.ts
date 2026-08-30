/**
 * Redis-based Rate Limiting Middleware
 * Production-ready rate limiting using Redis for distributed systems
 */

import { Request, Response } from 'express';
import { redisClient } from '../lib/redis';

interface RedisRateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitInfo {
  current: number;
  remaining: number;
  resetTime: number;
}

export class RedisRateLimiter {
  private config: RedisRateLimitConfig;

  constructor(config: RedisRateLimitConfig) {
    this.config = config;
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation: IP-based or user-based
    const userId = (req as any).user?.uid;
    if (userId) {
      return `ratelimit:user:${userId}`;
    }

    return `ratelimit:ip:${req.ip || 'unknown'}`;
  }

  private async getRateLimitInfo(key: string): Promise<RateLimitInfo> {
    if (!redisClient.isReady()) {
      // Fallback to in-memory if Redis not available
      return {
        current: 0,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        // First request, set expiration
        await redisClient.expire(key, Math.ceil(this.config.windowMs / 1000));
      }

      const ttl = await redisClient.pttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl : this.config.windowMs);

      return {
        current,
        remaining: Math.max(0, this.config.max - current),
        resetTime,
      };
    } catch (error) {
      console.error('[RateLimit] Redis error:', error);
      // Fallback on error
      return {
        current: 0,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }

  private setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
    if (this.config.standardHeaders) {
      res.setHeader('X-RateLimit-Limit', this.config.max.toString());
      res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

      const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
      if (retryAfter > 0) {
        res.setHeader('Retry-After', retryAfter.toString());
      }
    }
  }

  public middleware() {
    return async (req: Request, res: Response, next: any) => {
      const key = this.getKey(req);

      try {
        const info = await this.getRateLimitInfo(key);

        // Check if limit exceeded
        if (info.current > this.config.max) {
          this.setRateLimitHeaders(res, info);
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: this.config.message,
            retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
          });
        }

        // Set headers for successful requests
        this.setRateLimitHeaders(res, info);

        // Skip successful requests if configured
        if (this.config.skipSuccessfulRequests) {
          const originalJson = res.json.bind(res);
          res.json = function (data: any) {
            if (res.statusCode < 400) {
              // Decrement counter on success
              redisClient.decr(key).catch(() => {});
            }
            return originalJson(data);
          };
        }

        next();
      } catch (error) {
        console.error('[RateLimit] Middleware error:', error);
        // On error, allow request through (fail-open)
        next();
      }
    };
  }
}

// ==========================================
// Pre-configured Rate Limiters
// ==========================================

// Strict rate limiting for expensive operations
export const strictRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many requests for this resource. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiting for write operations
export const moderateRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many write operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiting for read operations
export const lenientRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public rate limiter for health checks
export const publicRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// User-based Rate Limiter
// ==========================================

export const userBasedRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many requests from your account. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.uid || req.ip;
    return `ratelimit:user:${userId || req.ip || 'unknown'}`;
  },
});

// ==========================================
// IP-based Rate Limiter
// ==========================================

export const ipBasedRateLimit = new RedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `ratelimit:ip:${req.ip || 'unknown'}`;
  },
});

// ==========================================
// Endpoint-Specific Rate Limiters
// ==========================================

// Track operations
export const trackCreateRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many track creation attempts. Please wait before creating more tracks.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const trackUpdateRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many track updates. Please slow down your editing.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const trackGenerateStemRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message:
    'Too many stem generation requests. Audio generation is resource-intensive. Please wait.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const trackExportRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 2,
  message: 'Too many export requests. Exporting is resource-intensive. Please wait.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Agent operations
export const agentCommandRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many agent commands. AI processing has limits. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Vocal operations
export const vocalSynthesisRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many vocal synthesis requests. Voice generation is resource-intensive.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const vocalLibraryRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many vocal library operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Project operations
export const projectCreateRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many project creation attempts. Please wait before creating more projects.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const projectUpdateRateLimit = new RedisRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Too many project updates. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// Factory Function for Custom Rate Limiters
// ==========================================

export const createRedisRateLimiter = (config: Partial<RedisRateLimitConfig>) => {
  return new RedisRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded.',
    standardHeaders: true,
    legacyHeaders: false,
    ...config,
  });
};
