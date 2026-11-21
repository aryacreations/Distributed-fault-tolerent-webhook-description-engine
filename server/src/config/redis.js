import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisOptions(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null, // Mandatory for BullMQ
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      tls: urlStr.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    };
  } catch (err) {
    console.warn('[Redis Config] Failed to parse URL, falling back to defaults:', err.message);
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

/**
 * Common parsed Redis connection options required by BullMQ
 */
export const redisConnectionOptions = parseRedisOptions(redisUrl);

/**
 * Shared Redis client instance for rate-limiting and auxiliary operations
 */
export const redisClient = new Redis(redisConnectionOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connection established');
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

export default redisClient;
