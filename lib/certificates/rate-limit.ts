const verifyAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

export function checkVerifyRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = verifyAttempts.get(key);

  if (!entry || entry.resetAt < now) {
    verifyAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}
