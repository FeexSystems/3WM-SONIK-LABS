// 3WM SONIK - Production-Ready Data Store Service
// Enforces Redis-backed persistence

import { redisClient } from '../lib/redis';
import { Track, RenderJob } from '../types';

class DataStoreService {
  constructor() {
    if (!redisClient.isReady()) {
      console.warn('[DataStore] Redis is not ready. Operations will fail until it connects.');
    }
  }

  // ==========================================
  // Track Store Operations
  // ==========================================

  public async getTrack(trackId: string): Promise<Track | null> {
    try {
      const data = await redisClient.get(`track:${trackId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[DataStore] Get track error:', error);
      return null;
    }
  }

  public async setTrack(trackId: string, track: Track, ttl: number = 3600): Promise<boolean> {
    try {
      return await redisClient.set(`track:${trackId}`, JSON.stringify(track), ttl);
    } catch (error) {
      console.error('[DataStore] Set track error:', error);
      return false;
    }
  }

  public async deleteTrack(trackId: string): Promise<boolean> {
    try {
      return await redisClient.del(`track:${trackId}`);
    } catch (error) {
      console.error('[DataStore] Delete track error:', error);
      return false;
    }
  }

  // ==========================================
  // Render Job Store Operations
  // ==========================================

  public async getRenderJob(jobId: string): Promise<RenderJob | null> {
    try {
      const data = await redisClient.get(`renderjob:${jobId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[DataStore] Get render job error:', error);
      return null;
    }
  }

  public async setRenderJob(jobId: string, job: RenderJob, ttl: number = 7200): Promise<boolean> {
    try {
      return await redisClient.set(`renderjob:${jobId}`, JSON.stringify(job), ttl);
    } catch (error) {
      console.error('[DataStore] Set render job error:', error);
      return false;
    }
  }

  public async deleteRenderJob(jobId: string): Promise<boolean> {
    try {
      return await redisClient.del(`renderjob:${jobId}`);
    } catch (error) {
      console.error('[DataStore] Delete render job error:', error);
      return false;
    }
  }

  public async getAllRenderJobs(): Promise<RenderJob[]> {
    try {
      const keys = await redisClient.keys('renderjob:*');
      if (!keys || keys.length === 0) {
        return [];
      }

      const jobs: RenderJob[] = [];
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          jobs.push(JSON.parse(data));
        }
      }
      return jobs;
    } catch (error) {
      console.error('[DataStore] Get all render jobs error:', error);
      return [];
    }
  }

  // ==========================================
  // General Key-Value Operations
  // ==========================================

  public async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('[DataStore] Get error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      return await redisClient.set(key, value, ttl);
    } catch (error) {
      console.error('[DataStore] Set error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      return await redisClient.del(key);
    } catch (error) {
      console.error('[DataStore] Delete error:', error);
      return false;
    }
  }

  // ==========================================
  // Health Check
  // ==========================================

  public async healthCheck(): Promise<{ healthy: boolean; fallback: boolean; latency?: number }> {
    try {
      const start = Date.now();
      await redisClient.set('health_check', 'ok', 10);
      await redisClient.get('health_check');
      const latency = Date.now() - start;
      await redisClient.del('health_check');

      return { healthy: true, fallback: false, latency };
    } catch (error) {
      console.error('[DataStore] Health check error:', error);
      return { healthy: false, fallback: false }; // fallback removed
    }
  }

  // ==========================================
  // Cache Invalidation
  // ==========================================

  public async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (!keys || keys.length === 0) {
        return 0;
      }

      let deleted = 0;
      for (const key of keys) {
        if (await redisClient.del(key)) {
          deleted++;
        }
      }
      return deleted;
    } catch (error) {
      console.error('[DataStore] Invalidate pattern error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const dataStore = new DataStoreService();
