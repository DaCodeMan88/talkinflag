// Best-effort per-IP rate limiting for public, unauthenticated POST routes.
//
// This uses an in-memory fixed-window counter. On Vercel serverless that counter
// is PER WARM INSTANCE, not global — so it throttles sustained bursts from a
// single source (the common spam case) but is not a hard global guarantee.
//
// Upgrade path (no changes needed at call sites): if UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN are set, swap this module's body for an
// @upstash/ratelimit-backed implementation that shares state across instances.
// The honeypot + input validation in the routes are the other half of the
// defense and work regardless of store.

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Epoch ms at which the current window resets. */
  reset: number;
}

const buckets = new Map<string, { count: number; reset: number }>();

// Opportunistic cleanup so a long-lived instance can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.reset <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  existing.count += 1;
  return {
    success: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
  };
}

/** Extract the best-guess client IP from a request behind Vercel's proxy. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Seconds until the window resets, for a Retry-After header. */
export function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}
