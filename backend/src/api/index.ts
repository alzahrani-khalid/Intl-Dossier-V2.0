import { Router } from 'express'
import authRouter from './auth'
import countriesRouter from './countries'
import mouRouter from './mous'
import eventsRouter from './events'
// AI router disabled in production due to ONNX Runtime incompatibility with Alpine Linux
// import aiRouter from './ai'
import documentsRouter from './documents'
// Search router disabled due to AI/ONNX dependencies
// import searchRouter from './search'
import relationshipsRouter from './relationships'
import organizationsRouter from './organizations'
import contactsRouter from './contacts'
import tasksRouter from './tasks'
import taskContributorsRouter from './task-contributors'
import commitmentsRouter from './commitments'
import intelligenceRouter from './intelligence'
import positionsRouter from './positions'
import permissionsRouter from './permissions'
import signaturesRouter from './signatures'
// Voice router disabled in production due to ONNX Runtime incompatibility with Alpine Linux
// import voiceRouter from './voice'
import afterActionRouter from './after-action'
import intakeEntityLinksRouter from './intake-entity-links'
import entitySearchRouter from './entity-search'
import cacheMetricsRouter from './cache-metrics'
import { authenticateToken } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'
import { logApiRequest, logError } from '../utils/logger'

const apiRouter = Router()

// Apply general API rate limiting
apiRouter.use(apiLimiter)

// Request logging middleware
apiRouter.use((req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    logApiRequest(req.method, req.originalUrl, res.statusCode, duration)
  })

  next()
})

// Health check (no auth required)
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api',
  })
})

// Public auth routes (no auth required)
apiRouter.use('/auth', authRouter)

// Public search route disabled due to AI/ONNX dependencies
// apiRouter.use('/search', searchRouter)

// AI routes disabled in production due to ONNX Runtime incompatibility
// apiRouter.use('/ai', aiRouter)

// Protected routes (require authentication)
apiRouter.use(authenticateToken)

// Protected API routes
apiRouter.use('/countries', countriesRouter)
apiRouter.use('/mous', mouRouter)
apiRouter.use('/events', eventsRouter)
apiRouter.use('/documents', documentsRouter)
apiRouter.use('/relationships', relationshipsRouter)
apiRouter.use('/organizations', organizationsRouter)
apiRouter.use('/contacts', contactsRouter)
apiRouter.use('/tasks', tasksRouter)
apiRouter.use('/task-contributors', taskContributorsRouter)
apiRouter.use('/commitments', commitmentsRouter)
apiRouter.use('/intelligence', intelligenceRouter)
apiRouter.use('/positions', positionsRouter)
apiRouter.use('/permissions', permissionsRouter)
apiRouter.use('/signatures', signaturesRouter)
// Voice routes disabled in production due to ONNX Runtime incompatibility
// apiRouter.use('/voice', voiceRouter)
apiRouter.use('/after-action', afterActionRouter)

// Intake Entity Linking routes
apiRouter.use(intakeEntityLinksRouter)
apiRouter.use(entitySearchRouter)

// Cache metrics routes
apiRouter.use('/cache', cacheMetricsRouter)

// API 404 handler
apiRouter.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
    path: req.originalUrl,
  })
})

// API Error handler
apiRouter.use((err: any, req: any, res: any, _next: any) => {
  logError('API Error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  })

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || [],
    })
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
  }

  // Handle permission errors
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions',
    })
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

export default apiRouter
