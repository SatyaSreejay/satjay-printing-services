import "server-only";

/**
 * Fixed-window rate limiter.
 *
 * The default store is in memory, which is enough for one server process.
 * On serverless hosting each instance has its own memory, so limits are
 * per instance; swap in a shared store (e.g. Redis/Upstash) by implementing
 * RateLimitStore if stricter limits are needed.
 */
export interface RateLimitStore {
  /** Increment the counter for key and return the new count. */
  incr(key: string, windowMs: number): Promise<number>;
}

class MemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; resetAt: number }>();
  async incr(key: string, windowMs: number) {
    const now = Date.now();
    const cur = this.hits.get(key);
    if (!cur || cur.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      if (this.hits.size > 10_000) this.sweep(now);
      return 1;
    }
    cur.count++;
    return cur.count;
  }
  private sweep(now: number) {
    for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
  }
}

const g = globalThis as unknown as { __rateStore?: RateLimitStore };
export const rateStore: RateLimitStore = (g.__rateStore ??= new MemoryStore());

export interface Limit {
  /** Name of the bucket, e.g. "order". */
  name: string;
  max: number;
  windowMs: number;
}

/** Returns true when every limit still has room for this subject. */
export async function checkLimits(subject: string, limits: Limit[]): Promise<boolean> {
  let ok = true;
  for (const l of limits) {
    const n = await rateStore.incr(`${l.name}:${subject}`, l.windowMs);
    if (n > l.max) ok = false;
  }
  return ok;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
