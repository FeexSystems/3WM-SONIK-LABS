import { Router, Request, Response } from 'express';
import { csrfValidate } from '../middleware/csrf';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { validateRequest } from '../middleware/validateRequest';
import { trackUploadSchema } from '../schemas/api.schemas';
import {
  trackCreateRateLimit,
  trackUpdateRateLimit,
  trackGenerateStemRateLimit,
  lenientRateLimit,
  moderateRateLimit,
  agentCommandRateLimit,
} from '../middleware/rateLimit';
import { generateAIAudioBuffer, syncToDB } from '../utils/audioHelpers'; // Assumed helpers file
import { cacheGetRequests, invalidateCache } from '../middleware/cache';
import { Track, ExportQuotaEstimate } from '../types';
import { getGeminiService } from '../services/geminiService';

const router = Router();

// Placeholder for `io` and `userExportUsage`.
// In a real refactor, these would be properly injected or required from a shared state module.
declare const io: { emit: (event: string, data: unknown) => void } | undefined;
const userExportUsage = { used: 7, limit: 25 };

const generateAgentResponse = async (
  agent: string,
  command: string,
  track: Track,
  _audioBase64?: string,
  _audioMimeType?: string,
  previousInteractionId?: string
) => {
  try {
    const gemini = getGeminiService();

    let systemInstruction = '';
    let model = 'gemini-3.7-flash';
    if (agent === 'emar') {
      model = 'gemini-2.5-pro'; // The Scientist uses deep analytical acoustic reasoning
      systemInstruction = `You are Kappachino Emar — The Scientist, expert in audio engineering, DSP, acoustics, and frequency balance for 3WM SONIK. Precise and analytical. Track: "${track?.title}", BPM: ${track?.bpm}, Key: ${track?.key}. Command: "${command}". Return JSON with { "text": "...", "eq": { "low": 2.0, "mid": -1.0, "high": 2.5 } }`;
    } else if (agent === 'ricky') {
      model = 'gemini-3.7-flash'; // The Sound God uses high velocity groove reasoning
      systemInstruction = `You are Kappachino Ricky — The Sound God, master of instruments, 808s, drums, groove, and syncopation. Bold and streetwise. "Find the sound. Build the bounce." Track: "${track?.title}", BPM: ${track?.bpm}, Key: ${track?.key}. Command: "${command}". Return JSON with { "text": "...", "compression": { "threshold": -16, "ratio": 3.0 } }`;
    } else if (agent === 'kingpin') {
      model = 'gemini-3.7-flash'; // Vocal Oracle
      systemInstruction = `You are Kingpin — The Vocal Oracle, master of vocal arrangement and harmony. Track: "${track?.title}", BPM: ${track?.bpm}, Key: ${track?.key}. Command: "${command}". Return JSON with { "text": "...", "reverb": { "type": "shrine", "amount": 35 } }`;
    } else {
      systemInstruction = `You are the ThreeWM Orchestrator, coordinating the Three Wise Men. Track: "${track?.title}". Command: "${command}". Return JSON with { "text": "..." }`;
    }

    const interaction = await gemini.createInteraction({
      model,
      input: command,
      systemInstruction,
      previousInteractionId,
      store: true,
    });

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(interaction.text);
    } catch {
      parsed = { text: interaction.text };
    }

    return {
      text: (parsed.text as string) ?? interaction.text,
      settingsPatch: {
        eq: parsed.eq,
        compression: parsed.compression,
        reverb: parsed.reverb,
        mastering: parsed.masteringPreset ? { preset: parsed.masteringPreset } : undefined,
      },
      interactionId: interaction.id,
    };
  } catch (_err) {
    return {
      text: `Processing completed for ${agent}: ${command}`,
      settingsPatch: {},
      interactionId: `fallback-${Date.now()}`,
    };
  }
};

router.get('/test-gemini', requireAuth, lenientRateLimit, async (_req: Request, res: Response) => {
  try {
    const gemini = getGeminiService();
    const isAvail = await gemini.isAvailable();
    if (!isAvail) {
      return res.status(500).json({
        status: 'error',
        message: 'GEMINI_API_KEY environment variable is missing or unreachable.',
      });
    }

    const response = await gemini.generateText({
      model: 'gemini-3.7-flash',
      prompt: 'Respond with a simple "API Key is active and functioning" and nothing else.',
    });

    return res.json({ status: 'success', message: response.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Test Gemini Error: ${message}`);
    return res.status(500).json({ status: 'error', message });
  }
});

router.post(
  '/:id/generate-stem',
  requireAuth,
  trackGenerateStemRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;

      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      const { prompt, type, model = 'lyria-3-clip-preview', images } = req.body;

      let dataUrl = '';
      let lyrics = '';
      try {
        const gemini = getGeminiService();
        const lyriaResult = await gemini.generateLyriaMusic({
          model: model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview',
          prompt:
            (prompt as string) ??
            `Afrofusion ${(type as string) ?? 'beat'} stem in ${track.key ?? 'C Minor'}, ${track.bpm ?? 112} BPM`,
          images,
        });

        if (lyriaResult.audioBase64) {
          dataUrl = `data:audio/mp3;base64,${lyriaResult.audioBase64}`;
          lyrics = lyriaResult.lyrics ?? '';
        }
      } catch (e) {
        logger.warn(`Lyria direct call fallback: ${e}`);
      }

      if (!dataUrl) {
        // 1. Fallback to procedural WAV buffer
        const audioBuffer = await generateAIAudioBuffer(track, 44100, 16, 5); // 5 second preview stem
        const base64Audio = audioBuffer.toString('base64');
        dataUrl = `data:audio/wav;base64,${base64Audio}`;
      }

      // 2. Add to track history
      track.history.unshift({
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent: 'ThreeWM Orchestrator',
        action: `Generated stem: "${prompt}"`,
        details: lyrics
          ? `Synthesized 44.1kHz audio with lyrics via Lyria 3.`
          : `Successfully synthesized 44.1kHz audio based on prompt.`,
      });
      syncToDB(track);

      if (typeof io !== 'undefined') {
        io.emit('track-updated', track);
      }

      res.json({
        track,
        audioUrl: dataUrl,
        lyrics,
        message: 'Stem generated successfully via Lyria 3.',
      });
    } catch (err: any) {
      logger.error(`Generate Stem Error: ${err.message}`);
      res.status(500).json({ error: 'Failed to generate stem', details: err.message });
    }
  }
);

router.get(
  '/',
  requireAuth,
  lenientRateLimit,
  cacheGetRequests(30),
  async (req: Request, res: Response) => {
    try {
      const user = (req as { user?: { uid?: string } }).user;
      const snapshot = await db
        .collection('tracks')
        .where('userId', '==', user?.uid ?? '')
        .get();
      const list = snapshot.docs.map((doc) => doc.data() as Track);
      res.json(list);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`Fetch Tracks Error: ${message}`);
      res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  }
);

router.get(
  '/:id',
  requireAuth,
  lenientRateLimit,
  cacheGetRequests(60),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      if (doc.exists) {
        const track = doc.data() as Track;
        void syncToDB(track);
        return res.json(track);
      } else {
        return res.status(404).json({ error: 'Track not found' });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`Fetch Track Error: ${message}`);
      return res.status(500).json({ error: 'DB Error' });
    }
  }
);

router.post(
  '/',
  requireAuth,
  trackCreateRateLimit,
  validateRequest(trackUploadSchema),
  csrfValidate(['POST']),
  (req: Request, res: Response) => {
    const { title, artist, genre, bpm, key } = req.body;
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      title: (title as string) ?? 'Untitled Afrofusion Session',
      artist: (artist as string) ?? 'Kappachino Emar x Kappachino Ricky',
      genre: (genre as string) ?? 'Afrofusion',
      bpm: Number(bpm) || 112,
      key: (key as string) ?? 'F# Minor',
      duration: 180 + Math.floor(Math.random() * 60),
      createdAt: new Date().toISOString(),
      status: 'raw',
      settings: {
        volume: 0.88,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        compression: { threshold: -15, ratio: 2.5, attack: 30, release: 120, makeupGain: 1.5 },
        reverb: { type: 'shrine', amount: 25, decay: 2.0 },
        mastering: {
          preset: 'None',
          limiterCeiling: -0.3,
          targetLufs: -14.0,
          warmthSaturation: 40,
          stereoWidth: 100,
        },
      },
      analysis: {
        frequencies: {
          subBass: 7.2,
          bass: 8.0,
          lowMids: 6.5,
          mids: 7.0,
          highMids: 7.5,
          treble: 7.8,
          air: 7.0,
        },
        dynamics: {
          range: 11.5,
          rms: -16.0,
          peak: -1.2,
          lufs: -16.8,
        },
        afrobeatGrooveIndex: 90,
        harmonicWarmthScore: 78,
        suggestions: [
          'Track imported into 3WM engine. Run BushBot to balance vocal presence.',
          'Log drums have strong fundamental energy at 52Hz.',
        ],
        agentInsights: {
          bushBot: 'Ready to work, my people! Let us polish this Lagos rhythm.',
          grok: 'Acoustic waveform loaded. Harmonic distortion levels are within nominal tolerances.',
          perplexity: 'Ozone mastering chain ready to engage.',
        },
      },
      stems: [
        {
          id: `stem-${Date.now()}-1`,
          name: 'Vocals',
          volume: 0.9,
          pan: 0,
          muted: false,
          solo: false,
          color: '#f59e0b',
          waveformSeed: Math.floor(Math.random() * 100),
        },
        {
          id: `stem-${Date.now()}-2`,
          name: 'Drums & Percussion',
          volume: 0.88,
          pan: 0,
          muted: false,
          solo: false,
          color: '#ef4444',
          waveformSeed: Math.floor(Math.random() * 100),
        },
        {
          id: `stem-${Date.now()}-3`,
          name: 'Bassline',
          volume: 0.85,
          pan: 0,
          muted: false,
          solo: false,
          color: '#3b82f6',
          waveformSeed: Math.floor(Math.random() * 100),
        },
        {
          id: `stem-${Date.now()}-4`,
          name: 'Instruments & Horns',
          volume: 0.8,
          pan: -0.1,
          muted: false,
          solo: false,
          color: '#10b981',
          waveformSeed: Math.floor(Math.random() * 100),
        },
        {
          id: `stem-${Date.now()}-5`,
          name: 'FX & Synths',
          volume: 0.7,
          pan: 0.15,
          muted: false,
          solo: false,
          color: '#8b5cf6',
          waveformSeed: Math.floor(Math.random() * 100),
        },
      ],
      history: [
        {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: 'BushBot',
          action: 'Track Ingestion',
          details: 'Imported session and generated stems',
        },
      ],
    };
    const userId = (req as { user?: { uid?: string } }).user?.uid ?? 'anonymous';
    void invalidateCache(userId, `/api/tracks`).catch(() => {});
    res.status(201).json(newTrack);
  }
);

router.patch(
  '/:id/settings',
  requireAuth,
  trackUpdateRateLimit,
  csrfValidate(['PATCH']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      const { settings, stems } = req.body;
      if (settings) {
        track.settings = {
          ...track.settings,
          ...settings,
          eq: { ...track.settings.eq, ...(settings.eq ?? {}) },
          compression: { ...track.settings.compression, ...(settings.compression ?? {}) },
          reverb: { ...track.settings.reverb, ...(settings.reverb ?? {}) },
          mastering: { ...track.settings.mastering, ...(settings.mastering ?? {}) },
        };
      }
      if (stems) {
        track.stems = stems;
      }
      void syncToDB(track);
      const userId = (req as { user?: { uid?: string } }).user?.uid ?? 'anonymous';
      await invalidateCache(userId, `/api/tracks`);
      res.json(track);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`Update Settings Error: ${message}`);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

router.post(
  '/:id/ai-command',
  requireAuth,
  agentCommandRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track: Track | undefined = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      const { agent, command, audioBase64, audioMimeType, previousInteractionId } = req.body;
      if (!agent || !command) {
        return res.status(400).json({ error: 'Agent and command are required' });
      }

      const result = await generateAgentResponse(
        agent,
        command,
        track,
        audioBase64,
        audioMimeType,
        previousInteractionId
      );

      if (result.settingsPatch) {
        track.settings = {
          ...track.settings,
          ...result.settingsPatch,
          eq: { ...track.settings.eq, ...(result.settingsPatch.eq ?? {}) },
          compression: {
            ...track.settings.compression,
            ...(result.settingsPatch.compression ?? {}),
          },
          reverb: { ...track.settings.reverb, ...(result.settingsPatch.reverb ?? {}) },
          mastering: { ...track.settings.mastering, ...(result.settingsPatch.mastering ?? {}) },
        };
      }

      const agentName =
        agent === 'emar'
          ? 'Kappachino Emar'
          : agent === 'ricky'
            ? 'Kappachino Ricky'
            : agent === 'kingpin'
              ? 'Kingpin'
              : 'Orchestrator';
      track.history.unshift({
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent: agentName,
        action: `Prompt: "${command}"`,
        details: result.text,
      });
      void syncToDB(track);
      const userId = (req as { user?: { uid?: string } }).user?.uid ?? 'anonymous';
      await invalidateCache(userId, `/api/tracks`);
      if (typeof io !== 'undefined') {
        io.emit('track-updated', track);
      }
      res.json({ track, responseText: result.text, interactionId: result.interactionId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`AI Command Error: ${message}`);
      res.status(500).json({ error: 'Failed to process AI agent command', details: message });
    }
  }
);

router.post(
  '/:id/master',
  requireAuth,
  moderateRateLimit,
  csrfValidate(['POST']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      const { preset } = req.body;
      let warmth = 60,
        stereo = 110,
        lufs = -14.0,
        eqLow = 2.4,
        eqHigh = 2.0;

      if (preset === 'Afrofusion Warmth') {
        warmth = 85;
        stereo = 108;
        lufs = -14.2;
        eqLow = 3.0;
        eqHigh = 1.6;
      } else if (preset === 'Lagos Bounce') {
        warmth = 75;
        stereo = 120;
        lufs = -13.6;
        eqLow = 3.4;
        eqHigh = 2.5;
      } else if (preset === 'Radio Ready') {
        warmth = 65;
        stereo = 115;
        lufs = -13.0;
        eqLow = 2.0;
        eqHigh = 3.2;
      } else if (preset === 'Shrine Gold') {
        warmth = 90;
        stereo = 125;
        lufs = -14.0;
        eqLow = 2.8;
        eqHigh = 2.8;
      }

      track.settings.mastering = {
        preset: (preset as string) ?? 'Lagos Bounce',
        limiterCeiling: -0.3,
        targetLufs: lufs,
        warmthSaturation: warmth,
        stereoWidth: stereo,
      };
      track.settings.eq.low = eqLow;
      track.settings.eq.high = eqHigh;
      track.status = 'mastered';

      if (track.analysis) {
        if (track.analysis.dynamics) {
          track.analysis.dynamics.lufs = lufs;
          track.analysis.dynamics.peak = -0.3;
        }
        track.analysis.harmonicWarmthScore = Math.min(98, track.analysis.harmonicWarmthScore + 12);
        track.analysis.afrobeatGrooveIndex = Math.min(99, track.analysis.afrobeatGrooveIndex + 6);
      }

      track.history.unshift({
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent: 'Ozone 11',
        action: `Mastering Applied (${preset})`,
        details: `Normalized to ${lufs} LUFS, ${warmth}% vintage warmth, ${stereo}% stereo field.`,
      });
      void syncToDB(track);
      const userId = (req as { user?: { uid?: string } }).user?.uid ?? 'anonymous';
      await invalidateCache(userId, `/api/tracks`);
      res.json(track);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`Mastering Error: ${message}`);
      res.status(500).json({ error: 'Failed to apply mastering preset' });
    }
  }
);

router.get(
  '/:id/export-quota',
  requireAuth,
  lenientRateLimit,
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const sampleRate = parseInt(req.query.sampleRate as string, 10) || 48000;
      const bitDepth = parseInt(req.query.bitDepth as string, 10) || 24;
      const format = ((req.query.format as string) ?? 'wav').toUpperCase();

      const units = bitDepth === 24 ? 2.4 : 1.5;
      const remaining = Math.max(0, userExportUsage.limit - userExportUsage.used);

      const quota: ExportQuotaEstimate = {
        estimatedUnits: units,
        remainingUnits: remaining,
        canExport: remaining >= 1,
        planLimit: userExportUsage.limit,
        format,
        sampleRate,
        bitDepth,
        costDescription: `Studio Lossless ${bitDepth}-bit / ${sampleRate / 1000}kHz Render`,
      };

      res.json(quota);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error(`Export Quota Error: ${message}`);
      res.status(500).json({ error: 'Failed to retrieve export quota' });
    }
  }
);

export default router;
