import request from 'supertest';
import express from 'express';
import voiceRoutes from '../voice.routes';

const app = express();
app.use(express.json());
app.use('/api/voice', voiceRoutes);

describe('Voice Routes & Triad Intelligence API', () => {
  it('POST /api/voice/chat returns intelligent persona response for Emar', async () => {
    const res = await request(app)
      .post('/api/voice/chat')
      .send({ agent: 'emar', text: 'Analyze this frequency spectrum around 240Hz' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body.agent).toBe('emar');
  });

  it('POST /api/voice/chat returns intelligent persona response for Ricky', async () => {
    const res = await request(app)
      .post('/api/voice/chat')
      .send({ agent: 'ricky', text: 'Give me an Amapiano log drum groove' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body.agent).toBe('ricky');
  });

  it('POST /api/voice/chat returns intelligent persona response for Kingpin', async () => {
    const res = await request(app)
      .post('/api/voice/chat')
      .send({ agent: 'kingpin', text: 'How should I arrange a 3-part vocal harmony?' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body.agent).toBe('kingpin');
  });

  it('POST /api/voice/chat rejects request with missing text', async () => {
    const res = await request(app).post('/api/voice/chat').send({ agent: 'emar' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/voice/tts handles single-speaker synthesis request', async () => {
    const res = await request(app).post('/api/voice/tts').send({
      prompt: 'Frequency calibrated at 112 BPM',
      agentId: 'emar',
    });

    expect(res.status).toBe(200);
  });
});
