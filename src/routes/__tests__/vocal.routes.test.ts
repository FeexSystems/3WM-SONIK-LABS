import { vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup';
import vocalRoutes from '../vocal.routes';

// Mock auth and rate limit
vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = { uid: 'test-user', email: 'test@3wm.audio' };
    next();
  }),
}));

vi.mock('../../middleware/rateLimit', () => ({
  lenientRateLimit: vi.fn((req, res, next) => next()),
  moderateRateLimit: vi.fn((req, res, next) => next()),
  strictRateLimit: vi.fn((req, res, next) => next()),
}));

vi.mock('../../middleware/csrf', () => ({
  csrfValidate: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock('../../config/environment', () => ({
  envConfig: {
    getConfig: vi.fn(() => ({
      elevenlabsApiKey: 'mock-api-key',
      elevenlabsDefaultVoice: 'default-voice',
    })),
  },
}));

// Mock node-fetch properly for Vitest
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));
import fetch from 'node-fetch';
const mockFetch = fetch as any;

const app = createTestApp(vocalRoutes, '/api/vocal');

describe('Vocal Routes (ElevenLabs Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/vocal/synthesize', () => {
    it('should return 400 if text is missing', async () => {
      const res = await request(app).post('/api/vocal/synthesize').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Text is required for synthesis');
    });

    it('should call ElevenLabs API and return an audio url', async () => {
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
