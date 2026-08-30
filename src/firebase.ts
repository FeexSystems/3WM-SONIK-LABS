/**
 * @deprecated — canonical client is src/lib/firebase.ts
 * This file re-exports it for backward compatibility (MemoryBank, etc.)
 */
export * from './lib/firebase';
export { app, auth, db, ai, geminiModel, analytics, performance as perf } from './lib/firebase';
