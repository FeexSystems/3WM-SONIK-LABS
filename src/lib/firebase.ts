import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

import type { FirebaseOptions } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';

/**
 * Build the Firebase client config.
 * In Vite, browser env vars must be prefixed with VITE_ and are available
 * on import.meta.env at build time. We read them directly here so the
 * client bundle always has the values baked in.
 */
function getClientFirebaseConfig(): FirebaseOptions | null {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return null;
  }

  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

const firebaseConfig = getClientFirebaseConfig();

// Only initialize Firebase if configuration is available
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;
let githubAuthProvider: GithubAuthProvider | null = null;
let twitterAuthProvider: TwitterAuthProvider | null = null;
let facebookAuthProvider: FacebookAuthProvider | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let functions: ReturnType<typeof getFunctions> | null = null;
let analytics: ReturnType<typeof getAnalytics> | null = null;
let performance: ReturnType<typeof getPerformance> | null = null;
let ai: ReturnType<typeof getAI> | null = null;
let geminiModel: ReturnType<typeof getGenerativeModel> | null = null;
let appCheck: AppCheck | null = null;

if (firebaseConfig) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleAuthProvider = new GoogleAuthProvider();
  githubAuthProvider = new GithubAuthProvider();
  twitterAuthProvider = new TwitterAuthProvider();
  facebookAuthProvider = new FacebookAuthProvider();
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // App Check initialization
  if (typeof window !== 'undefined') {
    const recaptchaKey =
      import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (import.meta.env.DEV) {
      // Enable debug provider in local development
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    if (recaptchaKey && app) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('Firebase App Check initialization skipped:', err);
      }
    }
  }

  // AI — consolidated from src/firebase.ts (was separate client)
  try {
    ai = getAI(app, { backend: new GoogleAIBackend() });
    geminiModel = getGenerativeModel(ai, { model: 'gemini-3.7-flash' });
  } catch (e) {
    console.warn('Firebase AI not available', e);
  }

  // Initialize Analytics conditionally (only supported in browser environments)
  void isAnalyticsSupported()
    .then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
        performance = getPerformance(app);
      }
    })
    .catch((err) => {
      console.warn('Failed to initialize analytics', err);
    });
} else {
  console.warn('Firebase client configuration not available - Firebase features will be disabled');
}

export {
  app,
  auth,
  googleAuthProvider,
  githubAuthProvider,
  twitterAuthProvider,
  facebookAuthProvider,
  db,
  storage,
  functions,
  analytics,
  performance,
  ai,
  geminiModel,
  appCheck,
};
