import { Redis } from 'ioredis';
import { envConfig } from './environment';

// Create a single Redis connection instance
const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      // Reconnect after
      return Math.min(times * 50, 2000);
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });
} else {
  if (process.env.NODE_ENV === 'production') {
    console.warn('REDIS_URL is not defined. Redis features will be disabled in production!');
  } else {
    console.log('REDIS_URL not defined. Using memory fallback for development.');
  }
}

export { redisClient };
