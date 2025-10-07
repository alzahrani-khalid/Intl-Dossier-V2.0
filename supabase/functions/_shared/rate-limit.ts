import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  // Authenticated users: 300 requests per minute
  USER: {
    requests: 300,
    windowMs: 60 * 1000, // 1 minute
  },
  // Anonymous users: 60 requests per minute
  ANON: {
    requests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // Global ceiling: 15,000 requests per minute
  GLOBAL: {
    requests: 15000,
    windowMs: 60 * 1000, // 1 minute
  },
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  key: string;
  count: number;
  window_start: string;
  expires_at: string;
}

/**
 * Rate Limiter using Supabase as storage backend
 *
 * Implements sliding window algorithm with per-user and global limits.
 * Supports both authenticated and anonymous users.
 */
export class RateLimiter {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check and consume rate limit for a request
   *
   * @param userId - User ID (auth.uid()) or 'anon' for anonymous
   * @param ipAddress - Client IP address for anonymous tracking
   * @returns Rate limit check result
   */
  async checkLimit(
    userId: string | null,
    ipAddress?: string
  ): Promise<RateLimitResult> {
    const isAuthenticated = !!userId;
    const limit = isAuthenticated ? RATE_LIMITS.USER : RATE_LIMITS.ANON;

    // Determine the rate limit key
    const key = isAuthenticated ? `user:${userId}` : `ip:${ipAddress}`;

    if (!key) {
      // If no identifier available, deny the request
      return {
        allowed: false,
        remaining: 0,
        limit: limit.requests,
        retryAfter: Math.ceil(limit.windowMs / 1000),
      };
    }

    try {
      // Check global rate limit first
      const globalResult = await this.checkGlobalLimit();
      if (!globalResult.allowed) {
        return globalResult;
      }

      // Check user/IP specific limit
      const now = new Date();
      const windowStart = new Date(now.getTime() - limit.windowMs);

      // Clean up expired entries
      await this.supabase
        .from("rate_limits")
        .delete()
        .lt("expires_at", now.toISOString());

      // Get current count for this key
      const { data: existing, error: fetchError } = await this.supabase
        .from("rate_limits")
        .select("*")
        .eq("key", key)
        .gte("window_start", windowStart.toISOString())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found" which is expected for new keys
        console.error("Rate limit fetch error:", fetchError);
        // Fail open - allow the request but log the error
        return {
          allowed: true,
          remaining: limit.requests,
          limit: limit.requests,
        };
      }

      const currentCount = existing?.count || 0;

      if (currentCount >= limit.requests) {
        // Rate limit exceeded
        const expiresAt = new Date(existing.window_start);
        expiresAt.setMilliseconds(expiresAt.getMilliseconds() + limit.windowMs);
        const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);

        return {
          allowed: false,
          remaining: 0,
          limit: limit.requests,
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      // Increment the counter
      if (existing) {
        // Update existing entry
        await this.supabase
          .from("rate_limits")
          .update({
            count: currentCount + 1,
            expires_at: new Date(now.getTime() + limit.windowMs).toISOString(),
          })
          .eq("key", key);
      } else {
        // Create new entry
        await this.supabase.from("rate_limits").insert({
          key,
          count: 1,
          window_start: now.toISOString(),
          expires_at: new Date(now.getTime() + limit.windowMs).toISOString(),
        });
      }

      return {
        allowed: true,
        remaining: limit.requests - currentCount - 1,
        limit: limit.requests,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Fail open - allow the request but log the error
      return {
        allowed: true,
        remaining: limit.requests,
        limit: limit.requests,
      };
    }
  }

  /**
   * Check global rate limit across all users
   */
  private async checkGlobalLimit(): Promise<RateLimitResult> {
    const limit = RATE_LIMITS.GLOBAL;
    const key = "global:all";

    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - limit.windowMs);

      // Get current global count
      const { data: existing, error: fetchError } = await this.supabase
        .from("rate_limits")
        .select("*")
        .eq("key", key)
        .gte("window_start", windowStart.toISOString())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Global rate limit fetch error:", fetchError);
        // Fail open
        return {
          allowed: true,
          remaining: limit.requests,
          limit: limit.requests,
        };
      }

      const currentCount = existing?.count || 0;

      if (currentCount >= limit.requests) {
        // Global rate limit exceeded
        const expiresAt = new Date(existing.window_start);
        expiresAt.setMilliseconds(expiresAt.getMilliseconds() + limit.windowMs);
        const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);

        return {
          allowed: false,
          remaining: 0,
          limit: limit.requests,
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      // Increment global counter
      if (existing) {
        await this.supabase
          .from("rate_limits")
          .update({
            count: currentCount + 1,
            expires_at: new Date(now.getTime() + limit.windowMs).toISOString(),
          })
          .eq("key", key);
      } else {
        await this.supabase.from("rate_limits").insert({
          key,
          count: 1,
          window_start: now.toISOString(),
          expires_at: new Date(now.getTime() + limit.windowMs).toISOString(),
        });
      }

      return {
        allowed: true,
        remaining: limit.requests - currentCount - 1,
        limit: limit.requests,
      };
    } catch (error) {
      console.error("Global rate limiter error:", error);
      // Fail open
      return {
        allowed: true,
        remaining: limit.requests,
        limit: limit.requests,
      };
    }
  }
}

/**
 * Middleware function to apply rate limiting to Edge Functions
 *
 * Usage:
 * ```typescript
 * import { applyRateLimit } from "../_shared/rate-limit.ts";
 *
 * Deno.serve(async (req: Request) => {
 *   const rateLimitResult = await applyRateLimit(req);
 *   if (!rateLimitResult.allowed) {
 *     return new Response(
 *       JSON.stringify({ error: "Rate limit exceeded" }),
 *       {
 *         status: 429,
 *         headers: {
 *           ...corsHeaders,
 *           "Content-Type": "application/json",
 *           "X-RateLimit-Limit": rateLimitResult.limit.toString(),
 *           "X-RateLimit-Remaining": "0",
 *           "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
 *         },
 *       }
 *     );
 *   }
 *
 *   // Continue with request processing
 * });
 * ```
 */
export async function applyRateLimit(
  req: Request
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Rate limiter configuration missing");
    // Fail open if configuration is missing
    return {
      allowed: true,
      remaining: RATE_LIMITS.USER.requests,
      limit: RATE_LIMITS.USER.requests,
    };
  }

  // Extract user ID from Authorization header
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      // Decode JWT to get user ID (without verification since this is just for rate limiting)
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || null;
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
  }

  // Get client IP address (considering proxy headers)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";

  const limiter = new RateLimiter(supabaseUrl, supabaseServiceKey);
  return await limiter.checkLimit(userId, ipAddress);
}

/**
 * Helper function to create rate limit error response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again later.",
      retry_after: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "Retry-After": result.retryAfter?.toString() || "60",
      },
    }
  );
}