type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function memoryCheck(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = memoryBuckets.get(key);

  if (!entry || entry.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

function memoryReset(key: string): void {
  memoryBuckets.delete(key);
}

async function upstashCheck(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return memoryCheck(key, maxAttempts, windowMs);
  }

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;

  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, windowSec, "NX"],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    return memoryCheck(key, maxAttempts, windowMs);
  }

  const data = (await res.json()) as { result?: unknown }[];
  const count = Number(data[0]?.result ?? 0);
  return count <= maxAttempts;
}

export async function checkRateLimitAsync(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashCheck(key, maxAttempts, windowMs);
  }
  return memoryCheck(key, maxAttempts, windowMs);
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  return memoryCheck(key, maxAttempts, windowMs);
}

export function resetRateLimit(key: string): void {
  memoryReset(key);
}
