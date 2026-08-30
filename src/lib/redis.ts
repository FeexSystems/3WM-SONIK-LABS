// 3WM SONIK - Redis Client Configuration
// Centralized Redis client for caching, rate limiting, and session management

import Redis from 'ioredis';
import { envConfig } from '../config/environment';

class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const config = envConfig.getConfig();

      if (!config.redisUrl) {
        console.warn('Redis URL not configured - using in-memory fallbacks');
        return;
      }

      this.client = new Redis(config.redisUrl, {
        password: config.redisPassword,
        db: config.redisDb || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        console.error('[Redis] Connection error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.warn('[Redis] Connection closed');
      });
    } catch (error) {
      console.error('[Redis] Initialization error:', error);
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('[Redis] GET error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('[Redis] SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('[Redis] DEL error:', error);
      return false;
    }
  }

  public async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('[Redis] INCR error:', error);
      return 0;
    }
  }

  public async decr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }
    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error('[Redis] DECR error:', error);
      return 0;
    }
  }

  public async pttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1;
    }
    try {
      return await this.client.pttl(key);
    } catch (error) {
      console.error('[Redis] PTTL error:', error);
      return -1;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('[Redis] EXPIRE error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[Redis] EXISTS error:', error);
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('[Redis] KEYS error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();
