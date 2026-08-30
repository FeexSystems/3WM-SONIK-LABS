import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import n8nRoutes from '../n8n.routes';
import { initialWorkflows } from '../../utils/mockData';
import { requireAuth } from '../../middleware/auth';
import { lenientRateLimit, moderateRateLimit } from '../../middleware/rateLimit';
import { csrfValidate } from '../../middleware/csrf';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/rateLimit', () => ({
  lenientRateLimit: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
  moderateRateLimit: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/csrf', () => ({
  csrfValidate: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/n8n/workflows', n8nRoutes);
app.use(errorHandler);

describe('n8n Routes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/n8n/workflows should return 200 and workflows list', async () => {
    const response = await request(app).get('/api/n8n/workflows');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(initialWorkflows);
    expect(requireAuth).toHaveBeenCalled();
    expect(lenientRateLimit).toHaveBeenCalled();
  });

  it('POST /api/n8n/workflows/:id/trigger should execute workflow', async () => {
    const validId = initialWorkflows[0].id;
    const response = await request(app).post(`/api/n8n/workflows/${validId}/trigger`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.workflow.id).toBe(validId);
    expect(response.body.workflow.status).toBe('success');
    expect(requireAuth).toHaveBeenCalled();
    expect(moderateRateLimit).toHaveBeenCalled();
  });

  it('POST /api/n8n/workflows/:id/trigger should return 404 for invalid ID', async () => {
    const response = await request(app).post('/api/n8n/workflows/invalid-id/trigger');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Workflow not found');
  });
});
