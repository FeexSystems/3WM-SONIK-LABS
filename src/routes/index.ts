import { Router } from 'express';
import healthRoutes from './health.routes';
import tracksRoutes from './tracks.routes';
import projectsRoutes from './projects.routes';
import vocalRoutes from './vocal.routes';
import dashboardRoutes from './dashboard.routes';
import publicRoutes from './public.routes';
import settingsRoutes from './settings.routes';
import memoryRoutes from './memory.routes';
import n8nRoutes from './n8n.routes';
import exportsRoutes from './exports.routes';
import vectorRoutes from './vector.routes';
import voiceRoutes from './voice.routes';
import billingRoutes from './billing.routes';

const router = Router();

// API Version 1
const v1Router = Router();
v1Router.use('/health', healthRoutes);
v1Router.use('/tracks', tracksRoutes);
v1Router.use('/projects', projectsRoutes);
v1Router.use('/vocal', vocalRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/settings', settingsRoutes);
v1Router.use('/vector-memory', memoryRoutes);
v1Router.use('/n8n', n8nRoutes);
v1Router.use('/vector', vectorRoutes);
v1Router.use('/voice', voiceRoutes);
v1Router.use('/billing', billingRoutes);
v1Router.use('/', exportsRoutes);
v1Router.use('/', publicRoutes);

// Mount versioned API routes
router.use('/v1', v1Router);

// Unversioned alias retained for backward compatibility — /api/voice/* is the path
// documented in the README and used by src/services/geminiTtsService.ts. Both mounts share
// the same router, so the auth/rate-limit/validation guards in voice.routes.ts apply to both.
router.use('/voice', voiceRoutes);

export default router;
