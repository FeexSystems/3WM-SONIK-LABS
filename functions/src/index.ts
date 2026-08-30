import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// Auth Triggers
// ============================================================================

/**
 * Triggered when a new user signs up.
 * Creates a default user profile document in Firestore.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  functions.logger.info(`New user created: ${user.uid}`);

  const userProfile: Record<string, unknown> = {
    email: user.email ?? null,
    displayName: user.displayName ?? 'New User',
    photoURL: user.photoURL ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: 'free',
    settings: {
      theme: 'dark',
      emailNotifications: true,
    },
  };

  try {
    await db.collection('users').doc(user.uid).set(userProfile);
    functions.logger.info(`Profile created for user ${user.uid}`);
  } catch (error: unknown) {
    const err = error as Error;
    functions.logger.error(`Error creating profile for user ${user.uid}:`, err.message);
  }
});

/**
 * Triggered when a user deletes their account.
 * Cleans up their profile and their storage files to prevent orphaned data.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user: admin.auth.UserRecord) => {
  functions.logger.info(`User deleted: ${user.uid}. Cleaning up data...`);

  try {
    // 1. Delete user profile in Firestore
    await db.collection('users').doc(user.uid).delete();

    // 2. Delete user's storage folder
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({ prefix: `users/${user.uid}/` });

    functions.logger.info(`Successfully cleaned up data for user ${user.uid}`);
  } catch (error: unknown) {
    const err = error as Error;
    functions.logger.error(`Error cleaning up data for user ${user.uid}:`, err.message);
  }
});

// ============================================================================
// Storage Triggers
// ============================================================================

/**
 * Triggered when a new audio file is uploaded to the Storage bucket.
 * Can be used to extract metadata, transcode audio, or validate files.
 */
export const onAudioUploaded = functions.storage
  .object()
  .onFinalize(async (object: functions.storage.ObjectMetadata) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Exit if not an audio file
    if (!contentType?.startsWith('audio/')) {
      functions.logger.log('Not an audio file. Ignoring.');
      return;
    }

    functions.logger.info(`Audio file uploaded: ${filePath ?? 'unknown_path'}`);

    // TODO: Implement audio processing (e.g. waveform generation, normalization)
    // For now, this is just a placeholder hook.
  });

// ============================================================================
// Firestore Triggers
// ============================================================================

/**
 * Triggered when a new AI generation job is created.
 * Acts as a backend listener to start the generation process using 3WM Agents.
 */
export const onGenerationJobCreated = functions.firestore
  .document('generation_jobs/{jobId}')
  .onCreate(
    async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
      const jobData = snap.data() as Record<string, unknown>;
      const jobId = String(context.params.jobId);

      functions.logger.info(`New generation job received: ${jobId}`, jobData);

      // Update status to processing
      await snap.ref.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // TODO: Dispatch task to the 3WM Orchestrator (Kappachino Emar, Ricky, Kingpin)
      // await threeWMServices.dispatchJob(jobData);

      // For now, just mark it complete as a stub
      await snap.ref.update({
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        assetUrl: 'https://placeholder.url/generated.wav',
      });
    }
  );
