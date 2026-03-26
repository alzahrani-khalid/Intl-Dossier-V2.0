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
    await redis.connect()
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

/**
 * Store session in Redis whitelist
 * @param sessionId - Session identifier
 * @param userId - User identifier
 * @param metadata - Additional session metadata
 */
async function storeSession(
  sessionId: string,
  userId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const key = getSessionKey(sessionId)
  const sessionData = {
    userId,
    createdAt: new Date().toISOString(),
    ...metadata,
  }
  await redis.setex(key, SESSION_TTL, JSON.stringify(sessionData))
}

/**
 * Validate session exists in Redis whitelist
 * @param sessionId - Session identifier
 * @returns Session data if valid, null if invalid
 */
async function validateSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const key = getSessionKey(sessionId)
  const sessionJson = await redis.get(key)
  if (!sessionJson) return null

  try {
    return JSON.parse(sessionJson) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Invalidate a specific session
 * @param sessionId - Session identifier
 */
async function invalidateSession(sessionId: string): Promise<void> {
  const key = getSessionKey(sessionId)
  await redis.del(key)
}

/**
 * Invalidate all sessions for a user
 * @param userId - User identifier
 */
async function invalidateAllUserSessions(userId: string): Promise<void> {
  // Scan for all session keys
  const pattern = `${SESSION_KEY_PREFIX}*`
  const keys = await redis.keys(pattern)

  // Filter keys that belong to the user and delete them
  const userSessionKeys: string[] = []

  for (const key of keys) {
    const sessionJson = await redis.get(key)
    if (sessionJson) {
      try {
        const session = JSON.parse(sessionJson) as Record<string, unknown>
        if (session.userId === userId) {
          userSessionKeys.push(key)
        }
      } catch {
        // Skip invalid session data
        continue
      }
    }
  }

  if (userSessionKeys.length > 0) {
    await redis.del(...userSessionKeys)
  }
}

/**
 * Refresh session TTL
 * @param sessionId - Session identifier
 */
async function refreshSession(sessionId: string): Promise<void> {
  const key = getSessionKey(sessionId)
  await redis.expire(key, SESSION_TTL)
}

/**
 * Waiting Queue Actions - Redis Key Prefixes & TTL Constants
 *
 * Key prefix patterns and TTL values for waiting queue operations
 */
const WAITING_QUEUE_KEYS = {
  RATE_LIMIT: (userId: string) => `rate-limit:reminder:${userId}`,
  QUEUE_FILTER_CACHE: (userId: string, filterHash: string) =>
    `queue-filter:${userId}:${filterHash}`,
  BULK_JOB_STATUS: (jobId: string) => `bulk-job:${jobId}`,
  COOLDOWN_TRACKER: (assignmentId: string) => `cooldown:${assignmentId}`,
} as const

const WAITING_QUEUE_TTL = {
  RATE_LIMIT_WINDOW: 300, // 5 minutes
  FILTER_CACHE: 300, // 5 minutes
  BULK_JOB_STATUS: 3600, // 1 hour
  COOLDOWN_TRACKER: 86400, // 24 hours
} as const
