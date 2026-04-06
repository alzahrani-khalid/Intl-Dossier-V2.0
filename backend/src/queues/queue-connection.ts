import Redis from 'ioredis'

/**
 * Dedicated Redis connection for BullMQ queues.
 *
 * CRITICAL (D-03): Do NOT reuse the Redis client from config/redis.ts.
 * BullMQ requires maxRetriesPerRequest: null which is incompatible
 * with the cache client's maxRetriesPerRequest: 3.
 */
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const queueConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})
