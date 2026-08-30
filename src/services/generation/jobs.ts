import { adminDb } from '../../lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export type GenerationJobStatus =
  'queued' | 'generating' | 'processing' | 'ready' | 'failed' | 'cancelled';

export interface BaseJob {
  id: string;
  project_id: string;
  user_id: string;
  provider: 'elevenlabs' | 'internal_export';
  provider_job_id?: string;
  agent?: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' | 'system';
  generation_type:
    | 'music'
    | 'sound_effect'
    | 'voice_isolation'
    | 'voice_transform'
    | 'export_wav'
    | 'export_stems';
  prompt?: string;
  parameters: any;
  status: GenerationJobStatus;
  progress: number;
  asset_id?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

const JOBS_COLLECTION = 'jobs';
const MAX_CONCURRENT_JOBS = 3;
const QUOTA_LIMIT = 50;

export async function createJob(
  userId: string,
  projectId: string,
  provider: BaseJob['provider'],
  generationType: BaseJob['generation_type'],
  parameters: any,
  agent?: BaseJob['agent'],
  prompt?: string
): Promise<BaseJob> {
  // 1. Quota Check
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyJobsSnapshot = await adminDb
    .collection(JOBS_COLLECTION)
    .where('user_id', '==', userId)
    .where('created_at', '>=', startOfDay.toISOString())
    .get();

  if (dailyJobsSnapshot.size >= QUOTA_LIMIT) {
    throw new Error('Daily quota exceeded. Please try again tomorrow.');
  }

  // 2. Concurrent Jobs Check
  const concurrentSnapshot = await adminDb
    .collection(JOBS_COLLECTION)
    .where('user_id', '==', userId)
    .where('status', 'in', ['queued', 'generating', 'processing'])
    .get();

  if (concurrentSnapshot.size >= MAX_CONCURRENT_JOBS) {
    throw new Error('Too many concurrent jobs. Please wait for them to finish.');
  }

  // 3. Max Duration Check (for generation)
  if (provider === 'elevenlabs') {
    const duration = parameters.duration_seconds || 0;
    // We enforce 600 seconds max for music v2 based on docs
    if (duration > 600) {
      throw new Error('Maximum duration allowed is 600 seconds.');
    }
  }

  const job: BaseJob = {
    id: `job-${Date.now()}-${uuidv4().substring(0, 8)}`,
    project_id: projectId,
    user_id: userId,
    provider,
    generation_type: generationType,
    parameters,
    agent,
    prompt,
    status: 'queued',
    progress: 0,
    created_at: new Date().toISOString(),
  };

  await adminDb.collection(JOBS_COLLECTION).doc(job.id).set(job);
  return job;
}

export async function getJob(jobId: string): Promise<BaseJob | null> {
  const doc = await adminDb.collection(JOBS_COLLECTION).doc(jobId).get();
  return doc.exists ? (doc.data() as BaseJob) : null;
}

export async function updateJobStatus(
  jobId: string,
  status: GenerationJobStatus,
  progress: number = 0,
  updates: Partial<BaseJob> = {}
): Promise<void> {
  const data: any = { status, progress, ...updates };
  if (status === 'ready' || status === 'failed' || status === 'cancelled') {
    data.completed_at = new Date().toISOString();
  }
  await adminDb.collection(JOBS_COLLECTION).doc(jobId).update(data);
}

export async function cancelJob(jobId: string): Promise<void> {
  await updateJobStatus(jobId, 'cancelled');
}
