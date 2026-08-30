import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { envConfig } from '../config/environment';

const firebaseAdminConfig = envConfig.getFirebaseAdminConfig();

// Only initialize Firebase Admin if configuration is available
if (!getApps().length) {
  if (firebaseAdminConfig) {
    try {
      initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: firebaseAdminConfig.projectId,
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  } else {
    console.warn('Firebase Admin configuration not available - admin features will be disabled');
    // Initialize with minimal config for development
    if (envConfig.isDevelopment()) {
      initializeApp({
        projectId: envConfig.getConfig().firebaseProjectId || 'demo-project',
      });
    }
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
// Alias for compatibility with src/config/firebase.ts consumers
export const db = adminDb;
