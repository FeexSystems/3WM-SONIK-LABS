/**
 * 3WM SONIK — QStash Job Callback Handler
 *
 * Receives job completion notifications from QStash and updates job status.
 *
 * Security: this is a server-to-server endpoint that mutates job state, so every request
 * MUST carry a valid `Upstash-Signature`. Previously it had no verification at all and
 * accepted any POST, and no CORS is emitted because a browser must never reach it.
 *
 * Honesty note: the five /api/jobs/* worker endpoints below used to return hardcoded
 * `https://storage.3wmsonik.ai/...` URLs after a setTimeout, which made unimplemented
 * pipelines look successful to callers. They now return 501 until real processing exists.
 */

import { Receiver } from '@upstash/qstash';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const currentSigningKey = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') ?? '';
const nextSigningKey = Deno.env.get('QSTASH_NEXT_SIGNING_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY') ?? '';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verifies the QStash signature over the raw body.
 * Both the current and next signing keys are accepted so key rotation does not drop
 * in-flight callbacks.
 */
async function verifySignature(req: Request, rawBody: string, url: string): Promise<boolean> {
  const signature = req.headers.get('Upstash-Signature');
  if (!signature) return false;

  if (!currentSigningKey) {
    console.error('[JobCallback] QSTASH_CURRENT_SIGNING_KEY not configured — rejecting');
    return false;
  }

  const receiver = new Receiver({
    currentSigningKey,
    nextSigningKey: nextSigningKey || currentSigningKey,
  });

  try {
    return await receiver.verify({ signature, body: rawBody, url });
  } catch (error) {
    console.error('[JobCallback] Signature verification failed:', error);
    return false;
  }
}

interface CallbackBody {
  jobId?: string;
  id?: string;
  status?: string;
  result?: unknown;
  error?: unknown;
}

/** Persists the terminal state of a job. */
async function recordJobCompletion(db: SupabaseClient, body: CallbackBody): Promise<Response> {
  const jobId = body.jobId ?? body.id;
  if (!jobId) {
    return json({ error: 'Job ID is required' }, 400);
  }

  const status = body.status ?? (body.error ? 'failed' : 'completed');

  const { error } = await db
    .from('generation_jobs')
    .update({
      status,
      result: body.result ?? null,
      error: body.error ? String(body.error) : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error(`[JobCallback] Failed to update job ${jobId}:`, error.message);
    // 5xx so QStash retries.
    return json({ error: `Failed to persist job ${jobId}` }, 500);
  }

  console.log(`[JobCallback] Job ${jobId} recorded as ${status}`);
  return json({ success: true, jobId, status });
}

/** Worker endpoints that are declared but not yet implemented. */
const UNIMPLEMENTED_WORKERS = [
  '/api/jobs/stem-separation',
  '/api/jobs/neural-dsp',
  '/api/jobs/ai-video',
  '/api/jobs/batch-export',
];

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Raw body must be read once and reused — reserializing invalidates the signature.
  const rawBody = await req.text();

  if (!(await verifySignature(req, rawBody, req.url))) {
    return json({ error: 'Invalid or missing Upstash-Signature' }, 401);
  }

  if (path.endsWith('/api/jobs/callback')) {
    const db = getSupabase();
    if (!db) {
      console.error('[JobCallback] SUPABASE_URL / SUPABASE_SERVICE_KEY not configured');
      return json({ error: 'Datastore not configured' }, 500);
    }

    let body: CallbackBody;
    try {
      body = JSON.parse(rawBody) as CallbackBody;
    } catch {
      return json({ error: 'Malformed JSON body' }, 400);
    }

    return await recordJobCompletion(db, body);
  }

  if (UNIMPLEMENTED_WORKERS.some((worker) => path.endsWith(worker))) {
    // Returning a fabricated success URL here would make an unimplemented pipeline look
    // like a working one. Fail loudly instead.
    console.warn(`[JobCallback] ${path} is not implemented`);
    return json(
      {
        error: 'Not Implemented',
        message: `${path} has no processing implementation yet.`,
      },
      501
    );
  }

  return json({ error: 'Not Found' }, 404);
});
