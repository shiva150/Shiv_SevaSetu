import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn('Redis retry limit reached, operating without cache');
          return null;
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
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const r = getRedis();
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failure is non-critical
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const r = getRedis();
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch {
    // Cache failure is non-critical
  }
}

export async function redisHealthCheck(): Promise<boolean> {
  try {
    const r = getRedis();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}
