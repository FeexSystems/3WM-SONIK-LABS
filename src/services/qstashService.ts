/**
 * 3WM SONIK — QStash Service Layer (Pillar 1: Async Background Processing)
 * Manages job queue scheduling, monitoring, and error handling for background tasks
 */

import { Client } from '@upstash/qstash';

export enum JobType {
  STEM_SEPARATION = 'stem_separation',
  NEURAL_DSP_RENDER = 'neural_dsp_render',
  AI_VIDEO_GENERATION = 'ai_video_generation',
  BATCH_AUDIO_EXPORT = 'batch_audio_export',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export interface JobPayload {
  type: JobType;
  projectId: string;
  trackId?: string;
  userId: string;
  data: Record<string, any>;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  result?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  retryCount?: number;
}

export interface JobScheduleOptions {
  delay?: number; // Delay in seconds before execution
  retries?: number; // Number of automatic retries
  callbackUrl?: string; // Webhook URL for completion notification
}

class QStashService {
  private client: Client | null = null;
  private isInitialized: boolean = false;
  private jobCache: Map<string, JobResult> = new Map();

  /**
   * Initialize QStash client with environment credentials
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('QStash service already initialized');
      return;
    }

    const qstashUrl = process.env.QSTASH_URL;
    const qstashToken = process.env.QSTASH_TOKEN;

    if (!qstashUrl || !qstashToken) {
      console.warn('QStash credentials not found in environment. Running in mock mode.');
      this.isInitialized = true;
      return;
    }

    try {
      this.client = new Client({
        baseUrl: qstashUrl,
        token: qstashToken,
      });
      this.isInitialized = true;
      console.log('QStash service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize QStash client:', error);
      this.isInitialized = true; // Allow mock mode to continue
    }
  }

  /**
   * Schedule a job for background processing
   */
  async scheduleJob(payload: JobPayload, options: JobScheduleOptions = {}): Promise<string> {
    if (!this.isInitialized) {
      this.initialize();
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status in cache
    this.jobCache.set(jobId, {
      jobId,
      status: JobStatus.PENDING,
      startedAt: Date.now(),
      retryCount: 0,
    });

    if (!this.client) {
      // Mock mode: simulate job execution
      console.log(`[MOCK] Scheduling job ${jobId} of type ${payload.type}`);
      this.simulateJobExecution(jobId, payload);
      return jobId;
    }

    try {
      const endpoint = this.getJobEndpoint(payload.type);
      const headers = {
        'Content-Type': 'application/json',
        'Upstash-Delay': options.delay ? `${options.delay}s` : undefined,
        'Upstash-Retries': options.retries ? options.retries.toString() : '3',
      };

      await this.client.publishJSON({
        url: endpoint,
        headers: Object.fromEntries(
          Object.entries(headers).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>,
        body: {
          jobId,
          ...payload,
        },
        callback: options.callbackUrl,
      });

      console.log(`Job ${jobId} scheduled successfully`);
      return jobId;
    } catch (error) {
      console.error(`Failed to schedule job ${jobId}:`, error);
      this.jobCache.set(jobId, {
        jobId,
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobId: string): JobResult | undefined {
    return this.jobCache.get(jobId);
  }

  /**
   * Get all jobs for a specific project
   */
  getProjectJobs(projectId: string): JobResult[] {
    return Array.from(this.jobCache.values()).filter((job) => job.result?.projectId === projectId);
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobCache.get(jobId);
    if (!job || job.status !== JobStatus.PENDING) {
      return false;
    }

    this.jobCache.set(jobId, {
      ...job,
      status: JobStatus.FAILED,
      error: 'Job cancelled by user',
      completedAt: Date.now(),
    });

    return true;
  }

  /**
   * Update job result (called by worker endpoints)
   */
  updateJobResult(jobId: string, result: Partial<JobResult>): void {
    const existing = this.jobCache.get(jobId);
    if (existing) {
      this.jobCache.set(jobId, { ...existing, ...result });
    }
  }

  /**
   * Get job statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const jobs = Array.from(this.jobCache.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === JobStatus.PENDING).length,
      processing: jobs.filter((j) => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter((j) => j.status === JobStatus.FAILED).length,
    };
  }

  /**
   * Clear completed jobs older than specified hours
   */
  clearOldJobs(hours: number = 24): void {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    for (const [jobId, job] of this.jobCache.entries()) {
      if (
        (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.jobCache.delete(jobId);
      }
    }
  }

  /**
   * Get the endpoint URL for a specific job type
   */
  private getJobEndpoint(type: JobType): string {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    switch (type) {
      case JobType.STEM_SEPARATION:
        return `${baseUrl}/api/jobs/stem-separation`;
      case JobType.NEURAL_DSP_RENDER:
        return `${baseUrl}/api/jobs/neural-dsp`;
      case JobType.AI_VIDEO_GENERATION:
        return `${baseUrl}/api/jobs/ai-video`;
      case JobType.BATCH_AUDIO_EXPORT:
        return `${baseUrl}/api/jobs/batch-export`;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Simulate job execution in mock mode
   */
  private simulateJobExecution(jobId: string, payload: JobPayload): void {
    const job = this.jobCache.get(jobId);
    if (!job) return;

    // Update to processing
    this.jobCache.set(jobId, {
      ...job,
      status: JobStatus.PROCESSING,
    });

    // Simulate work based on job type
    const delay = this.getSimulatedDelay(payload.type);

    setTimeout(() => {
      const updatedJob = this.jobCache.get(jobId);
      if (!updatedJob) return;

      // Simulate success (90% chance) or failure (10% chance)
      const success = Math.random() > 0.1;

      this.jobCache.set(jobId, {
        ...updatedJob,
        status: success ? JobStatus.COMPLETED : JobStatus.FAILED,
        result: success ? { message: 'Job completed successfully', data: payload.data } : undefined,
        error: success ? undefined : 'Simulated job failure',
        completedAt: Date.now(),
      });

      console.log(`[MOCK] Job ${jobId} ${success ? 'completed' : 'failed'}`);
    }, delay);
  }

  /**
   * Get simulated delay for job types (in milliseconds)
   */
  private getSimulatedDelay(type: JobType): number {
    switch (type) {
      case JobType.STEM_SEPARATION:
        return 5000; // 5 seconds
      case JobType.NEURAL_DSP_RENDER:
        return 3000; // 3 seconds
      case JobType.AI_VIDEO_GENERATION:
        return 8000; // 8 seconds
      case JobType.BATCH_AUDIO_EXPORT:
        return 4000; // 4 seconds
      default:
        return 2000;
    }
  }
}

// Singleton instance
export const qstashService = new QStashService();
