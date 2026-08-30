import request from 'supertest';
import express from 'express';
import healthRoutes from '../health.routes';

const app = express();
app.use('/api/v1/health', healthRoutes);

describe('Health Routes', () => {
  it('should return 200 and system health status on GET /api/v1/health', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('platform', '3WM - Sonic AI Platform');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('activeTracks');
    expect(response.body).toHaveProperty('time');
  });
});
