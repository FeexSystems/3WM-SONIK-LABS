import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { lenientRateLimit, moderateRateLimit } from '../middleware/rateLimit';
import { csrfValidate } from '../middleware/csrf';
import { syncToDB } from '../utils/audioHelpers'; // Assumed helpers file
import { logger } from '../lib/logger';
import { Track } from '../types';

const router = Router();

router.patch(
  '/:id/archive',
  requireAuth,
  moderateRateLimit,
  csrfValidate(['PATCH']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { archived = true } = req.body as { archived?: boolean };
      track.archived = archived;
      track.archivedAt = archived ? new Date().toISOString() : undefined;
      track.archivedBy = '3WM Producer';
      track.status = archived ? 'ARCHIVED' : 'PRODUCTION';
      void syncToDB(track);
      res.json(track);
    } catch (e: unknown) {
      const err = e as Error;
      logger.error(`Archive Project Error: ${err.message}`);
      res.status(500).json({ error: 'Failed to archive project' });
    }
  }
);

router.patch(
  '/:id/tracks/:trackId/archive',
  requireAuth,
  lenientRateLimit,
  csrfValidate(['PATCH']),
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.exists ? (doc.data() as Track) : undefined;
      if (!track) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const trackId = Array.isArray(req.params.trackId)
        ? req.params.trackId[0]
        : req.params.trackId;
      const { archived = true } = req.body as { archived?: boolean };

      track.stems = track.stems.map((stem) => {
        if (stem.id === trackId) {
          return {
            ...stem,
            archived,
            archivedAt: archived ? new Date().toISOString() : undefined,
          };
        }
        return stem;
      });
      void syncToDB(track);
      res.json(track);
    } catch (e: unknown) {
      const err = e as Error;
      logger.error(`Archive Track Error: ${err.message}`);
      res.status(500).json({ error: 'Failed to archive track' });
    }
  }
);

router.get('/:id/elevenlabs/jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as Request & { user: { uid: string } }).user;

    const snapshot = await db
      .collection('jobs')
      .where('project_id', '==', id)
      .where('user_id', '==', user.uid)
      .get();

    const jobs = snapshot.docs.map((d) => d.data());
    jobs.sort(
      (a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
    );

    res.json(jobs);
  } catch (e: unknown) {
    const err = e as Error;
    logger.error(`ElevenLabs Jobs Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Integration with ElevenLabs & TrueFoundry Services (AI generation)
router.post('/:id/elevenlabs/music', requireAuth, (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented in this route yet. Needs service extraction.' });
});

router.post('/:id/elevenlabs/sfx', requireAuth, (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented in this route yet. Needs service extraction.' });
});

// Upload logic has been migrated directly to Supabase Edge Functions & Storage

export default router;
