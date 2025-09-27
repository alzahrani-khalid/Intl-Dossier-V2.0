import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logInfo, logError } from '../utils/logger';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

// Redis connection event handlers
redis.on('connect', () => {
  logInfo('Redis client connected');
});

redis.on('error', (err) => {
  logError('Redis client error', err);
});

redis.on('ready', () => {
  logInfo('Redis client ready');
});

redis.on('close', () => {
  logInfo('Redis connection closed');
});

// Cache helper functions
export const cacheHelpers = {
  // Set cache with expiration
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  // Delete cache
  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      return await redis.del(...key);
    }
    return await redis.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // Set hash field
  async hset(key: string, field: string, value: any): Promise<number> {
    return await redis.hset(key, field, JSON.stringify(value));
  },

  // Get hash field
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await redis.hget(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  // Get all hash fields
  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await redis.hgetall(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch {
        result[field] = value as T;
      }
    }
    return result;
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    return await redis.incr(key);
  },

  // Add to set
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await redis.sadd(key, ...members);
  },

  // Get set members
  async smembers(key: string): Promise<string[]> {
    return await redis.smembers(key);
  },

  // Check if member exists in set
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await redis.sismember(key, member);
    return result === 1;
  }
};

export default redis;