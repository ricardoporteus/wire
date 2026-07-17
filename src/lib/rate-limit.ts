import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Fixed-window rate limiting, atomic in one upsert. Abuse + cost protection on
 * the expensive actions. Credits already cap total spend per org, but not the
 * *rate* (a burst of runs), and not free trial-run abuse via mass org creation —
 * the per-user keys cover that. Fail-open: a limiter error never blocks a real
 * user (this is protection, not a correctness invariant).
 */

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/** Named limits (max hits per window). Generous for real use, tight against abuse. */
export const LIMITS = {
  intel_org: { max: 3, windowSec: 3600 },      // intelligence runs: 3 / org / hour
  intel_user: { max: 5, windowSec: 86_400 },   // intelligence runs: 5 / user / day (trial-abuse guard across orgs)
  generate_org: { max: 20, windowSec: 300 },   // generations: 20 / org / 5 min
  repurpose_org: { max: 12, windowSec: 300 },  // repurpose packs: 12 / org / 5 min
} as const;

export async function rateLimit(key: string, max: number, windowSec: number): Promise<RateLimitResult> {
  try {
    const res = await db.execute(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                     THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                            THEN now() ELSE rate_limits.window_start END
      RETURNING count, EXTRACT(EPOCH FROM (window_start + make_interval(secs => ${windowSec}) - now())) AS retry_after
    `);
    const rows = (res as { rows?: unknown[] }).rows ?? (res as unknown as unknown[]);
    const row = rows[0] as { count: number | string; retry_after: number | string } | undefined;
    if (!row) return { ok: true, retryAfterSec: 0 };
    return {
      ok: Number(row.count) <= max,
      retryAfterSec: Math.max(0, Math.ceil(Number(row.retry_after))),
    };
  } catch {
    return { ok: true, retryAfterSec: 0 }; // fail open
  }
}

/** Check a named limit for an id (org id or clerk user id). */
export function limit(action: keyof typeof LIMITS, id: string): Promise<RateLimitResult> {
  const { max, windowSec } = LIMITS[action];
  return rateLimit(`${action}:${id}`, max, windowSec);
}
