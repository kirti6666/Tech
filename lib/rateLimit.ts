/**
 * Sliding-window rate limiter.
 *
 * Uses Upstash Redis when configured and falls back to an in-process Map
 * otherwise. Be clear-eyed about the fallback: serverless runs many
 * instances, each with its own Map, so the effective limit is roughly the
 * configured limit times the instance count. That is fine for development
 * and for slowing down a casual abuser; it is not a real limit.
 *
 * For the download route specifically, the in-memory version is a
 * convenience, not the protection — the real protection is the atomic
 * download counter on the licence, which is in the database and therefore
 * shared across every instance.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, number[]>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      return await redisLimit(key, limit, windowSeconds);
    } catch (error) {
      // A rate limiter that fails closed takes the site down with it. Log
      // and fall through to the local one.
      console.error("[rateLimit] Redis unavailable, falling back:", error);
    }
  }
  return memoryLimit(key, limit, windowSeconds);
}

async function redisLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const pipeline = [
    ["ZREMRANGEBYSCORE", key, "0", String(windowStart)],
    ["ZADD", key, String(now), `${now}-${Math.random()}`],
    ["ZCARD", key],
    ["EXPIRE", key, String(windowSeconds)],
  ];

  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Redis responded ${response.status}`);

  const results = (await response.json()) as { result: number }[];
  const count = Number(results[2]?.result ?? 0);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowSeconds * 1000,
  };
}

function memoryLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const hits = (memory.get(key) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  memory.set(key, hits);

  // Cheap eviction so a long-lived instance doesn't accumulate dead keys.
  if (memory.size > 5000) {
    for (const [k, times] of memory) {
      if (!times.some((t) => t > windowStart)) memory.delete(k);
    }
  }

  return {
    allowed: hits.length <= limit,
    remaining: Math.max(0, limit - hits.length),
    resetAt: now + windowSeconds * 1000,
  };
}
