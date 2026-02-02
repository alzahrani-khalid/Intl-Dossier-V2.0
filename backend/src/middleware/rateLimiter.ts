/// <reference path="../types/express.d.ts" />
/**
 * Simple Rate Limiters with Redis Storage
 *
 * This module provides basic rate limiters using Redis for distributed rate limiting.
 * For more advanced features like:
 * - Database-driven rate limit policies
 * - Token bucket algorithm with burst capacity
 * - Per-role and per-endpoint limits
 *
 * @see ./rate-limit.middleware.ts for the full-featured implementation
 *
 * Use this module for simple, fixed rate limits without dynamic configuration.
 */
import rateLimit from 'express-rate-limit'
import { redis, cacheHelpers } from '../config/redis'
import { logWarn, logError } from '../utils/logger'

/**
 * Custom Redis store for express-rate-limit
 * Works with ioredis client
 */
class IoRedisStore {
  private prefix: string
  private windowMs: number

  constructor(options: { prefix?: string; windowMs?: number }) {
    this.prefix = options.prefix || 'rl:'
    this.windowMs = options.windowMs || 60000
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = this.getKey(key)
    const windowSec = Math.ceil(this.windowMs / 1000)

    try {
      // Increment and set expiry atomically using MULTI
      const pipeline = redis.multi()
      pipeline.incr(redisKey)
      pipeline.expire(redisKey, windowSec)
      const results = await pipeline.exec()

      // Get current count from incr result
      const totalHits = (results?.[0]?.[1] as number) || 1
      const ttl = await redis.ttl(redisKey)
      const resetTime = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : this.windowMs))

      return { totalHits, resetTime }
    } catch (error) {
      logError('Redis rate limit increment error', error)
      // Fail open - return low count to allow request
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) }
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.getKey(key)
    try {
      await redis.decr(redisKey)
    } catch (error) {
      logError('Redis rate limit decrement error', error)
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.getKey(key)
    try {
      await redis.del(redisKey)
    } catch (error) {
      logError('Redis rate limit reset error', error)
    }
  }
}

/**
 * Check if Redis is available
 */
async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}

/**
 * Create rate limiter with Redis store if available, fallback to memory
 */
function createRateLimiter(options: {
  windowMs: number
  max: number
  prefix: string
  message: string
  skipSuccessfulRequests?: boolean
  keyGenerator?: (req: any) => string
}) {
  const { windowMs, max, prefix, message, skipSuccessfulRequests, keyGenerator } = options

  // Try to use Redis store
  const store = new IoRedisStore({ prefix, windowMs })

  return rateLimit({
    store,
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logWarn(`Rate limit exceeded for ${prefix}: IP ${req.ip}`)
      const reset = req.rateLimit?.resetTime
      const resetMs =
        typeof reset === 'number'
          ? reset
          : reset instanceof Date
            ? reset.getTime()
            : Date.now() + windowMs
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.max(0, Math.ceil((resetMs - Date.now()) / 1000)),
      })
    },
  })
}

// General API rate limiter - 300 requests per minute
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  prefix: 'rl:api:',
  message: 'Rate limit exceeded. Maximum 300 requests per minute.',
})

// Strict limiter for auth endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'rl:auth:',
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true,
})

// File upload limiter
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  prefix: 'rl:upload:',
  message: 'Upload limit exceeded. Maximum 20 uploads per hour.',
})

// AI/LLM endpoint limiter
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  prefix: 'rl:ai:',
  message: 'AI request limit exceeded. Maximum 10 requests per hour.',
})

// Dynamic rate limiter based on user role - 300 req/min base
export const dynamicLimiter = (role: string) => {
  const limits: Record<string, number> = {
    admin: 1000,
    editor: 500,
    user: 300,
    guest: 50,
  }

  return createRateLimiter({
    windowMs: 60 * 1000,
    max: limits[role] || 300,
    prefix: `rl:${role}:`,
    message: `Rate limit exceeded for ${role}. Maximum ${limits[role] || 300} requests per minute.`,
    keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  })
}

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  dynamicLimiter,
}
