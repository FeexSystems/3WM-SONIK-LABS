import request from 'supertest';
import express from 'express';
import memoryRoutes from '../memory.routes';
import { vectorMemoryItems } from '../../utils/mockData';
import { requireAuth } from '../../middleware/auth';
import { lenientRateLimit } from '../../middleware/rateLimit';

jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
}));

jest.mock('../../middleware/rateLimit', () => ({
  lenientRateLimit: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/vector-memory', memoryRoutes);

describe('Memory Routes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/vector-memory should return 200 and vector memory items', async () => {
    const response = await request(app).get('/api/vector-memory');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(vectorMemoryItems);
    expect(requireAuth).toHaveBeenCalled();
    expect(lenientRateLimit).toHaveBeenCalled();
  });
});
