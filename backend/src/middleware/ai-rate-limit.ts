/**
 * AI Rate Limiting Middleware
 * Feature: 033-ai-brief-generation
 * Task: T058
 *
 * Rate limits AI API requests per user and organization:
 * - Per-minute limits for burst protection
 * - Per-day limits for cost control
 * - Organization-wide limits
 */

import { Response, NextFunction } from 'express'
import { redis } from '../config/redis.js'
import { supabaseAdmin } from '../config/supabase.js'
import logger from '../utils/logger.js'

type AuthenticatedRequest = Express.Request

interface RateLimitConfig {
  maxPerMinute: number
  maxPerDay: number
  maxPerOrg?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
  type: 'minute' | 'day' | 'org'
}

const RATE_LIMIT_PREFIX = 'ai:ratelimit:'

// Default limits (can be overridden by org policy)
const DEFAULT_LIMITS: RateLimitConfig = {
  maxPerMinute: 10,
  maxPerDay: 500,
  maxPerOrg: 5000,
}

/**
 * Get rate limit config from organization policy
 */
async function getOrgLimits(organizationId: string): Promise<RateLimitConfig> {
  try {
    const { data: policy } = await supabaseAdmin
      .from('organization_llm_policies')
      .select('max_requests_per_minute, max_requests_per_day')
      .eq('organization_id', organizationId)
      .single()

    if (policy) {
      return {
        maxPerMinute: policy.max_requests_per_minute || DEFAULT_LIMITS.maxPerMinute,
        maxPerDay: policy.max_requests_per_day || DEFAULT_LIMITS.maxPerDay,
        maxPerOrg: DEFAULT_LIMITS.maxPerOrg,
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch org rate limits, using defaults', { organizationId, error })
  }

  return DEFAULT_LIMITS
}

/**
 * Check and increment rate limit counter
 */
async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; current: number; ttl: number }> {
  const multi = redis.multi()

  multi.incr(key)
  multi.ttl(key)

  const results = await multi.exec()

  if (!results) {
    return { allowed: true, current: 0, ttl: windowSeconds }
  }

  const current = (results[0]?.[1] as number) || 0
  let ttl = (results[1]?.[1] as number) || -1

  // Set expiry on first request
  if (ttl === -1) {
    await redis.expire(key, windowSeconds)
    ttl = windowSeconds
  }

  return {
    allowed: current <= limit,
    current,
    ttl,
  }
}

/**
 * Check all rate limits for a user
 */
async function checkAllLimits(
  userId: string,
  organizationId: string,
  limits: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = new Date()

  // Check per-minute limit
  const minuteKey = `${RATE_LIMIT_PREFIX}minute:${userId}:${Math.floor(now.getTime() / 60000)}`
  const minuteResult = await checkRateLimit(minuteKey, limits.maxPerMinute, 60)

  if (!minuteResult.allowed) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now.getTime() + minuteResult.ttl * 1000),
      limit: limits.maxPerMinute,
      type: 'minute',
    }
  }

  // Check per-day limit
  const dayKey = `${RATE_LIMIT_PREFIX}day:${userId}:${now.toISOString().split('T')[0]}`
  const dayResult = await checkRateLimit(dayKey, limits.maxPerDay, 86400)

  if (!dayResult.allowed) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    return {
      allowed: false,
      remaining: 0,
      resetAt: tomorrow,
      limit: limits.maxPerDay,
      type: 'day',
    }
  }

  // Check per-org limit (optional)
  if (limits.maxPerOrg) {
    const orgKey = `${RATE_LIMIT_PREFIX}org:${organizationId}:${now.toISOString().split('T')[0]}`
    const orgResult = await checkRateLimit(orgKey, limits.maxPerOrg, 86400)

    if (!orgResult.allowed) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      return {
        allowed: false,
        remaining: 0,
        resetAt: tomorrow,
        limit: limits.maxPerOrg,
        type: 'org',
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.min(
      limits.maxPerMinute - minuteResult.current,
      limits.maxPerDay - dayResult.current,
    ),
    resetAt: new Date(now.getTime() + minuteResult.ttl * 1000),
    limit: limits.maxPerMinute,
    type: 'minute',
  }
}

/**
 * Rate limiting middleware for AI endpoints
 */
export function aiRateLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id
    const organizationId = req.user?.organization_id

    if (!userId || !organizationId) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
      return
    }

    try {
      const limits = await getOrgLimits(organizationId)
      const result = await checkAllLimits(userId, organizationId, limits)

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString())
      res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining).toString())
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString())

      if (!result.allowed) {
        logger.warn('AI rate limit exceeded', {
          userId,
          organizationId,
          type: result.type,
          limit: result.limit,
        })

        res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          type: result.type,
          resetAt: result.resetAt.toISOString(),
          message:
            result.type === 'minute'
              ? 'Too many requests. Please wait a moment.'
              : result.type === 'day'
                ? 'Daily limit reached. Please try again tomorrow.'
                : 'Organization limit reached. Please contact your administrator.',
        })
        return
      }

      next()
    } catch (error) {
      logger.error('Rate limit check failed', { error, userId })
      // Allow request on rate limit check failure (fail open)
      next()
    }
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  userId: string,
  organizationId: string,
): Promise<{
  minute: { used: number; limit: number; remaining: number }
  day: { used: number; limit: number; remaining: number }
}> {
  const limits = await getOrgLimits(organizationId)
  const now = new Date()

  const minuteKey = `${RATE_LIMIT_PREFIX}minute:${userId}:${Math.floor(now.getTime() / 60000)}`
  const dayKey = `${RATE_LIMIT_PREFIX}day:${userId}:${now.toISOString().split('T')[0]}`

  const [minuteUsed, dayUsed] = await Promise.all([
    redis.get(minuteKey).then((v) => parseInt(v || '0', 10)),
    redis.get(dayKey).then((v) => parseInt(v || '0', 10)),
  ])

  return {
    minute: {
      used: minuteUsed,
      limit: limits.maxPerMinute,
      remaining: Math.max(0, limits.maxPerMinute - minuteUsed),
    },
    day: {
      used: dayUsed,
      limit: limits.maxPerDay,
      remaining: Math.max(0, limits.maxPerDay - dayUsed),
    },
  }
}

export default aiRateLimit
