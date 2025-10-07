/**
 * Search Rate Limiting Middleware
 * Feature: 015-search-retrieval-spec
 * Task: T037
 *
 * Implements rate limiting for search endpoints:
 * - Sliding window: 60 requests per minute per user
 * - Returns HTTP 429 with retry_after header
 * - Bilingual error messages (English + Arabic)
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const SEARCH_RATE_LIMIT_WINDOW = 60000; // 1 minute
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Rate limiting middleware for search endpoints
 */
export function searchRateLimit(req: Request, res: Response, next: NextFunction): void {
  // Get user identifier (user ID or IP address)
  const userId = (req as any).user?.id || req.ip || 'anonymous';

  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // No entry or expired window - create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + SEARCH_RATE_LIMIT_WINDOW,
    });
    next();
    return;
  }

  // Check if rate limit exceeded
  if (entry.count >= SEARCH_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message_en: 'Too many search requests. Please try again later.',
        message_ar: 'عدد كبير جدًا من طلبات البحث. يرجى المحاولة مرة أخرى لاحقًا.',
      },
      retry_after: retryAfter,
      limit: SEARCH_RATE_LIMIT_MAX_REQUESTS,
      window_seconds: SEARCH_RATE_LIMIT_WINDOW / 1000
    });
    return;
  }

  // Increment counter
  entry.count++;
  next();
}

/**
 * Cleanup expired rate limit entries
 * Runs periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(userId);
    }
  }
}, SEARCH_RATE_LIMIT_WINDOW);

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): {
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const entry = rateLimitMap.get(userId);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      remaining: SEARCH_RATE_LIMIT_MAX_REQUESTS,
      resetTime: now + SEARCH_RATE_LIMIT_WINDOW,
      limit: SEARCH_RATE_LIMIT_MAX_REQUESTS
    };
  }

  return {
    remaining: Math.max(0, SEARCH_RATE_LIMIT_MAX_REQUESTS - entry.count),
    resetTime: entry.resetTime,
    limit: SEARCH_RATE_LIMIT_MAX_REQUESTS
  };
}
