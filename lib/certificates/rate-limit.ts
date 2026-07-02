import { checkRateLimitAsync } from "@/lib/rate-limit-store";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

export async function checkVerifyRateLimit(key: string): Promise<boolean> {
  return checkRateLimitAsync(key, MAX_ATTEMPTS, WINDOW_MS);
}
