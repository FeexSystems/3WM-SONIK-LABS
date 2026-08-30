import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { envConfig } from '../config/environment';
import { moderateRateLimit, lenientRateLimit } from '../middleware/rateLimit';
import { csrfValidate } from '../middleware/csrf';
import fetch from 'node-fetch';
import { logger } from '../lib/logger';

const router = Router();

router.post(
  '/synthesize',
  requireAuth,
  moderateRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const { text, voiceId, model = 'eleven_multilingual_v2', outputFormat = 'mp3' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for synthesis' });
    }

    const config = envConfig.getConfig();
    if (!config.elevenlabsApiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || config.elevenlabsDefaultVoice || '21m00Tcm4TlvDq8ikWAM'}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenlabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:audio/${outputFormat};base64,${base64Audio}`;

      res.json({
        success: true,
        audioUrl: dataUrl,
        format: outputFormat,
        duration: arrayBuffer.byteLength,
      });
    } catch (err: any) {
      logger.error(`[ElevenLabs] Synthesis error: ${err.message}`);
      res.status(500).json({ error: 'Failed to synthesize vocal', details: err.message });
    }
  }
);

router.post(
  '/clone-voice',
  requireAuth,
  moderateRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const { name, description, samples } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Voice name is required' });
    }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ error: 'At least one audio sample is required' });
    }

    const config = envConfig.getConfig();
    if (!config.elevenlabsApiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description || `Custom voice: ${name}`);

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const buffer = Buffer.from(sample.data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        formData.append('files', blob, `sample_${i}.mp3`);
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabsApiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as { voice_id?: string; voice?: { voice_id?: string } };
      const voiceId = data.voice_id ?? data.voice?.voice_id;

      if (!voiceId) {
        throw new Error('No voice ID returned from cloning operation');
      }

      res.json({
        success: true,
        voiceId,
        name,
        message: 'Voice cloned successfully',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`[ElevenLabs] Voice cloning error: ${message}`);
      res.status(500).json({ error: 'Failed to clone voice', details: message });
    }
  }
);

router.get('/voices', requireAuth, lenientRateLimit, async (_req: Request, res: Response) => {
  const config = envConfig.getConfig();
  if (!config.elevenlabsApiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': config.elevenlabsApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { voices?: unknown[] };
    res.json({
      success: true,
      voices: data.voices ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`[ElevenLabs] Fetch voices error: ${message}`);
    res.status(500).json({ error: 'Failed to fetch voices', details: message });
  }
});

export default router;
