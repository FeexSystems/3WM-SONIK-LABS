/**
 * 3WM SONIK — Audio Processing Edge Function
 *
 * Fixes applied over the previous version:
 *  - `req.headers.get('Authorization')!` was non-null asserted and then only conditionally
 *    used, so an unauthenticated request fell straight through. A missing header is now 401.
 *  - `supabaseClient.auth.setSession(token)` was a misuse of the API (it expects a session
 *    object, not a bare access token), so the caller's identity was never applied and RLS
 *    evaluated as anon. The client is now constructed with the caller's Authorization header
 *    so row policies actually apply to them.
 *  - The handler returned `https://fake-ai-cdn.com/processed_<file>` as if processing had
 *    succeeded. It now returns 501 rather than reporting a fabricated result.
 */

import { createClient } from '@supabase/supabase-js';
import { preflight, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method Not Allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse(req, { error: 'Unauthorized: missing bearer token' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[ProcessAudio] SUPABASE_URL / SUPABASE_ANON_KEY not configured');
    return jsonResponse(req, { error: 'Service not configured' }, 500);
  }

  // Request-scoped client carrying the caller's JWT so RLS is evaluated as that user.
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse(req, { error: 'Unauthorized: invalid token' }, 401);
  }

  let payload: { type?: string; filePath?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Malformed JSON body' }, 400);
  }

  if (!payload.filePath) {
    return jsonResponse(req, { error: 'filePath is required' }, 400);
  }

  console.log(
    `[ProcessAudio] Request from ${userData.user.id} for ${payload.filePath} (type: ${payload.type ?? 'unspecified'})`
  );

  // No processing backend is wired up yet. Returning a fabricated CDN URL here would make
  // an unimplemented pipeline indistinguishable from a working one.
  return jsonResponse(
    req,
    {
      error: 'Not Implemented',
      message: 'Audio processing backend is not yet connected to this function.',
      file: payload.filePath,
    },
    501
  );
});
