import { Request, Response, NextFunction } from 'express';
import { adminDb } from '../lib/firebase-admin';
import { redisClient } from '../lib/redis';
import crypto from 'crypto';

export interface ApiKeyRequest extends Request {
  apiKeyData?: {
    id: string;
    organizationId?: string;
    userId?: string;
    permissions: string[];
  };
}

/**
 * Validates an API key provided in the X-API-Key header.
 * Uses Redis for caching valid keys to reduce database load.
 */
export const requireApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing X-API-Key header' });
  }

  try {
    // 1. Hash the key to check against stored hashes (security best practice)
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const cacheKey = `apikey:${hashedKey}`;

    // 2. Check Redis cache first
    if (redisClient.isReady()) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        req.apiKeyData = JSON.parse(cachedData);
        return next();
      }
    }

    // 3. Fallback to Database check if not in cache
    if (!adminDb) {
      console.error('🚨 CRITICAL: Firebase Admin not configured - cannot validate API key');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const apiKeysRef = adminDb.collection('apiKeys');
    // Search for the active key
    const querySnapshot = await apiKeysRef
      .where('hash', '==', hashedKey)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or inactive API key' });
    }

    const keyDoc = querySnapshot.docs[0].data();

    // Check expiration if applicable
    if (keyDoc.expiresAt && new Date(keyDoc.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Unauthorized: API key expired' });
    }

    const apiKeyData = {
      id: querySnapshot.docs[0].id,
      organizationId: keyDoc.organizationId,
      userId: keyDoc.userId,
      permissions: keyDoc.permissions || [],
    };

    req.apiKeyData = apiKeyData;

    // 4. Update Cache for 5 minutes (rolling key support - allows short cache TTL)
    if (redisClient.isReady()) {
      await redisClient.set(cacheKey, JSON.stringify(apiKeyData), 300); // 5 min TTL
    }

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Internal Server Error validating API key' });
  }
};
