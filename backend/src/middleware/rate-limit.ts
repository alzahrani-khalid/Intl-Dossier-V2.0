/**
 * Simple In-Memory Rate Limiter for Preferences
 *
 * This is a lightweight, in-memory rate limiter specifically for user preferences.
 * It does NOT work across multiple server instances.
 *
 * For distributed rate limiting, use:
 * - ./rateLimiter.ts for simple Redis-backed limits
 * - ./rate-limit.middleware.ts for full-featured limits with DB policies
 */
import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60

export function rateLimitPreferences(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).user?.id || req.ip

  if (!userId) {
    next()
    return
  }

  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    next()
    return
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many preference updates. Please try again later.',
      retryAfter,
    })
    return
  }

  entry.count++
  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [userId, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(userId)
    }
  }
}, RATE_LIMIT_WINDOW)
