/**
 * 3WM SONIK — Shared CORS helper for Supabase edge functions.
 *
 * Replaces the `Access-Control-Allow-Origin: '*'` that every function previously hardcoded.
 * A wildcard on an endpoint that accepts an Authorization header lets any origin drive
 * authenticated calls on a visitor's behalf, so the origin is echoed back only when it
 * appears in the configured allowlist.
 *
 * Configure with `ALLOWED_ORIGINS` as a comma-separated list, e.g.
 *   ALLOWED_ORIGINS=https://3wmsonik.ai,https://staging.3wmsonik.ai,http://localhost:3000
 */

function allowlist(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Builds response headers for a request. Returns no CORS headers at all when the request
 * origin is absent (server-to-server) or not allowlisted — the browser then blocks the read.
 */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (!origin) return {};

  const allowed = allowlist();
  if (!allowed.includes(origin)) {
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // Caches must not serve one origin's response to another.
    Vary: 'Origin',
    'Access-Control-Max-Age': '3600',
  };
}

/** Standard preflight response. */
export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(req) });
}

/** JSON response with the correct CORS headers for this request. */
export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
  });
}
