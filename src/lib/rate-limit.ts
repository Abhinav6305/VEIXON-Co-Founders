// Lightweight in-memory rate limiter (fixed window, per process).
// Stops abuse of public/AI routes. For multi-instance production, back this
// with Redis/Upstash and key by org for per-org quotas (Phase 5).

type Hit = { count: number; resetAt: number }
const buckets = new Map<string, Hit>()

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfter: number // seconds
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()
  const h = buckets.get(key)
  if (!h || h.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }
  if (h.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((h.resetAt - now) / 1000)) }
  }
  h.count += 1
  return { ok: true, remaining: limit - h.count, retryAfter: 0 }
}

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/** Standard 429 response with a Retry-After header. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  })
}
