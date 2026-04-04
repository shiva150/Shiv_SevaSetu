import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

// Redis is optional — when REDIS_URL is empty the cache layer silently no-ops.
const redisEnabled = Boolean(env.REDIS_URL && !env.REDIS_URL.includes('localhost'));

function getRedis(): Redis | null {
  if (!redisEnabled) return null;

  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn('Redis retry limit reached — operating without cache');
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.warn('Redis error', { error: err.message }));
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    const data = await r.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failure is non-critical
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    const keys = await r.keys(pattern);
    if (keys.length > 0) await r.del(...keys);
  } catch {
    // Cache failure is non-critical
  }
}

export async function redisHealthCheck(): Promise<boolean> {
  try {
    const r = getRedis();
    if (!r) return false;
    await r.ping();
    return true;
  } catch {
    return false;
  }
}
