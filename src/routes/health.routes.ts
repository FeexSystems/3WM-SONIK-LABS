import { Router, Request, Response } from 'express';
import { lenientRateLimit } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: System Health Check
 *     description: Returns the health status of the 3WM Sonic AI Platform
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               platform: 3WM - Sonic AI Platform
 *               version: 1.0.0
 *               activeTracks: 0
 *               time: 2026-08-22T12:00:00.000Z
 */
router.get('/', lenientRateLimit, (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: '3WM - Sonic AI Platform',
    version: '1.0.0',
    activeTracks: 0,
    time: new Date().toISOString(),
  });
});

export default router;
