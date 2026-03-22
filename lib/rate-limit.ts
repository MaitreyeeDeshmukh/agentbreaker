/**
 * Simple in-memory sliding-window rate limiter.
 * Works per-IP using headers; resets on server restart (fine for dev + Edge).
 *
 * Usage:
 *   const { allowed, retryAfter } = checkRateLimit(getIP(req), 10, 60_000)
 *   if (!allowed) return rateLimitResponse(retryAfter)
 */

const store = new Map<string, number[]>()

/**
 * @param key        Unique identifier, usually an IP address
 * @param max        Maximum requests allowed within the window
 * @param windowMs   Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const cutoff = now - windowMs

  const hits = (store.get(key) ?? []).filter(t => t > cutoff)

  if (hits.length >= max) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  hits.push(now)
  store.set(key, hits)
  return { allowed: true, retryAfter: 0 }
}

/** Extract the best available IP from a Next.js Request */
export function getIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Standard 429 response */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  )
}
