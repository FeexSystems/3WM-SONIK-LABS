import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { lenientRateLimit } from '../middleware/rateLimit';
import { vectorMemoryItems } from '../utils/mockData';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/vector-memory:
 *   get:
 *     tags: [Memory]
 *     summary: Get vector memory items
 *     description: Retrieves all items from the vector memory knowledge base
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vector memory items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireAuth,
  lenientRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    res.json(vectorMemoryItems);
  })
);

export default router;
