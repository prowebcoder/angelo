import { headers } from 'next/headers'

type Bucket = { count: number; resetAt: number }

/**
 * Fixed-window rate limiter.
 *
 * Deliberately in-memory and dependency-free. The important caveat: on
 * serverless each instance keeps its own counters, so this throttles casual
 * abuse rather than a distributed attack. `checkRateLimit` is the single seam
 * to swap for Redis/Upstash or Vercel's firewall when the boutique needs it.
 */
const buckets = new Map<string, Bucket>()

const MAX_TRACKED_KEYS = 5000

const sweep = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

export const rateLimit = (key: string, limit: number, windowSeconds: number): RateLimitResult => {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    // Bound memory growth before inserting a new key.
    if (buckets.size >= MAX_TRACKED_KEYS) sweep(now)
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { ok: true }
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) }
  }

  existing.count += 1
  return { ok: true }
}

/**
 * Best-effort client identity from proxy headers.
 *
 * These headers are spoofable in general; behind Vercel or another trusted
 * proxy the left-most `x-forwarded-for` entry is set by the platform.
 */
export const clientIdentifier = async (): Promise<string> => {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headerList.get('x-real-ip') ?? 'unknown'
}

/** Per-form limiter used by every submission action. */
export const checkRateLimit = async (
  form: string,
  { limit = 5, windowSeconds = 600 }: { limit?: number; windowSeconds?: number } = {},
): Promise<RateLimitResult> => {
  const identifier = await clientIdentifier()
  return rateLimit(`${form}:${identifier}`, limit, windowSeconds)
}
