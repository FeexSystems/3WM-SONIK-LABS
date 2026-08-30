import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../lib/redis';
import { logger } from '../lib/logger';

/**
 * Redis-based caching middleware for GET requests.
 * @param ttlSeconds Time to live in seconds. Default 60.
 */
export const cacheGetRequests = (ttlSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not ready
    if (!redisClient.isReady()) {
      return next();
    }

    const userId = (req as any).user?.uid || 'anonymous';
    // Create a cache key using the user ID, request path, and query params
    const cacheKey = `cache:${userId}:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedResponse));
      }

      // If not cached, we need to intercept the res.json method
      // to store the response in Redis before sending it.
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.set(cacheKey, JSON.stringify(body), ttlSeconds).catch((err) => {
            logger.error(`[Cache] Failed to set cache for ${cacheKey}: ${err.message}`);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err: any) {
      logger.error(`[Cache] Error retrieving cache for ${cacheKey}: ${err.message}`);
      next(); // Fail gracefully
    }
  };
};

/**
 * Invalidates cache for a specific path prefix for the current user.
 * Call this in POST/PUT/PATCH/DELETE endpoints to clear relevant cache.
 */
export const invalidateCache = async (userId: string, pathPrefix: string): Promise<void> => {
  if (!redisClient.isReady()) return;

  try {
    const redis = redisClient.getClient();
    if (!redis) return;

    const pattern = `cache:${userId}:${pathPrefix}*`;
    let cursor = '0';
    let keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keysToDelete = keysToDelete.concat(keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.info(
        `[Cache] Invalidated ${keysToDelete.length} keys for user ${userId} on ${pathPrefix}`
      );
    }
  } catch (err: any) {
    logger.error(
      `[Cache] Error invalidating cache for user ${userId}, prefix ${pathPrefix}: ${err.message}`
    );
  }
};
