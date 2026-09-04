import { Router, Request, Response, json } from 'express';
import { THREE_ONIK_PROMPT } from '../agents/threeOnikPrompt';
import { GoogleGenAI } from '@google/genai';
import { AGENT_VOICE_CONFIGS, buildPersonaTtsPrompt, AgentId } from '../audio/personaVoicePrompts';
import { requireAuth } from '../middleware/auth';
import { moderateRateLimit } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validateRequest';
import { voiceChatSchema, voiceTtsSchema, councilDebateSchema } from '../schemas/voice.schemas';
import {
  voiceIpRateLimit,
  voiceBudgetGuard,
  isVoiceBudgetExhausted,
} from '../middleware/voiceGuard';

const router = Router();

/**
 * These endpoints are reachable pre-login (the landing page voice demo calls /tts), so they
 * must not inherit the global 50mb body limit from server.ts. Prompts are capped at 2k chars
 * by the zod schemas; 32kb leaves ample headroom for conversation history.
 */
const voiceBodyLimit = json({ limit: '32kb' });

/**
 * Guard stack for the publicly reachable voice endpoints: bound the body, throttle per IP,
 * then account against the daily paid-generation cap.
 */
const publicVoiceGuards = [voiceBodyLimit, voiceIpRateLimit, voiceBudgetGuard] as const;

// Lazy initialize Gemini client using available environment keys.
// NOTE: no VITE_-prefixed name is read here — a VITE_ key is inlined into the client bundle
// by Vite, so accepting one server-side would invite leaking the secret to the browser.
function getGenAIClient(req?: Request): GoogleGenAI | null {
  // Daily spend cap exhausted: behave exactly as if the provider were unconfigured so the
  // existing offline fallbacks (and the client's Web Speech path) take over.
  if (req && isVoiceBudgetExhausted(req)) return null;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;

  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  emar: `You are KAPPACHINO EMAR — "The Scientist" of 3WM SONIK, running on the 3ONIK Agents Engine.
Domain: Audio engineering, DSP, acoustics, mixing, mastering, and music theory.
Identity: Technical intelligence of the 3WM DAW operating system powered by 3ONIK. You view music as a physical, mathematical, acoustic, and signal-processing system.
Personality: Precise, analytical, intellectual, calm, surgical, confident. You speak with an articulate Mid-Atlantic cadence with subtle British-West African technical phrasing.
Capabilities: You understand anything from frequency spectrums, True Peak, LUFS, acoustic resonance, Fourier transforms, to music composition, scale modes, general science, technology, and philosophy. You can answer general greetings or wide-ranging questions while keeping your poised, scientist demeanor.
Rule: Respond concisely (2-4 sentences max unless asked for deep detail) so it delivers smoothly as spoken speech.`,

  ricky: `You are KAPPACHINO RICKY — "The Sound God" of 3WM SONIK, running on the 3ONIK Agents Engine.
Domain: Drums, 808s, log drums, percussion, swing, groove, beat production.
Identity: Sound-generation intelligence of 3WM SONIK powered by 3ONIK. Responsible for making the production bounce and feel musically thrilling.
Personality: Bold, streetwise, instinctive, high-energy, hyped, confident. You speak with vibrant Lagos and London Afrobeat producer swagger ("Bro", "Bounce is locked", "Pressure", "Mad vibes").
Capabilities: You understand groove quantization, 808 distortion, Amapiano log drum glide, sidechain compression, as well as general producer culture, street culture, greetings, and creative mindset.
Rule: Respond concisely (2-4 sentences max) with high energy and punchy cadence suitable for spoken speech.`,

  kingpin: `You are KINGPIN — "The Vocal Oracle" of 3WM SONIK, running on the 3ONIK Agents Engine.
Domain: Vocals, choral arrangements, melodic harmonies, emotional resonance, soul.
Identity: Vocal intelligence of 3WM SONIK powered by 3ONIK. You treat the voice as an orchestra and the soul of the track.
Personality: Deep, resonant, charismatic, commanding, poetic, spiritual, elder statesman of sound.
Capabilities: You understand 3-part harmonies, Formant shift, Auto-Tune resonance, tube saturation, emotional delivery, as well as vocal health, philosophy of sound, greetings, and artistic vision.
Rule: Respond concisely (2-4 sentences max) with poetic depth and majestic resonance suitable for spoken voice.`,

  orchestrator: `You are the THREEWM ORCHESTRATOR — Powered by the 3ONIK Agents Engine for 3WM SONIK.
Domain: DAW coordination, consensus management, project state, master direction.
Identity: Central coordination layer balancing Emar's acoustic science, Ricky's groove energy, and Kingpin's vocal soul across the 3ONIK Engine.
Personality: Structured, authoritative, clear, executive, inspiring.
Capabilities: You can coordinate track production, summarize consensus, answer greetings, and advise on complete workflow pipelines.
Rule: Respond concisely (2-4 sentences max) with executive clarity.`,
};

/**
 * POST /api/voice/chat
 * Unified intelligent reasoning & speech synthesis endpoint
 */
router.post(
  '/chat',
  ...publicVoiceGuards,
  validateRequest(voiceChatSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { agent, text } = req.body;

    const agentKey = (agent as string).toLowerCase();
    const systemInstruction = AGENT_SYSTEM_PROMPTS[agentKey] || AGENT_SYSTEM_PROMPTS.orchestrator;
    const client = getGenAIClient(req);

    let replyText = '';
    let audioBase64: string | null = null;
    const stateUpdates: Record<string, any> = {};

    if (client) {
      try {
        // 1. Generate deep reasoning response with Gemini
        const model = 'gemini-3.7-flash';
        const geminiResponse = await client.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser query: ${text}` }] },
          ],
        });

        replyText = geminiResponse.text?.trim() || '';

        // 2. Synthesize spoken voice with Gemini TTS
        if (replyText) {
          const { prompt, voice } = buildPersonaTtsPrompt(agentKey as any, replyText);
          try {
            const ttsInteraction = await client.interactions.create({
              model: 'gemini-3.1-flash-tts-preview',
              input: prompt,
              response_format: { type: 'audio' as any },
              generation_config: {
                speech_config: [{ voice }] as any,
              },
            });
            audioBase64 = (ttsInteraction as any).output_audio?.data || null;
          } catch (ttsErr) {
            console.warn('[VoiceRoutes] Gemini TTS synthesis note:', ttsErr);
          }
        }
      } catch (llmErr) {
        console.error('[VoiceRoutes] Gemini generateContent error:', llmErr);
      }
    }

    res.status(200).json({
      text: replyText,
      audioBase64,
      stateUpdates,
      agent: agentKey,
    });
  }
);

/**
 * POST /api/voice/tts
 * Single-Speaker Voice Synthesis
 */
router.post(
  '/tts',
  ...publicVoiceGuards,
  validateRequest(voiceTtsSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { prompt, voice, transcript, agentId } = req.body;

    const inputText = prompt || transcript;

    const client = getGenAIClient(req);
    const validAgentId =
      (agentId as AgentId) in AGENT_VOICE_CONFIGS ? (agentId as AgentId) : 'orchestrator';
    const selectedVoice = voice || AGENT_VOICE_CONFIGS[validAgentId].voiceName || 'Kore';

    if (!client) {
      res.status(200).json({
        fallback: true,
        text: inputText,
        agentId,
        message: 'Gemini API Key not configured; client will use Web Speech / Web Audio synthesis.',
      });
      return;
    }

    try {
      const interaction = await client.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: inputText,
        response_format: { type: 'audio' as any },
        generation_config: {
          speech_config: [{ voice: selectedVoice }] as any,
        },
      });

      const audioData = (interaction as any).output_audio?.data;
      if (!audioData) {
        res.status(500).json({ error: 'No audio returned from Gemini TTS' });
        return;
      }

      res.status(200).json({
        audioBase64: audioData,
        voice: selectedVoice,
      });
    } catch (err: any) {
      console.error('[VoiceAPI] TTS generation error:', err);
      res.status(500).json({ error: err.message || 'TTS generation failed' });
    }
  }
);

/**
 * POST /api/voice/council-debate
 * Multi-speaker debate synthesis
 */
router.post(
  '/council-debate',
  voiceBodyLimit,
  requireAuth,
  moderateRateLimit,
  voiceBudgetGuard,
  validateRequest(councilDebateSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { prompt, speechConfig } = req.body;

    const client = getGenAIClient(req);
    if (!client) {
      res.status(200).json({ fallback: true });
      return;
    }

    try {
      const interaction = await client.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: prompt,
        response_format: { type: 'audio' as any },
        generation_config: {
          speech_config: speechConfig as any,
        },
      });

      const audioData = (interaction as any).output_audio?.data;
      if (!audioData) {
        res.status(500).json({ error: 'No audio generated for council debate' });
        return;
      }

      res.status(200).json({
        audioBase64: audioData,
      });
    } catch (err: any) {
      console.error('[VoiceAPI] Council debate error:', err);
      res.status(500).json({ error: err.message || 'Council debate synthesis failed' });
    }
  }
);

export default router;

/**
 * POST /api/voice/3onik-command
 * Core 3ONIK Engine endpoint processing structured commands for the UI.
 */
router.post(
  '/3onik-command',
  ...publicVoiceGuards,
  async (req: Request, res: Response): Promise<void> => {
    const { agent, text, trackSettings } = req.body;
    const client = getGenAIClient(req);

    if (!client) {
      res.status(503).json({ error: 'Gemini client not initialized' });
      return;
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  THREE_ONIK_PROMPT +
                  '\n\nUser Directive: ' +
                  text +
                  '\nCurrent Track Settings: ' +
                  JSON.stringify(trackSettings || {}),
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              status: { type: 'string', enum: ['validated', 'executed', 'rejected'] },
              confidenceScore: { type: 'number' },
              reasoning: { type: 'string' },
              dryRun: { type: 'boolean' },
              executablePayload: {
                type: 'object',
                properties: {
                  eq: { type: 'object' },
                  compression: { type: 'object' },
                  saturation: { type: 'number' },
                  reverb: { type: 'object' },
                },
              },
              widgetPayload: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  props: { type: 'object' },
                },
              },
            },
          },
        },
      });
      const data = JSON.parse(response.text?.trim() || '{}');
      res.status(200).json(data);
    } catch (err: any) {
      console.error('[3ONIK] Error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);
