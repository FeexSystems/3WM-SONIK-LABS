import request from 'supertest';
import { createTestApp } from './setup';
import projectsRoutes from '../projects.routes';

// Mock auth and rate limit
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

jest.mock('../../middleware/csrf', () => ({
  csrfValidate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock syncToDB
jest.mock(
  '../../utils/audioHelpers',
  () => ({
    syncToDB: jest.fn(),
  }),
  { virtual: true }
);

// Mock Firebase DB
jest.mock('../../config/firebase', () => {
  const mockGet = jest.fn();
  const mockDoc = jest.fn(() => ({ get: mockGet }));
  const mockWhere = jest.fn();

  // Chain for where().where().get()
  mockWhere.mockImplementation(() => ({
    where: jest.fn(() => ({
      get: mockGet,
    })),
  }));

  return {
    db: {
      collection: jest.fn(() => ({
        doc: mockDoc,
        where: mockWhere,
      })),
    },
  };
});

import { db } from '../../config/firebase';
import { syncToDB } from '../../utils/audioHelpers';

const app = createTestApp(projectsRoutes, '/api/projects');

describe('Projects Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/projects/:id/archive', () => {
    it('should return 404 if project not found', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({ exists: false });

      const res = await request(app).patch('/api/projects/123/archive').send({ archived: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });

    it('should archive project and sync to DB', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: '123', status: 'PRODUCTION', archived: false }),
      });

      const res = await request(app).patch('/api/projects/123/archive').send({ archived: true });

      expect(res.status).toBe(200);
      expect(res.body.archived).toBe(true);
      expect(res.body.status).toBe('ARCHIVED');
      expect(syncToDB).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/projects/:id/tracks/:trackId/archive', () => {
    it('should archive specific track within a project', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          id: '123',
          stems: [
            { id: 'track-1', archived: false },
            { id: 'track-2', archived: false },
          ],
        }),
      });

      const res = await request(app)
        .patch('/api/projects/123/tracks/track-1/archive')
        .send({ archived: true });

      expect(res.status).toBe(200);
      expect(res.body.stems[0].archived).toBe(true);
      expect(res.body.stems[1].archived).toBe(false);
      expect(syncToDB).toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:id/elevenlabs/jobs', () => {
    it('should fetch jobs for user project', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockWhere = mockCollection().where as jest.Mock;
      const mockWhereChain = mockWhere().where as jest.Mock;
      const mockGet = mockWhereChain().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: 'job-1', created_at: '2026-08-23T10:00:00Z' }) },
          { data: () => ({ id: 'job-2', created_at: '2026-08-23T11:00:00Z' }) },
        ],
      });

      const res = await request(app).get('/api/projects/123/elevenlabs/jobs');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe('job-2'); // Sorted descending
    });
  });

  describe('POST /api/projects/:id/elevenlabs/music', () => {
    it('should return 501 Not Implemented (mocked)', async () => {
      const res = await request(app).post('/api/projects/123/elevenlabs/music');
      expect(res.status).toBe(501);
    });
  });
});
