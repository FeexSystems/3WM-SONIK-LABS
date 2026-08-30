/**
 * 3WM SONIK — Job Schemas for QStash Background Processing
 * Defines input/output contracts for each job type with Zod validation
 */

import { z } from 'zod';
import { JobType } from '../services/qstashService';

// Base job payload schema
export const BaseJobPayloadSchema = z.object({
  jobId: z.string(),
  type: z.nativeEnum(JobType),
  projectId: z.string(),
  trackId: z.string().optional(),
  userId: z.string(),
  data: z.record(z.string(), z.any()),
});

// Stem Separation Job Schema
export const StemSeparationJobDataSchema = z.object({
  audioUrl: z.string().url(),
  audioBase64: z.string().optional(),
  outputFormat: z.enum(['wav', 'mp3', 'flac']).default('wav'),
  stems: z
    .array(z.enum(['drums', 'bass', 'other', 'vocals']))
    .default(['drums', 'bass', 'other', 'vocals']),
  quality: z.enum(['low', 'medium', 'high']).default('high'),
});

export const StemSeparationJobResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed', 'failed']),
  stems: z.record(z.string(), z.string().url()).optional(),
  error: z.string().optional(),
  processingTime: z.number(),
});

// Neural DSP Render Job Schema
export const NeuralDspJobDataSchema = z.object({
  trackId: z.string(),
  dspChain: z.array(
    z.object({
      type: z.enum(['eq', 'compressor', 'reverb', 'delay', 'saturation', 'limiter']),
      parameters: z.record(z.string(), z.any()),
    })
  ),
  inputAudioUrl: z.string().url(),
  outputFormat: z.enum(['wav', 'mp3']).default('wav'),
  sampleRate: z.number().default(48000),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]).default(24 as any),
});

export const NeuralDspJobResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed', 'failed']),
  outputAudioUrl: z.string().url().optional(),
  error: z.string().optional(),
  processingTime: z.number(),
  dspAnalysis: z
    .object({
      peakDb: z.number(),
      rmsDb: z.number(),
      lufs: z.number(),
      dynamicRange: z.number(),
    })
    .optional(),
});

// AI Video Generation Job Schema
export const AiVideoJobDataSchema = z.object({
  trackId: z.string(),
  audioUrl: z.string().url(),
  duration: z.number().min(1).max(60).default(30),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']).default('9:16'),
  theme: z.enum(['lagos_fire', 'scientist_neon', 'oracle_gold']).default('lagos_fire'),
  agentReaction: z.enum(['ricky', 'emar', 'kingpin']).default('ricky'),
  includeWaveform: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
});

export const AiVideoJobResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed', 'failed']),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  error: z.string().optional(),
  processingTime: z.number(),
  metadata: z
    .object({
      duration: z.number(),
      resolution: z.string(),
      fileSize: z.number(),
      format: z.string(),
    })
    .optional(),
});

// Batch Audio Export Job Schema
export const BatchExportJobDataSchema = z.object({
  projectId: z.string(),
  trackIds: z.array(z.string()),
  exportFormat: z.enum(['wav', 'mp3', 'flac', 'aiff']).default('wav'),
  sampleRate: z.number().default(48000),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]).default(24 as any),
  normalize: z.boolean().default(true),
  dither: z.boolean().default(false),
  includeStems: z.boolean().default(false),
  metadata: z
    .object({
      title: z.string().optional(),
      artist: z.string().optional(),
      album: z.string().optional(),
      genre: z.string().optional(),
      year: z.number().optional(),
    })
    .optional(),
});

export const BatchExportJobResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['completed', 'failed', 'partial']),
  exports: z
    .array(
      z.object({
        trackId: z.string(),
        url: z.string().url().optional(),
        error: z.string().optional(),
        status: z.enum(['completed', 'failed']),
      })
    )
    .optional(),
  error: z.string().optional(),
  processingTime: z.number(),
  totalSize: z.number().optional(),
});

// Combined job schema for validation
export const JobPayloadSchema = z.discriminatedUnion('type', [
  BaseJobPayloadSchema.extend({
    type: z.literal(JobType.STEM_SEPARATION),
    data: StemSeparationJobDataSchema,
  }),
  BaseJobPayloadSchema.extend({
    type: z.literal(JobType.NEURAL_DSP_RENDER),
    data: NeuralDspJobDataSchema,
  }),
  BaseJobPayloadSchema.extend({
    type: z.literal(JobType.AI_VIDEO_GENERATION),
    data: AiVideoJobDataSchema,
  }),
  BaseJobPayloadSchema.extend({
    type: z.literal(JobType.BATCH_AUDIO_EXPORT),
    data: BatchExportJobDataSchema,
  }),
]);

// Type inference helpers
export type StemSeparationJobData = z.infer<typeof StemSeparationJobDataSchema>;
export type NeuralDspJobData = z.infer<typeof NeuralDspJobDataSchema>;
export type AiVideoJobData = z.infer<typeof AiVideoJobDataSchema>;
export type BatchExportJobData = z.infer<typeof BatchExportJobDataSchema>;
export type JobPayload = z.infer<typeof JobPayloadSchema>;
