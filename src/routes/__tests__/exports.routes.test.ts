import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import exportsRoutes from '../exports.routes';
import { requireAuth } from '../../middleware/auth';
import { trackExportRateLimit } from '../../middleware/rateLimit';
import { validateExportTrack } from '../../middleware/validation';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/rateLimit', () => ({
  lenientRateLimit: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
  trackExportRateLimit: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/csrf', () => ({
  csrfValidate: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/validation', () => ({
  validateExportTrack: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));

const mockGet = jest.fn();
jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockGet,
      })),
    })),
  },
}));

const app = express();
app.use(express.json());
app.use(exportsRoutes);
app.use(errorHandler);

describe('Exports Routes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/projects/:id/export-quota should return 404 if project not found', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const response = await request(app).get('/api/projects/123/export-quota');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Project not found');
  });

  it('GET /api/projects/:id/export-quota should return quota estimate for existing project', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ id: '123', title: 'Test Track' }),
    });

    const response = await request(app).get(
      '/api/projects/123/export-quota?sampleRate=48000&bitDepth=24'
    );

    expect(response.status).toBe(200);
    expect(response.body.estimatedUnits).toBe(2.4);
    expect(response.body.planLimit).toBe(25);
    expect(response.body.sampleRate).toBe(48000);
    expect(response.body.bitDepth).toBe(24);
    expect(requireAuth).toHaveBeenCalled();
  });

  it('POST /api/projects/:id/exports should create new export job', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ id: '123', title: 'Test Track', settings: {} }),
    });

    const response = await request(app)
      .post('/api/projects/123/exports')
      .send({ format: 'wav', bitDepth: 24 });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('processing');
    expect(response.body.format).toBe('wav');
    expect(response.body.bitDepth).toBe(24);
    expect(response.body.projectId).toBe('123');
    expect(requireAuth).toHaveBeenCalled();
    expect(trackExportRateLimit).toHaveBeenCalled();
    expect(validateExportTrack).toHaveBeenCalled();
  });
});
