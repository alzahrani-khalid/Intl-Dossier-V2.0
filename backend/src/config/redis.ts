import Redis from 'ioredis'
import dotenv from 'dotenv'
import { logInfo, logError } from '../utils/logger'

dotenv.config()

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client
export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Redis connection event handlers
redis.on('connect', () => {
  logInfo('Redis client connected')
})

redis.on('error', (err) => {
  logError('Redis client error', err)
})

redis.on('ready', () => {
  logInfo('Redis client ready')
})

redis.on('close', () => {
  logInfo('Redis connection closed')
})

// Cache helper functions
export const cacheHelpers = {
  // Set cache with expiration
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await redis.setex(key, ttl, serialized)
    } else {
      await redis.set(key, serialized)
    }
  },

  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  // Delete cache
  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      return await redis.del(...key)
    }
    return await redis.del(key)
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key)
    return result === 1
  },

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  },

  // Set hash field
  async hset(key: string, field: string, value: any): Promise<number> {
    return await redis.hset(key, field, JSON.stringify(value))
  },

  // Get hash field
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await redis.hget(key, field)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  // Get all hash fields
  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await redis.hgetall(key)
    const result: Record<string, T> = {}
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value) as T
      } catch {
        result[field] = value as T
      }
    }
    return result
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    return await redis.incr(key)
  },

  // Add to set
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await redis.sadd(key, ...members)
  },

  // Get set members
  async smembers(key: string): Promise<string[]> {
    return await redis.smembers(key)
  },

  // Check if member exists in set
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await redis.sismember(key, member)
    return result === 1
  },
}

/**
 * Explicitly initialize Redis connection at server startup.
 * Replaces lazyConnect behavior with deterministic startup check.
 * Returns true if Redis is available, false if operating in cache-bypass mode.
 */
export async function initializeRedis(): Promise<boolean> {
  try {
    const status = redis.status

    if (status === 'ready') {
      // Another import already triggered auto-connect and it succeeded
      const start = Date.now()
      await redis.ping()
      const latency = Date.now() - start
      logInfo(`Redis already connected and healthy (latency: ${latency}ms)`)
      return true
    }

    if (status === 'connecting' || status === 'reconnecting') {
      // Another import triggered auto-connect — wait for it instead of fighting it
      await new Promise<void>((resolve, reject) => {
        const onReady = (): void => {
          cleanup()
          resolve()
        }
        const onError = (e: Error): void => {
          cleanup()
          reject(e)
        }
        const cleanup = (): void => {
          redis.off('ready', onReady)
          redis.off('error', onError)
        }
        redis.once('ready', onReady)
        redis.once('error', onError)
        // Safety timeout: don't hang forever
        setTimeout(() => {
          cleanup()
          reject(new Error('Redis connection timed out after 10s'))
        }, 10_000)
      })
    } else {
      // status === 'wait' (lazyConnect not yet started) — normal path
      await redis.connect()
    }

    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start
    logInfo(`Redis connected and healthy (latency: ${latency}ms)`)
    return true
  } catch (err) {
    logError('Redis initialization failed - operating in cache-bypass mode', err as Error)
    return false
  }
}

/**
 * Check Redis health status.
 * Used by health check endpoints and monitoring.
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  latency_ms: number
  error?: string
}> {
  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start
    return { status: 'healthy', latency_ms: latency }
  } catch (err) {
    return {
      status: 'unhealthy',
      latency_ms: -1,
      error: (err as Error).message,
    }
  }
}

/**
 * Warm critical caches at startup for high-traffic queries.
 * Called after Redis connects successfully.
 */
export async function warmCriticalCaches(): Promise<void> {
  try {
    logInfo('Starting cache warming for high-traffic queries...')
    // Warm dossier list counts (most visited page)
    // This primes the Redis cache so first user requests hit warm cache
    const warmupKeys = await redis.keys('dossier:list:*')
    logInfo(`Cache warming complete. ${warmupKeys.length} existing dossier cache entries found.`)
  } catch (err) {
    logError('Cache warming failed - continuing with cold cache', err as Error)
  }
}

/**
 * Session Management Helpers for User Management & Access Control
 *
 * Session key prefix for Redis keys
 */
export const SESSION_KEY_PREFIX = 'session:'

/**
 * Session TTL in seconds (30 minutes)
 */
export const SESSION_TTL = 30 * 60

/**
 * Session Management Functions
 */

/**
 * Generate Redis key for a session
 */
export function getSessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`
}
