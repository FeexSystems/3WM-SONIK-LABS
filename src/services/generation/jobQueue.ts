import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { GenerationJob, GenerationJobType, GenerationJobStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

class JobQueueService {
  private readonly MAX_JOBS_PER_DAY = 50; // Simple quota

  /**
   * Enqueues a new generation job if quota allows.
   */
  async enqueueJob(
    type: GenerationJobType,
    prompt: string,
    inputParams: Record<string, any> = {}
  ): Promise<GenerationJob> {
    if (!auth?.currentUser || !db) throw new Error('Must be logged in to queue a generation job.');
    const user = auth.currentUser;

    const hasQuota = await this.checkQuota(user.uid);
    if (!hasQuota) throw new Error('Generation quota exceeded. Please try again later.');

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const job: GenerationJob = {
      id: jobId,
      userId: user.uid,
      type,
      status: 'queued',
      prompt,
      inputParams,
      assetUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, 'generation_jobs', jobId);
    await setDoc(docRef, job);

    return job;
  }

  /**
   * Listens to the status of a specific job.
   */
  subscribeToJob(jobId: string, onUpdate: (job: GenerationJob) => void): () => void {
    if (!db) return () => {};
    const docRef = doc(db, 'generation_jobs', jobId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as GenerationJob);
      }
    });
  }

  /**
   * Gets all jobs for the current user.
   */
  async getUserJobs(): Promise<GenerationJob[]> {
    if (!auth?.currentUser || !db) return [];
    const user = auth.currentUser;

    const q = query(
      collection(db, 'generation_jobs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as GenerationJob);
  }

  /**
   * Private helper to check quota.
   */
  private async checkQuota(userId: string): Promise<boolean> {
    if (!db) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'generation_jobs'),
      where('userId', '==', userId),
      where('createdAt', '>=', today.toISOString())
    );

    const snapshot = await getDocs(q);
    return snapshot.size < this.MAX_JOBS_PER_DAY;
  }
}

export const jobQueue = new JobQueueService();
