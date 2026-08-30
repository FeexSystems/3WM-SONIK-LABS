/**
 * 3WM SONIK — Voice API Request Schemas
 *
 * The /api/v1/voice/* surface is intentionally reachable without authentication so the
 * pre-login landing demo (LandingView -> TalkToTheThree) keeps working. Because these
 * routes proxy paid Gemini reasoning + TTS calls, input size is the primary cost lever,
 * so every free-text field is hard-capped here rather than relying on the global body limit.
 */

import { z } from 'zod';

/** Maximum characters accepted for any single free-text prompt sent to Gemini. */
export const MAX_PROMPT_CHARS = 2000;

/** Maximum number of prior turns accepted in a conversation history payload. */
export const MAX_HISTORY_TURNS = 20;

export const AGENT_IDS = ['emar', 'ricky', 'kingpin', 'orchestrator'] as const;

/**
 * Agent id accepted case-insensitively — the route lowercases before lookup, so the
 * schema normalises here to keep that behaviour without a second transform downstream.
 */
const agentId = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(AGENT_IDS))
  .catch('orchestrator')
  .default('orchestrator');

const promptText = z.string().trim().min(1).max(MAX_PROMPT_CHARS);

const historyTurn = z.object({
  role: z.enum(['user', 'model', 'assistant', 'system']).optional(),
  text: z.string().max(MAX_PROMPT_CHARS).optional(),
});

/** POST /api/v1/voice/chat */
export const voiceChatSchema = z.object({
  agent: agentId,
  text: promptText,
  history: z.array(historyTurn).max(MAX_HISTORY_TURNS).default([]),
  // Free-form studio telemetry from the client; bounded but not enumerated.
  studioContext: z.record(z.string(), z.unknown()).default({}),
});

/**
 * POST /api/v1/voice/tts
 * Accepts either `prompt` or `transcript` — the route reads `prompt || transcript`.
 */
export const voiceTtsSchema = z
  .object({
    prompt: promptText.optional(),
    transcript: promptText.optional(),
    voice: z.string().trim().max(64).optional(),
    agentId,
  })
  .refine((v) => Boolean(v.prompt ?? v.transcript), {
    message: `Either "prompt" or "transcript" is required (max ${MAX_PROMPT_CHARS} characters)`,
    path: ['prompt'],
  });

/**
 * POST /api/v1/voice/council-debate
 * `speechConfig` is forwarded to Gemini's multi-speaker config, so cap the speaker count.
 */
export const councilDebateSchema = z.object({
  prompt: promptText,
  speechConfig: z
    .array(
      z.object({ voice: z.string().trim().max(64), speaker: z.string().trim().max(64).optional() })
    )
    .min(1)
    .max(AGENT_IDS.length),
});

export type VoiceChatRequest = z.infer<typeof voiceChatSchema>;
export type VoiceTtsRequest = z.infer<typeof voiceTtsSchema>;
export type CouncilDebateRequest = z.infer<typeof councilDebateSchema>;
