import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { logSecurityEvent, logWarn } from '../utils/logger'
// Import consolidated rate limiters from single source of truth
import { apiLimiter, authLimiter, uploadLimiter, aiLimiter, dynamicLimiter } from './rateLimiter'

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
// const API_PORT = process.env.PORT || 5000; // Uncomment if needed

// Helper to check if origin is a local network IP
const isLocalNetworkOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin)
    const hostname = url.hostname
    // Check for localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    // Check for private IPv4 ranges: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = hostname.match(ipv4Regex)
    if (match) {
      const [, a, b] = match.map(Number)
      // 10.0.0.0 - 10.255.255.255
      if (a === 10) return true
      // 172.16.0.0 - 172.31.255.255
      if (a === 172 && b >= 16 && b <= 31) return true
      // 192.168.0.0 - 192.168.255.255
      if (a === 192 && b === 168) return true
    }
    return false
  } catch {
    return false
  }
}

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    // In development, allow localhost and local network IPs
    if (NODE_ENV === 'development') {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', // Vite default
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        FRONTEND_URL,
      ]

      // Allow explicit origins, localhost variants, and local network IPs
      if (
        allowedOrigins.includes(origin) ||
        origin?.startsWith('http://localhost:') ||
        isLocalNetworkOrigin(origin)
      ) {
        return callback(null, true)
      }
    }

    // In production, only allow specific domains
    const allowedOrigins = [FRONTEND_URL, process.env.ALLOWED_ORIGINS?.split(',') || []]
      .flat()
      .filter(Boolean)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    logSecurityEvent('CORS violation', 'medium', {
      origin,
      allowedOrigins,
      userAgent: 'Not available in CORS preflight',
    })

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
  ],
  maxAge: 86400, // 24 hours
}

// Helmet configuration for security headers
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || 'https://*.supabase.co'].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
    reportOnly: NODE_ENV === 'development',
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection (deprecated but still useful for older browsers)
  xssFilter: true,

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,

  // X-Download-Options
  ieNoOpen: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },
})

// Rate limiting - consolidated in rateLimiter.ts
// Re-export for backward compatibility
export const generalRateLimit = apiLimiter
export const authRateLimit = authLimiter
export const uploadRateLimit = uploadLimiter
export { aiLimiter, dynamicLimiter }

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logSecurityEvent('IP whitelist violation', 'high', {
        clientIP,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        allowedIPs,
      })

      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. Your IP is not whitelisted.',
      })
      return
    }

    next()
  }
}

// Request size limiter
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10)
    const maxBytes = parseSize(maxSize)

    if (contentLength > maxBytes) {
      logSecurityEvent('Request size limit exceeded', 'medium', {
        contentLength,
        maxBytes,
        path: req.path,
        method: req.method,
        ip: req.ip,
      })

      res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body too large. Maximum size allowed: ${maxSize}`,
      })
      return
    }

    next()
  }
}

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Custom security headers
  res.setHeader('X-API-Version', '1.0')
  res.setHeader('X-Powered-By', 'GASTAT-API')

  // Remove sensitive headers
  res.removeHeader('X-Powered-By')

  // Add custom rate limit info
  res.setHeader('X-RateLimit-Policy', '100;w=900') // 100 requests per 15 minutes

  next()
}

// HTTPS redirect middleware (for production)
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
  // Skip HTTPS redirect for health checks (needed for Docker health checks)
  if (req.path === '/health' || req.path === '/api/health') {
    next()
    return
  }

  if (NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    logWarn('HTTP request redirected to HTTPS', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    })

    return res.redirect(301, `https://${req.get('host')}${req.url}`)
  }

  next()
}

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.get('X-API-Key')
  const validApiKeys = process.env.API_KEYS?.split(',') || []

  // Skip API key validation for public endpoints
  const publicEndpoints = ['/health', '/api/health', '/api/docs']
  if (publicEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
    next()
    return
  }

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    logSecurityEvent('Invalid API key', 'high', {
      providedKey: apiKey ? 'PROVIDED' : 'MISSING',
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    })

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required',
    })
    return
  }

  next()
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode

    // Log based on status code
    if (statusCode >= 400) {
      logSecurityEvent('HTTP error response', statusCode >= 500 ? 'high' : 'medium', {
        method: req.method,
        url: req.url,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
      })
    }
  })

  next()
}

// Utility function to parse size strings
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/)
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }

  const [, value, unit] = match
  return parseFloat(value) * units[unit]
}

// Export all security middleware as a bundle
export const securityMiddleware = {
  cors: cors(corsOptions),
  helmet: helmetConfig,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  aiLimiter,
  dynamicLimiter,
  securityHeaders,
  httpsRedirect,
  requestLogger,
  ipWhitelist,
  validateApiKey,
  requestSizeLimit,
}
