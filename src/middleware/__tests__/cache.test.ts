import { vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { cacheGetRequests, invalidateCache } from '../cache';
import { redisClient } from '../../lib/redis';

// Mock Redis Client
vi.mock('../../lib/redis', () => ({
  redisClient: {
    isReady: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    getClient: vi.fn(),
  },
}));

describe('Cache Middleware', () => {
  let req: Partial<Request & { user?: { uid: string } }>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      user: { uid: 'user123' },
    };
    res = {
      setHeader: vi.fn(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should skip caching if not a GET request', async () => {
    req.method = 'POST';
    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(redisClient.isReady).not.toHaveBeenCalled();
  });

  it('should skip caching if Redis is not ready', async () => {
    (redisClient.isReady as any).mockReturnValue(false);
    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it('should return cached response if hit', async () => {
    (redisClient.isReady as any).mockReturnValue(true);
    (redisClient.get as any).mockResolvedValue(JSON.stringify({ data: 'cached' }));

    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(redisClient.get).toHaveBeenCalledWith('cache:user123:/api/test');
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(res.json).toHaveBeenCalledWith({ data: 'cached' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should cache response if miss', async () => {
    (redisClient.isReady as any).mockReturnValue(true);
    (redisClient.get as any).mockResolvedValue(null);
    (redisClient.set as any).mockResolvedValue(true);

    const middleware = cacheGetRequests(60);
    await middleware(req as Request, res as Response, next);

    expect(redisClient.get).toHaveBeenCalledWith('cache:user123:/api/test');
    expect(next).toHaveBeenCalled();

    // Simulate express response routing to correctly trigger the monkey-patched res.json
    res.statusCode = 200;
    (res.json as any)({ new: 'data' });

    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    expect(redisClient.set).toHaveBeenCalledWith(
      'cache:user123:/api/test',
      JSON.stringify({ new: 'data' }),
      60
    );
  });
});
