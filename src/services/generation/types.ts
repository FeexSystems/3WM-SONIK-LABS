export type GenerationJobType = 'music' | 'sfx' | 'isolate' | 'transform';

export type GenerationJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  userId: string;
  type: GenerationJobType;
  status: GenerationJobStatus;
  prompt: string;
  inputParams: Record<string, any>;
  assetUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationQuota {
  totalJobs: number;
  lastResetAt: string;
}
