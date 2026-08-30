import request from 'supertest';
import { createTestApp } from './setup';
import publicRoutes from '../public.routes';

// Mock the Firebase DB
jest.mock('../../config/firebase', () => {
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockLimit = jest.fn(() => ({ get: mockGet }));
  const mockWhere = jest.fn(() => ({ limit: mockLimit }));

  return {
    db: {
      collection: jest.fn(() => ({
        where: mockWhere,
        add: mockAdd,
      })),
    },
  };
});

import { db } from '../../config/firebase';

const app = createTestApp(publicRoutes, '/api');

describe('Public Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/demo/chat', () => {
    it('should return 400 if agent or text is missing', async () => {
      const res = await request(app).post('/api/demo/chat').send({ agent: 'emar' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Agent and text are required');
    });

    it('should return a simulated response for a valid agent', async () => {
      const res = await request(app).post('/api/demo/chat').send({ agent: 'emar', text: 'hello' });

      expect(res.status).toBe(200);
      expect(res.body.text).toContain('analyzed the frequency spectrum');
      expect(res.body.stateUpdates).toBeDefined();
    });
  });

  describe('POST /api/waitlist', () => {
    it('should return 400 for invalid email', async () => {
      const res = await request(app).post('/api/waitlist').send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valid email address is required');
    });

    it('should return success message if email is already on waitlist', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockWhere = mockCollection().where as jest.Mock;
      const mockLimit = mockWhere().limit as jest.Mock;
      const mockGet = mockLimit().get as jest.Mock;

      mockGet.mockResolvedValueOnce({ empty: false });

      const res = await request(app).post('/api/waitlist').send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Already on waitlist');
    });

    it('should add email and return success if not on waitlist', async () => {
      const mockCollection = db.collection as jest.Mock;
      const mockWhere = mockCollection().where as jest.Mock;
      const mockLimit = mockWhere().limit as jest.Mock;
      const mockGet = mockLimit().get as jest.Mock;
      const mockAdd = mockCollection().add as jest.Mock;

      mockGet.mockResolvedValueOnce({ empty: true });
      mockAdd.mockResolvedValueOnce({ id: '123' });

      const res = await request(app).post('/api/waitlist').send({ email: 'new@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully joined waitlist');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          source: 'landing_page',
        })
      );
    });
  });
});
