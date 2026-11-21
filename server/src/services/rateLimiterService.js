import redisClient from '../config/redis.js';

const DEFAULT_LIMIT_PER_SECOND = parseInt(process.env.RATE_LIMIT_PER_SECOND_PER_DOMAIN || '5', 10);

/**
 * Check and acquire a rate limit token for a specific destination domain
 * Uses a Redis Sliding Window algorithm with millisecond precision.
 * 
 * @param {string} domain - Hostname of the target destination (e.g. 'api.stripe.com')
 * @param {number} [limitPerSec] - Maximum requests allowed per 1-second window
 * @returns {Promise<{ allowed: boolean, currentCount: number, retryAfterMs: number }>}
 */
export async function checkDomainRateLimit(domain, limitPerSec = DEFAULT_LIMIT_PER_SECOND) {
  const sanitizedDomain = domain.toLowerCase().trim();
  const key = `ratelimit:domain:${sanitizedDomain}`;
  const now = Date.now();
  const windowMs = 1000;
  const clearBefore = now - windowMs;

  try {
    // Multi/Pipeline to guarantee atomicity
    const pipeline = redisClient.pipeline();
    // 1. Remove timestamps outside the sliding window
    pipeline.zremrangebyscore(key, 0, clearBefore);
    // 2. Count requests currently in the window
    pipeline.zcard(key);
    // 3. Set a 5-second TTL on the key to avoid memory leakage
    pipeline.expire(key, 5);

    const results = await pipeline.exec();
    const currentCount = results[1][1];

    if (currentCount < limitPerSec) {
      // Slot is available: register this dispatch timestamp
      await redisClient.zadd(key, now, `${now}-${Math.random()}`);
      return {
        allowed: true,
        currentCount: currentCount + 1,
        retryAfterMs: 0,
      };
    }

    // Rate limit reached for this destination domain
    return {
      allowed: false,
      currentCount,
      retryAfterMs: 1000, // Suggest worker backoff by 1 second
    };
  } catch (error) {
    console.error(`[RateLimiter Error for ${domain}]`, error.message);
    // In case of transient Redis issue, fail-open to avoid stalling the queue completely
    return {
      allowed: true,
      currentCount: 0,
      retryAfterMs: 0,
    };
  }
}
