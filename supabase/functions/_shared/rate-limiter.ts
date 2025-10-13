/**
 * Rate Limiting Utility for Edge Functions
 * Feature: 019-user-management-access
 * Task: T084
 *
 * Implements token bucket rate limiting with Redis
 * - Admin actions: 10 req/min per IP
 * - Read actions: 60 req/min per IP
 */

import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in window
  keyPrefix?: string; // Optional prefix for Redis keys
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Admin action rate limiter: 10 requests/minute
 */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyPrefix: "ratelimit:admin",
};

/**
 * Read action rate limiter: 60 requests/minute
 */
export const READ_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyPrefix: "ratelimit:read",
};

/**
 * Check rate limit for a given identifier (IP address, user ID, etc.)
 * Uses Redis for distributed rate limiting
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    // Initialize Redis client
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL") || "",
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") || "",
    });

    const key = `${config.keyPrefix || "ratelimit"}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove old entries outside the time window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    if (requestCount >= config.maxRequests) {
      // Get oldest request timestamp to calculate retry time
      const oldestRequests = await redis.zrange(key, 0, 0, {
        withScores: true,
      });
      const oldestTimestamp =
        oldestRequests.length > 0
          ? (oldestRequests[1] as number)
          : now - config.windowMs;

      const resetAt = new Date(oldestTimestamp + config.windowMs);
      const retryAfter = Math.ceil(
        (resetAt.getTime() - now) / 1000
      );

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: retryAfter > 0 ? retryAfter : 1,
      };
    }

    // Add current request to window
    await redis.zadd(key, { score: now, member: `${now}:${crypto.randomUUID()}` });

    // Set expiry on key (cleanup)
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    const remaining = config.maxRequests - requestCount - 1;
    const resetAt = new Date(now + config.windowMs);

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request on error to prevent service disruption
    return {
      allowed: true,
      remaining: 0,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(req: Request): string {
  // Check common headers for client IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take first IP if there are multiple
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback
  return "0.0.0.0";
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
      retry_after: result.retryAfter,
      reset_at: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Limit": "See API documentation",
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Middleware: Apply rate limiting to Edge Function
 */
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const clientIp = getClientIp(req);
  const result = await checkRateLimit(clientIp, config);

  if (!result.allowed) {
    return createRateLimitResponse(result, corsHeaders);
  }

  // Add rate limit headers to successful requests
  req.headers.set("X-RateLimit-Limit", String(config.maxRequests));
  req.headers.set("X-RateLimit-Remaining", String(result.remaining));
  req.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return null; // No error, proceed with request
}
