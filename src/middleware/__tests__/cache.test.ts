import { Request, Response, NextFunction } from 'express';
import { cacheGetRequests, invalidateCache } from '../cache';
import { redisClient } from '../../lib/redis';

// Mock Redis Client
jest.mock('../../lib/redis', () => ({
  redisClient: {
    isReady: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    getClient: jest.fn(),
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
      setHeader: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should skip caching if not a GET request', async () => {
    req.method = 'POST';
    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(redisClient.isReady).not.toHaveBeenCalled();
  });

  it('should skip caching if Redis is not ready', async () => {
    (redisClient.isReady as jest.Mock).mockReturnValue(false);
    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it('should return cached response if hit', async () => {
    (redisClient.isReady as jest.Mock).mockReturnValue(true);
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({ data: 'cached' }));

    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(res.json).toHaveBeenCalledWith({ data: 'cached' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should cache response if miss', async () => {
    (redisClient.isReady as jest.Mock).mockReturnValue(true);
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (redisClient.set as jest.Mock).mockResolvedValue(true);

    const middleware = cacheGetRequests(60);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();

    // Simulate what the router does by calling the monkey-patched res.json
    res.statusCode = 200;
    (res as any).json({ data: 'new' });

    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    expect(redisClient.set).toHaveBeenCalledWith(
      'cache:user123:/api/test',
      JSON.stringify({ data: 'new' }),
      60
    );
  });
});
