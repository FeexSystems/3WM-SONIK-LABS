import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { strictRateLimit } from '../middleware/rateLimit';
import { csrfValidate } from '../middleware/csrf';
import { logger } from '../lib/logger';
import { envConfig } from '../config/environment';

const router = Router();

/**
 * Validates external service API keys.
 * Used for rotating or checking the status of API keys like ElevenLabs or OpenAI.
 */
router.post(
  '/keys/verify',
  requireAuth,
  strictRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const { service, apiKey } = req.body;

    if (!service || !apiKey) {
      return res.status(400).json({ error: 'Service and apiKey are required' });
    }

    try {
      if (service === 'elevenlabs') {
        // Very basic check - we try to hit the user info endpoint
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: {
            'xi-api-key': apiKey,
          },
        });

        if (response.ok) {
          return res.json({ success: true, message: 'ElevenLabs API key is valid' });
        } else {
          return res.status(400).json({ error: 'Invalid ElevenLabs API key' });
        }
      } else if (service === 'openai') {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          return res.json({ success: true, message: 'OpenAI API key is valid' });
        } else {
          return res.status(400).json({ error: 'Invalid OpenAI API key' });
        }
      } else {
        return res.status(400).json({ error: 'Unsupported service' });
      }
    } catch (error: any) {
      logger.error(`[Settings] Key verification error for ${service}: ${error.message}`);
      return res.status(500).json({ error: 'Internal error verifying API key' });
    }
  }
);

export default router;
