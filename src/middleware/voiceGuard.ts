/**
 * 3WM SONIK — Voice API Abuse & Spend Guards
 *
 * The /api/v1/voice/* routes stay reachable without authentication so the pre-login
 * landing demo keeps working. That makes them a direct cost-amplification vector into
 * paid Gemini reasoning + TTS, so this module supplies the two guards that must hold
 * regardless of infrastructure state:
 *
 *  1. `voiceIpRateLimit` — an in-process express-rate-limit limiter. This is deliberately
 *     NOT the Redis-backed limiter from `redisRateLimit.ts`: that one is fail-open (it
 *     calls next() when Redis is unreachable), so with no Redis provisioned it enforces
 *     nothing. A memory limiter always enforces on the instance actually serving traffic.
 *  2. `voiceBudgetGuard` — a coarse daily call counter. When the cap is hit the request is
 *     still served, but `isVoiceBudgetExhausted(req)` reports true so the route skips the
 *     paid provider and returns its existing offline fallback (which the client already
 *     handles by falling back to Web Speech / Web Audio synthesis).
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../lib/redis';

const SECONDS_PER_DAY = 60 * 60 * 24;

/** Default daily ceiling on paid voice generations across all anonymous callers. */
const DEFAULT_DAILY_CALL_CAP = 500;

function dailyCallCap(): number {
  const parsed = Number.parseInt(process.env.VOICE_DAILY_CALL_CAP ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_CALL_CAP;
}

/**
 * Per-IP limiter for the unauthenticated voice endpoints.
 * Tighter than `ipBasedRateLimitMemory` (100/15min) because each request can trigger both
 * a reasoning call and a TTS synthesis call.
 */
export const voiceIpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: 'Too many voice requests from this IP. Please try again in a few minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

// ==========================================
// Daily spend cap
// ==========================================

interface LocalCounter {
  day: string;
  count: number;
}

/** Fallback counter used when Redis is not reachable. Resets on process restart. */
const localCounter: LocalCounter = { day: '', count: 0 };

function utcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Increment today's counter and report whether the cap has now been exceeded.
 * Redis is used when available so the cap holds across instances; otherwise the
 * per-process counter applies.
 */
async function incrementAndCheck(now: Date): Promise<boolean> {
  const day = utcDayKey(now);
  const cap = dailyCallCap();

  if (redisClient.isReady()) {
    const key = `voice:daily:${day}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, SECONDS_PER_DAY);
    }
    return count > cap;
  }

  if (localCounter.day !== day) {
    localCounter.day = day;
    localCounter.count = 0;
  }
  localCounter.count += 1;
  return localCounter.count > cap;
}

interface VoiceBudgetRequest extends Request {
  voiceBudgetExhausted?: boolean;
}

/**
 * Marks the request when the daily paid-generation cap is exhausted.
 * Never rejects the request — the routes degrade to their offline fallbacks instead, so a
 * budget ceiling looks like "provider unavailable" to the client rather than an error.
 */
export const voiceBudgetGuard = async (
  req: VoiceBudgetRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.voiceBudgetExhausted = await incrementAndCheck(new Date());
    if (req.voiceBudgetExhausted) {
      console.warn(
        `[VoiceGuard] Daily voice generation cap (${dailyCallCap()}) reached — serving offline fallback.`
      );
    }
  } catch (error) {
    // Fail closed on the *paid* path: if the counter is broken we still serve the
    // request, but without spending on the provider.
    console.error('[VoiceGuard] Budget check failed, degrading to fallback:', error);
    req.voiceBudgetExhausted = true;
  }
  next();
};

/** True when this request must not call the paid voice provider. */
export function isVoiceBudgetExhausted(req: Request): boolean {
  return (req as VoiceBudgetRequest).voiceBudgetExhausted === true;
}
