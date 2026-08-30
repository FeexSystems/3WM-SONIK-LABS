import { z } from 'zod';

export const trackUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  bpm: z.number().positive().optional(),
  key: z.string().optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(1000).optional(),
  genre: z.string().optional(),
});

export const agentCommandSchema = z.object({
  agentId: z.enum(['kappachino-emar', 'kappachino-ricky', 'kingpin']),
  command: z.string().min(1, 'Command is required'),
  context: z.record(z.string(), z.any()).optional(),
});
