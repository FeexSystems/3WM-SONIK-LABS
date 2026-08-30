/**
 * @deprecated — canonical admin is src/lib/firebase-admin.ts
 * Kept for backward compatibility; server.ts and routes import from here.
 */
export * from '../lib/firebase-admin';
export { adminDb as db, adminAuth } from '../lib/firebase-admin';
