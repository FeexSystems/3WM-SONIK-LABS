import request from 'supertest';
import { createTestApp } from './setup';
import tracksRoutes from '../tracks.routes';

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
  trackCreateRateLimit: jest.fn((req, res, next) => next()),
  trackUpdateRateLimit: jest.fn((req, res, next) => next()),
  trackGenerateStemRateLimit: jest.fn((req, res, next) => next()),
  agentCommandRateLimit: jest.fn((req, res, next) => next()),
}));

jest.mock('../../middleware/csrf', () => ({
  csrfValidate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock audio helpers
jest.mock('../../utils/audioHelpers', () => ({
  syncToDB: jest.fn(),
  generateAIAudioBuffer: jest.fn(() => Buffer.from('mock-audio-buffer')),
  generateAgentResponse: jest.fn(() =>
    Promise.resolve({
      text: 'Mock agent response',
      settingsPatch: { eq: { low: 2.0 } },
    })
  ),
}));

// Mock validateRequest
jest.mock('../../middleware/validateRequest', () => ({
  validateRequest: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock Firebase DB
jest.mock('../../config/firebase', () => {
  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockDoc = jest.fn(() => ({ get: mockGet, set: mockSet }));
  const mockWhere = jest.fn(() => ({ get: mockGet }));

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

const app = createTestApp(tracksRoutes, '/api/tracks');

describe('Tracks Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tracks', () => {
    it('should return list of tracks for the user', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockWhere = mockCollection().where as jest.Mock;
      const mockGet = mockWhere().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: 'track-1', title: 'Test Track 1' }) },
          { data: () => ({ id: 'track-2', title: 'Test Track 2' }) },
        ],
      });

      const res = await request(app).get('/api/tracks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe('track-1');
    });
  });

  describe('GET /api/tracks/:id', () => {
    it('should return a specific track', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'track-1', title: 'Test Track 1' }),
      });

      const res = await request(app).get('/api/tracks/track-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('track-1');
    });

    it('should return 404 if track not found', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({ exists: false });

      const res = await request(app).get('/api/tracks/invalid-id');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tracks/:id/generate-stem', () => {
    it('should return 404 if track not found', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({ exists: false });

      const res = await request(app)
        .post('/api/tracks/invalid-id/generate-stem')
        .send({ prompt: 'Add a piano', type: 'instrumental' });

      expect(res.status).toBe(404);
    });

    it('should generate stem and return audio URL', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'track-1', history: [] }),
      });

      const res = await request(app)
        .post('/api/tracks/track-1/generate-stem')
        .send({ prompt: 'Add a piano', type: 'instrumental' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stem generated successfully.');
      expect(res.body.audioUrl).toContain('data:audio/wav;base64,');
      expect(res.body.track.history).toHaveLength(1);
    });
  });

  describe('PATCH /api/tracks/:id/settings', () => {
    it('should update track settings', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          id: 'track-1',
          settings: { eq: { low: 0, mid: 0, high: 0 }, compression: {} },
        }),
      });

      const res = await request(app)
        .patch('/api/tracks/track-1/settings')
        .send({ settings: { eq: { low: 2.5 } } });

      expect(res.status).toBe(200);
      expect(res.body.settings.eq.low).toBe(2.5);
    });
  });

  describe('POST /api/tracks/:id/ai-command', () => {
    it('should execute AI command and return response', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          id: 'track-1',
          settings: { eq: { low: 0, mid: 0, high: 0 }, compression: {} },
          history: [],
        }),
      });

      const res = await request(app)
        .post('/api/tracks/track-1/ai-command')
        .send({ agent: 'emar', command: 'Boost the bass' });

      expect(res.status).toBe(200);
      expect(res.body.responseText).toBe('Mock agent response');
      expect(res.body.track.settings.eq.low).toBe(2.0); // from mock settingsPatch
      expect(res.body.track.history[0].agent).toBe('Kappachino Emar');
    });
  });

  describe('POST /api/tracks/:id/master', () => {
    it('should apply mastering preset', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockDoc = mockCollection().doc as jest.Mock;
      const mockGet = mockDoc().get as jest.Mock;

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          id: 'track-1',
          settings: { eq: { low: 0, mid: 0, high: 0 }, mastering: {} },
          analysis: { dynamics: {} },
          history: [],
        }),
      });

      const res = await request(app)
        .post('/api/tracks/track-1/master')
        .send({ preset: 'Afrofusion Warmth' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('mastered');
      expect(res.body.settings.mastering.preset).toBe('Afrofusion Warmth');
      expect(res.body.settings.mastering.warmthSaturation).toBe(85);
      expect(res.body.history[0].agent).toBe('Ozone 11');
    });
  });
});
