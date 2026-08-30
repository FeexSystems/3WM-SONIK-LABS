import 'dotenv/config';
import { adminDb } from '../src/lib/firebase-admin';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { users, tracks, generationJobs } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../src/lib/logger';

const { Client } = pkg;

async function migrateData() {
  if (!process.env.POSTGRES_URL) {
    logger.error('POSTGRES_URL is not defined in .env. Cannot migrate data.');
    process.exit(1);
  }

  logger.info('Connecting to Postgres...');
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();
  const db = drizzle(client);

  logger.info('Connected to Postgres. Starting migration from Firebase...');

  try {
    // 1. Migrate Users
    logger.info('Migrating users...');
    const usersSnapshot = await adminDb.collection('users').get();
    let userCount = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const existingUser = await db.select().from(users).where(eq(users.id, doc.id)).limit(1);

      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: doc.id,
          email: data.email || `${doc.id}@migrated.com`, // enforce required email
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
        userCount++;
      }
    }
    logger.info(`Migrated ${userCount} new users.`);

    // 2. Migrate Tracks
    logger.info('Migrating tracks...');
    const tracksSnapshot = await adminDb.collection('tracks').get();
    let trackCount = 0;

    for (const doc of tracksSnapshot.docs) {
      const data = doc.data();
      const existingTrack = await db.select().from(tracks).where(eq(tracks.id, doc.id)).limit(1);

      if (existingTrack.length === 0) {
        // Ensure the owner exists in the Postgres users table to satisfy foreign key constraint
        if (data.ownerId) {
          const ownerExists = await db
            .select()
            .from(users)
            .where(eq(users.id, data.ownerId))
            .limit(1);
          if (ownerExists.length === 0) {
            logger.warn(
              `Skipping track ${doc.id} because owner ${data.ownerId} does not exist in Postgres.`
            );
            continue;
          }
        } else {
          logger.warn(`Skipping track ${doc.id} because ownerId is missing.`);
          continue;
        }

        await db.insert(tracks).values({
          id: doc.id,
          title: data.title || 'Untitled',
          ownerId: data.ownerId,
          bpm: data.bpm || 120,
          key: data.key || 'C',
          genre: data.genre || 'Afrofusion',
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
        trackCount++;
      }
    }
    logger.info(`Migrated ${trackCount} new tracks.`);

    // 3. Migrate Generation Jobs
    logger.info('Migrating generation jobs...');
    const jobsSnapshot = await adminDb.collection('jobs').get();
    let jobCount = 0;

    for (const doc of jobsSnapshot.docs) {
      const data = doc.data();
      const existingJob = await db
        .select()
        .from(generationJobs)
        .where(eq(generationJobs.id, doc.id))
        .limit(1);

      if (existingJob.length === 0) {
        await db.insert(generationJobs).values({
          id: doc.id,
          projectId: data.project_id || data.projectId,
          userId: data.user_id || data.userId,
          status: data.status || 'completed',
          prompt: data.prompt,
          resultUrl: data.resultUrl || data.result_url,
          createdAt:
            data.created_at || data.createdAt
              ? new Date(data.created_at || data.createdAt)
              : new Date(),
        });
        jobCount++;
      }
    }
    logger.info(`Migrated ${jobCount} new jobs.`);

    logger.info('Migration fully complete!');
  } catch (error) {
    logger.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrateData();
