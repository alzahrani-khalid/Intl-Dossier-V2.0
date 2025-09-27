/// <reference path="../types/express.d.ts" />
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logWarn, logError } from '../utils/logger';
import { supabase } from '../db/supabase';
import Redis from 'ioredis';

// Redis client for distributed rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 300; // 300 requests per minute as per requirements

// Interface for rate limit policy from database
interface RateLimitPolicy {
  id: string;
  name: string;
  requests_per_minute: number;
  burst_capacity: number;
  applies_to: 'authenticated' | 'anonymous' | 'role';
  role_id?: string;
  endpoint_type: 'api' | 'upload' | 'report' | 'all';
  retry_after_seconds: number;
  enabled: boolean;
}

// Cache for rate limit policies (5 minute TTL)
let policyCache: Map<string, RateLimitPolicy[]> = new Map();
let cacheExpiry = 0;

// Function to get rate limit policies from database
async function getRateLimitPolicies(): Promise<RateLimitPolicy[]> {
  const now = Date.now();
  
  // Return cached policies if still valid
  if (now < cacheExpiry && policyCache.has('policies')) {
    return policyCache.get('policies')!;
  }
  
  try {
    const { data: policies, error } = await supabase
      .from('rate_limit_policies')
      .select('*')
      .eq('enabled', true);
    
    if (error) {
      logError('Failed to fetch rate limit policies:', error);
      return [];
    }
    
    // Cache policies for 5 minutes
    policyCache.set('policies', policies || []);
    cacheExpiry = now + (5 * 60 * 1000);
    
    return policies || [];
  } catch (error) {
    logError('Error fetching rate limit policies:', error instanceof Error ? error : undefined);
    return [];
  }
}

// Function to get applicable policy for request
async function getApplicablePolicy(req: Request): Promise<RateLimitPolicy | null> {
  const policies = await getRateLimitPolicies();
  const user = (req as any).user;
  const path = req.path;
  
  // Determine endpoint type
  let endpointType: 'api' | 'upload' | 'report' | 'all' = 'all';
  if (path.startsWith('/api/upload') || path.includes('/upload')) {
    endpointType = 'upload';
  } else if (path.startsWith('/api/reports') || path.includes('/report')) {
    endpointType = 'report';
  } else if (path.startsWith('/api/')) {
    endpointType = 'api';
  }
  
  // Find applicable policy
  for (const policy of policies) {
    // Check endpoint type match
    if (policy.endpoint_type !== 'all' && policy.endpoint_type !== endpointType) {
      continue;
    }
    
    // Check applies_to criteria
    if (policy.applies_to === 'authenticated' && !user) {
      continue;
    }
    
    if (policy.applies_to === 'anonymous' && user) {
      continue;
    }
    
    if (policy.applies_to === 'role' && (!user || user.role !== policy.role_id)) {
      continue;
    }
    
    return policy;
  }
  
  return null;
}

// Redis-based rate limiter using token bucket algorithm
class TokenBucketRateLimiter {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async checkLimit(key: string, limit: number, windowMs: number, burstCapacity: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Use Lua script for atomic operations
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local windowMs = tonumber(ARGV[2])
      local burstCapacity = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      local windowStart = now - windowMs
      
      -- Get current bucket state
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or burstCapacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add based on time passed
      local timePassed = now - lastRefill
      local tokensToAdd = math.floor(timePassed / 1000) -- 1 token per second
      tokens = math.min(burstCapacity, tokens + tokensToAdd)
      
      -- Check if request is allowed
      local allowed = tokens >= 1
      local remaining = 0
      local retryAfter = nil
      
      if allowed then
        tokens = tokens - 1
        remaining = tokens
      else
        -- Calculate retry after
        local tokensNeeded = 1 - tokens
        retryAfter = tokensNeeded * 1000 -- milliseconds
      end
      
      -- Update bucket state
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
      
      return {allowed, remaining, now + windowMs, retryAfter}
    `;
    
    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        limit.toString(),
        windowMs.toString(),
        burstCapacity.toString(),
        now.toString()
      ) as [number, number, number, number?];
      
      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetTime: result[2],
        retryAfter: result[3] ? Math.ceil(result[3] / 1000) : undefined
      };
    } catch (error) {
      logError('Redis rate limit error:', error instanceof Error ? error : undefined);
      // Fallback to allowing request
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }
  }
}

const tokenBucketLimiter = new TokenBucketRateLimiter(redis);

// Enhanced rate limiting middleware with database policies
export const dynamicRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip rate limiting for health checks and static assets
    if (req.path === '/health' || req.path === '/api/health' || 
        req.path.startsWith('/static/') || req.path.startsWith('/assets/')) {
      return next();
    }
    
    // Get applicable policy
    const policy = await getApplicablePolicy(req);
    
    if (!policy) {
      // No policy found, use default rate limiting
      return rateLimitMiddleware(req, res, next);
    }
    
    // Generate key for rate limiting
    const user = (req as any).user;
    const userId = user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${ip}`;
    
    // Check rate limit using token bucket
    const result = await tokenBucketLimiter.checkLimit(
      key,
      policy.requests_per_minute,
      RATE_LIMIT_WINDOW_MS,
      policy.burst_capacity
    );
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': policy.requests_per_minute.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
      const retryAfter = result.retryAfter || policy.retry_after_seconds;
      
      logWarn(`Rate limit exceeded for ${userId ? `user:${userId}` : `IP:${ip}`}, Policy: ${policy.name}, Path: ${req.path}`);
      
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Policy: ${policy.name}`,
        retryAfter,
        limit: policy.requests_per_minute,
        remaining: result.remaining,
        policy: policy.name
      });
      return;
    }
    
    next();
  } catch (error) {
    logError('Error in dynamic rate limiting:', error instanceof Error ? error : undefined);
    // Fallback to standard rate limiting
    rateLimitMiddleware(req, res, next);
  }
};

// Create the standard rate limiter middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Maximum 300 requests per minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const reset = req.rateLimit?.resetTime;
    const resetMs =
      typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + RATE_LIMIT_WINDOW_MS;
    const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
    
    logWarn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}, Path: ${req.path}`);
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Maximum 300 requests per minute.',
      retryAfter,
      limit: DEFAULT_RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS
    });
  },
  skip: (req: Request) => {
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    if (req.path.startsWith('/static/') || req.path.startsWith('/assets/')) {
      return true;
    }
    return false;
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `user:${userId}` : `ip:${ip}`;
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many failed authentication attempts. Please try again later.',
    retryAfter: 900
  },
  handler: (req: Request, res: Response) => {
    const reset = req.rateLimit?.resetTime;
    const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + 15 * 60 * 1000;
    const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
    
    logWarn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many failed authentication attempts. Please try again later.',
      retryAfter
    });
  }
});

// File upload rate limiter
export const uploadRateLimitMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Upload limit exceeded',
    message: 'Too many file uploads. Maximum 20 uploads per hour.',
    retryAfter: 3600
  },
  handler: (req: Request, res: Response) => {
    const reset = req.rateLimit?.resetTime;
    const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + 60 * 60 * 1000;
    const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
    
    logWarn(`Upload rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    
    res.status(429).json({
      error: 'Upload limit exceeded',
      message: 'Too many file uploads. Maximum 20 uploads per hour.',
      retryAfter
    });
  }
});

// AI/LLM endpoint rate limiter
export const aiRateLimitMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI requests per hour
  message: {
    error: 'AI request limit exceeded',
    message: 'Too many AI requests. Maximum 10 requests per hour.',
    retryAfter: 3600
  },
  handler: (req: Request, res: Response) => {
    const reset = req.rateLimit?.resetTime;
    const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + 60 * 60 * 1000;
    const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
    
    logWarn(`AI rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    
    res.status(429).json({
      error: 'AI request limit exceeded',
      message: 'Too many AI requests. Maximum 10 requests per hour.',
      retryAfter
    });
  }
});

// Dynamic rate limiter based on user role
export const createRoleBasedRateLimit = (role: string) => {
  const limits: Record<string, number> = {
    admin: 1000,
    editor: 500,
    user: 300,
    guest: 50
  };

  const maxRequests = limits[role] || 300;

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: maxRequests,
    message: {
      error: 'Too many requests',
      message: `Rate limit exceeded for ${role}. Maximum ${maxRequests} requests per minute.`,
      retryAfter: 60
    },
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `user:${userId}:${role}` : `ip:${ip}:${role}`;
    },
    handler: (req: Request, res: Response) => {
      const reset = req.rateLimit?.resetTime;
      const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + RATE_LIMIT_WINDOW_MS;
      const retryAfter = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
      
      logWarn(`Role-based rate limit exceeded for role: ${role}, IP: ${req.ip}, Path: ${req.path}`);
      
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded for ${role}. Maximum ${maxRequests} requests per minute.`,
        retryAfter,
        limit: maxRequests,
        role
      });
    }
  });
};

// Middleware to apply rate limiting based on user role
export const roleBasedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const role = user?.role || 'guest';
    
    const limiter = createRoleBasedRateLimit(role);
    limiter(req, res, next);
  } catch (error) {
    logError('Error in role-based rate limiting:', error instanceof Error ? error : undefined);
    rateLimitMiddleware(req, res, next);
  }
};

// Export all rate limiters
export default {
  dynamicRateLimitMiddleware,
  rateLimitMiddleware,
  authRateLimitMiddleware,
  uploadRateLimitMiddleware,
  aiRateLimitMiddleware,
  createRoleBasedRateLimit,
  roleBasedRateLimit
};
