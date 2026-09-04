import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminDb } from '../lib/firebase-admin';
import { envConfig } from '../config/environment';

async function getOrCreateUser(uid: string, email: string, name?: string, avatar?: string) {
  if (!adminDb) {
    console.warn('Firebase Admin not configured - user management disabled');
    return { uid, email, name: name || '', avatar: avatar || '' };
  }

  const userRef = adminDb.collection('users').doc(uid);
  const doc = await userRef.get();
  const data = {
    uid,
    email,
    name: name || '',
    avatar: avatar || '',
    updatedAt: new Date().toISOString(),
  };
  if (!doc.exists) {
    await userRef.set({ ...data, role: 'Artist', createdAt: new Date().toISOString() });
  } else {
    await userRef.update(data);
  }
  return { ...(doc.data() || {}), ...data };
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Allow unauthenticated demo track requests for instant sandbox studio exploration
  const pathTrackId = (req.params as any)?.id || '';
  if (pathTrackId.startsWith('demo') || req.path.includes('/demo-') || req.path.includes('demo-track-1')) {
    req.user = { uid: 'demo-user', email: 'demo@3wm-sonik.io' } as DecodedIdToken;
    req.dbUser = { uid: 'demo-user', email: 'demo@3wm-sonik.io', name: 'Demo Producer', role: 'Artist' };
    return next();
  }

  // CRITICAL SECURITY FIX: Only allow bypass in explicit development mode with environment variable
  // NEVER allow authentication bypass in production
  const allowDevBypass = process.env.ALLOW_DEV_AUTH_BYPASS === 'true';

  if (allowDevBypass && envConfig.isDevelopment() && !adminAuth) {
    console.warn(
      '⚠️  Development mode: Authentication bypassed (ONLY FOR DEVELOPMENT - NOT FOR PRODUCTION)'
    );
    console.warn('⚠️  Set ALLOW_DEV_AUTH_BYPASS=false for production-like development');
    req.user = { uid: 'dev-user', email: 'dev@3wm.audio' } as DecodedIdToken;
    req.dbUser = { uid: 'dev-user', email: 'dev@3wm.audio', name: 'Dev User', role: 'Artist' };
    return next();
  }

  // CRITICAL: Fail fast if Firebase Admin not configured in production
  if (!adminAuth) {
    console.error('🚨 CRITICAL: Firebase Admin not configured - authentication required');
    return res.status(500).json({
      error: 'Authentication system not configured',
      message: 'Firebase Admin SDK must be configured for authentication to work',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name,
      decodedToken.picture
    );
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token || token === 'demo-token') {
    req.user = { uid: 'demo-user', email: 'demo@3wm-sonik.io' } as DecodedIdToken;
    return next();
  }

  if (!adminAuth) {
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name,
      decodedToken.picture
    );
  } catch {
    // Silently ignore token verification failures for optional authentication
  }
  next();
};
