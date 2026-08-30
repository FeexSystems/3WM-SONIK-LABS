import request from 'supertest';
import { createTestApp } from './setup';
import vocalRoutes from '../vocal.routes';

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
}));

jest.mock('../../middleware/csrf', () => ({
  csrfValidate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../config/environment', () => ({
  envConfig: {
    getConfig: jest.fn(() => ({
      elevenlabsApiKey: 'mock-api-key',
      elevenlabsDefaultVoice: 'default-voice',
    })),
  },
}));

// Mock fetch for ElevenLabs
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';

const app = createTestApp(vocalRoutes, '/api/vocal');

describe('Vocal Routes (ElevenLabs Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/vocal/synthesize', () => {
    it('should return 400 if text is missing', async () => {
      const res = await request(app).post('/api/vocal/synthesize').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Text is required for synthesis');
    });

    it('should call ElevenLabs API and return an audio url', async () => {
      const mockFetch = fetch as unknown as jest.Mock;
      const mockArrayBuffer = new ArrayBuffer(8);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      });

      const res = await request(app)
        .post('/api/vocal/synthesize')
        .send({ text: 'Hello world', voiceId: 'abc1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.audioUrl).toContain('data:audio/mp3;base64,');
      expect(res.body.format).toBe('mp3');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v1/text-to-speech/abc1234',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle ElevenLabs API errors gracefully', async () => {
      const mockFetch = fetch as unknown as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Voice not found'),
      });

      const res = await request(app)
        .post('/api/vocal/synthesize')
        .send({ text: 'Hello world', voiceId: 'invalid' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to synthesize vocal');
      expect(res.body.details).toContain('Voice not found');
    });
  });

  describe('GET /api/vocal/voices', () => {
    it('should fetch and return voices from ElevenLabs', async () => {
      const mockFetch = fetch as unknown as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voices: [{ voice_id: '1', name: 'Rachel' }] }),
      });

      const res = await request(app).get('/api/vocal/voices');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.voices).toHaveLength(1);
      expect(res.body.voices[0].name).toBe('Rachel');
    });
  });
});
