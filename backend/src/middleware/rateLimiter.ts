/// <reference path="../types/express.d.ts" />
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { logWarn } from '../utils/logger';

// General API rate limiter - 300 requests per minute
export const apiLimiter = rateLimit({
  // Temporarily disable Redis store due to compatibility issues
  // store: new RedisStore({
  //   client: redis,
  //   prefix: 'rl:api:',
  //   sendCommand: (...args: string[]) => (redis as any).call(...args)
  // }),
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute as per requirements
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logWarn(`Rate limit exceeded for IP: ${req.ip}`);
    const reset = req.rateLimit?.resetTime;
    const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + 60000;
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Maximum 300 requests per minute.',
      retryAfter: Math.max(0, Math.ceil((resetMs - Date.now()) / 1000))
    });
  }
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  // Temporarily disable Redis store due to compatibility issues
  // store: new RedisStore({
  //   client: redis,
  //   prefix: 'rl:auth:',
  //   sendCommand: (...args: string[]) => (redis as any).call(...args)
  // }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logWarn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// File upload limiter
export const uploadLimiter = rateLimit({
  // Temporarily disable Redis store due to compatibility issues
  // store: new RedisStore({
  //   client: redis,
  //   prefix: 'rl:upload:',
  //   sendCommand: (...args: string[]) => (redis as any).call(...args)
  // }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  handler: (req, res) => {
    logWarn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Upload limit exceeded',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// AI/LLM endpoint limiter
export const aiLimiter = rateLimit({
  // Temporarily disable Redis store due to compatibility issues
  // store: new RedisStore({
  //   client: redis,
  //   prefix: 'rl:ai:',
  //   sendCommand: (...args: string[]) => (redis as any).call(...args)
  // }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI requests per hour
  handler: (req, res) => {
    logWarn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'AI request limit exceeded',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// Dynamic rate limiter based on user role - 300 req/min base
export const dynamicLimiter = (role: string) => {
  const limits: Record<string, number> = {
    admin: 1000, // 1000 requests per minute for admins
    editor: 500, // 500 requests per minute for editors
    user: 300,   // 300 requests per minute for regular users (base requirement)
    guest: 50    // 50 requests per minute for guests
  };

  return rateLimit({
    // Temporarily disable Redis store due to compatibility issues
    // store: new RedisStore({
    //   client: redis,
    //   prefix: `rl:${role}:`,
    //   sendCommand: (...args: string[]) => (redis as any).call(...args)
    // }),
    windowMs: 60 * 1000, // 1 minute window
    max: limits[role] || 300, // Default to 300 req/min
    keyGenerator: (req) => {
      return req.user?.id || req.ip || 'anonymous';
    },
  handler: (req, res) => {
    logWarn(`Rate limit exceeded for role: ${role}, IP: ${req.ip}`);
    const reset = req.rateLimit?.resetTime;
    const resetMs = typeof reset === 'number' ? reset : reset instanceof Date ? reset.getTime() : Date.now() + 60000;
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded for ${role}. Maximum ${limits[role] || 300} requests per minute.`,
      retryAfter: Math.max(0, Math.ceil((resetMs - Date.now()) / 1000))
    });
  }
  });
};

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  dynamicLimiter
};
