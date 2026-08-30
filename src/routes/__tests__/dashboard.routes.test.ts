import request from 'supertest';
import { createTestApp } from './setup';
import dashboardRoutes from '../dashboard.routes';

jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { uid: 'test-user', email: 'test@3wm.audio' };
    next();
  }),
}));

jest.mock('../../middleware/rateLimit', () => ({
  lenientRateLimit: jest.fn((req, res, next) => next()),
  moderateRateLimit: jest.fn((req, res, next) => next()),
  strictRateLimit: jest.fn((req, res, next) => next()),
}));

jest.mock('../../config/firebase', () => {
  const mockGet = jest.fn();
  return {
    db: {
      collection: jest.fn(() => ({
        get: mockGet,
      })),
    },
  };
});

import { db } from '../../config/firebase';

const app = createTestApp(dashboardRoutes, '/api/dashboard');

describe('Dashboard Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return calculated metrics based on tracks in the database', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockGet = mockCollection().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        docs: [
          { data: () => ({ status: 'mastered', history: [{ agent: 'Emar' }] }) },
          {
            data: () => ({
              status: 'in-progress',
              history: [{ agent: 'Ricky' }, { action: 'upload' }],
            }),
          },
        ],
      });

      const res = await request(app).get('/api/dashboard/metrics');

      expect(res.status).toBe(200);
      expect(res.body.activeProjects).toBe(2);
      expect(res.body.masteredTracks).toBe(1);
      expect(res.body.aiAnalyses).toBe(2);
      expect(res.body.storageUsed).toBeDefined();
      expect(res.body.storageQuota).toBe('50 GB');
    });

    it('should handle errors gracefully', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockGet = mockCollection().get as jest.Mock;

      mockGet.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/dashboard/metrics');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch metrics');
    });
  });

  describe('GET /api/dashboard/activity', () => {
    it('should return formatted activity feed', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockGet = mockCollection().get as jest.Mock;

      const recentTime = new Date().toISOString();
      mockGet.mockResolvedValueOnce({
        docs: [
          {
            id: 'track-1',
            data: () => ({
              title: 'My Track',
              history: [
                {
                  id: 'h1',
                  agent: 'Kappachino Emar',
                  action: 'analysis',
                  details: 'Frequency analysis complete',
                  timestamp: recentTime,
                },
              ],
            }),
          },
        ],
      });

      const res = await request(app).get('/api/dashboard/activity');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].agent).toBe('Emar');
      expect(res.body[0].message).toBe('Frequency analysis complete');
      expect(res.body[0].trackTitle).toBe('My Track');
      expect(res.body[0].timestamp).toBe('Just now');
    });
  });
});
