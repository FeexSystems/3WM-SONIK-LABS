/**
 * API Validation Schemas using Zod
 * Part of Phase 6.2.2: Create validation schemas for all API endpoints (tracks, projects, vocal)
 */

import { z } from 'zod';

// ==========================================
// Track Schemas
// ==========================================

// Stem schema
export const StemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  volume: z.number().min(0).max(2),
  pan: z.number().min(-1).max(1),
  muted: z.boolean(),
  solo: z.boolean(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  waveformSeed: z.number().int().min(0).max(999),
});

// EQ schema
export const EQSchema = z.object({
  low: z.number().min(-12).max(12),
  mid: z.number().min(-12).max(12),
  high: z.number().min(-12).max(12),
});

// Compression schema
export const CompressionSchema = z.object({
  threshold: z.number().min(-60).max(0),
  ratio: z.number().min(1).max(20),
  attack: z.number().min(0).max(200),
  release: z.number().min(10).max(1000),
  makeupGain: z.number().min(0).max(24),
});

// Reverb schema
export const ReverbSchema = z.object({
  type: z.enum(['shrine', 'lagos_hall', 'plate', 'room', 'spring', 'none']),
  amount: z.number().min(0).max(100),
  decay: z.number().min(0.1).max(10),
});

// Mastering schema
export const MasteringSchema = z.object({
  preset: z.string().min(1).max(50),
  limiterCeiling: z.number().min(-3).max(0),
  targetLufs: z.number().min(-24).max(-8),
  warmthSaturation: z.number().min(0).max(100),
  stereoWidth: z.number().min(50).max(200),
});

// Track Settings schema
export const TrackSettingsSchema = z.object({
  volume: z.number().min(0).max(2),
  pan: z.number().min(-1).max(1),
  eq: EQSchema.optional(),
  compression: CompressionSchema.optional(),
  reverb: ReverbSchema.optional(),
  mastering: MasteringSchema.optional(),
});

// Audio Analysis schema
export const AudioAnalysisSchema = z.object({
  frequencies: z.object({
    subBass: z.number().min(0).max(10),
    bass: z.number().min(0).max(10),
    lowMids: z.number().min(0).max(10),
    mids: z.number().min(0).max(10),
    highMids: z.number().min(0).max(10),
    treble: z.number().min(0).max(10),
    air: z.number().min(0).max(10),
  }),
  dynamics: z.object({
    range: z.number().min(0).max(30),
    rms: z.number().min(-60).max(0),
    peak: z.number().min(-60).max(0),
    lufs: z.number().min(-60).max(0),
  }),
  afrobeatGrooveIndex: z.number().min(0).max(100),
  harmonicWarmthScore: z.number().min(0).max(100),
  suggestions: z.array(z.string()).optional(),
  agentInsights: z.record(z.string(), z.string()).optional(),
});

// Track History schema
export const TrackHistorySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  agent: z.string().min(1).max(100),
  action: z.string().min(1).max(200),
  details: z.string().min(1).max(500),
});

// Track schema
export const TrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  genre: z.string().min(1).max(100),
  bpm: z.number().min(60).max(200),
  key: z.string().min(1).max(20),
  duration: z.number().min(1).max(600),
  createdAt: z.string().datetime(),
  status: z.enum(['raw', 'analyzing', 'mixing', 'mastered', 'exported']),
  settings: TrackSettingsSchema,
  analysis: AudioAnalysisSchema.optional(),
  stems: z.array(StemSchema),
  history: z.array(TrackHistorySchema),
  userId: z.string().optional(),
});

// ==========================================
// Request/Response Schemas
// ==========================================

// POST /api/tracks - Create Track
export const CreateTrackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  artist: z.string().min(1).max(200).optional(),
  genre: z.string().min(1).max(100).optional(),
  bpm: z.number().min(60).max(200).optional(),
  key: z.string().min(1).max(20).optional(),
});

// PATCH /api/tracks/:id/settings - Update Track Settings
export const UpdateTrackSettingsSchema = z.object({
  settings: TrackSettingsSchema.partial().optional(),
  stems: z.array(StemSchema.partial()).optional(),
});

// POST /api/tracks/:id/generate-stem - Generate Stem
export const GenerateStemSchema = z.object({
  prompt: z.string().min(1).max(500),
  type: z.enum(['vocals', 'drums', 'bass', 'instruments', 'fx', 'master']),
});

// ==========================================
// Project Schemas
// ==========================================

// Project schema
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  userId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tracks: z.array(z.string()).optional(), // Array of track IDs
  settings: z
    .object({
      sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]),
      bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]),
      bufferSize: z.union([
        z.literal(64),
        z.literal(128),
        z.literal(256),
        z.literal(512),
        z.literal(1024),
        z.literal(2048),
      ]),
    })
    .optional(),
});

// POST /api/projects - Create Project
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  settings: z
    .object({
      sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]).optional(),
      bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]).optional(),
      bufferSize: z
        .union([
          z.literal(64),
          z.literal(128),
          z.literal(256),
          z.literal(512),
          z.literal(1024),
          z.literal(2048),
        ])
        .optional(),
    })
    .optional(),
});

// PATCH /api/projects/:id - Update Project
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  settings: z
    .object({
      sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]).optional(),
      bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]).optional(),
      bufferSize: z
        .union([
          z.literal(64),
          z.literal(128),
          z.literal(256),
          z.literal(512),
          z.literal(1024),
          z.literal(2048),
        ])
        .optional(),
    })
    .optional(),
  tracks: z.array(z.string()).optional(),
});

// ==========================================
// Vocal Schemas
// ==========================================

// Vocal Library Item schema
export const VocalLibraryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.enum(['sample', 'synthesis', 'recording']),
  duration: z.number().min(0).max(600),
  key: z.string().min(1).max(20).optional(),
  bpm: z.number().min(60).max(200).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  userId: z.string().min(1),
});

// POST /api/vocal/library - Add to Vocal Library
export const AddVocalLibrarySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['sample', 'synthesis', 'recording']),
  duration: z.number().min(0).max(600),
  key: z.string().min(1).max(20).optional(),
  bpm: z.number().min(60).max(200).optional(),
  tags: z.array(z.string()).optional(),
});

// POST /api/vocal/synthesize - Vocal Synthesis
export const VocalSynthesisSchema = z.object({
  text: z.string().min(1).max(2000),
  voice: z.string().min(1).max(100),
  pitch: z.number().min(-12).max(12).optional(),
  speed: z.number().min(0.5).max(2).optional(),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'calm']).optional(),
});

// ==========================================
// Agent Schemas
// ==========================================

// Agent Command schema
export const AgentCommandSchema = z.object({
  agent: z.enum(['emar', 'ricky', 'kingpin', 'orchestrator']),
  command: z.string().min(1).max(1000),
  trackId: z.string().min(1),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
});

// ==========================================
// Export/Import Schemas
// ==========================================

// Export Options schema
export const ExportOptionsSchema = z.object({
  format: z.enum(['wav', 'flac', 'mp3']),
  sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).optional(),
});

// POST /api/tracks/:id/export - Export Track
export const ExportTrackSchema = z.object({
  format: z.enum(['wav', 'flac', 'mp3']),
  sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]).optional(),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]).optional(),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).optional(),
  includeStems: z.boolean().optional(),
});

// ==========================================
// Query Parameter Schemas
// ==========================================

// Track query parameters
export const TrackQuerySchema = z.object({
  genre: z.string().optional(),
  bpmMin: z.number().min(60).max(200).optional(),
  bpmMax: z.number().min(60).max(200).optional(),
  status: z.enum(['raw', 'analyzing', 'mixing', 'mastered', 'exported']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// ==========================================
// Error Response Schemas
// ==========================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type Stem = z.infer<typeof StemSchema>;
export type EQ = z.infer<typeof EQSchema>;
export type Compression = z.infer<typeof CompressionSchema>;
export type Reverb = z.infer<typeof ReverbSchema>;
export type Mastering = z.infer<typeof MasteringSchema>;
export type TrackSettings = z.infer<typeof TrackSettingsSchema>;
export type AudioAnalysis = z.infer<typeof AudioAnalysisSchema>;
export type TrackHistory = z.infer<typeof TrackHistorySchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type VocalLibraryItem = z.infer<typeof VocalLibraryItemSchema>;
