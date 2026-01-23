/**
 * Cache Metrics API Router
 *
 * Provides endpoints for monitoring cache performance:
 * - GET /cache/metrics - Get aggregated cache metrics
 * - GET /cache/metrics/:entityType - Get metrics for specific entity type
 * - POST /cache/reset - Reset all cache metrics
 * - GET /cache/health - Check cache health status
 */

import { Router, Request, Response, NextFunction } from 'express'
import {
  cacheMetrics,
  getEntityMetrics,
  getAggregatedMetrics,
  resetMetrics,
} from '../services/cache-metrics.service'
import { redis, cacheHelpers } from '../config/redis'
import { CACHE_TTL, type CacheableEntityType } from '../config/cache-ttl.config'
import { logInfo, logError } from '../utils/logger'

const router = Router()

/**
 * GET /cache/metrics
 * Get aggregated cache metrics across all entity types
 */
router.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getAggregatedMetrics()

    res.json({
      success: true,
      data: {
        ...metrics,
        ttlConfiguration: CACHE_TTL,
      },
    })
  } catch (error) {
    logError('Error fetching cache metrics', error as Error)
    next(error)
  }
})

/**
 * GET /cache/metrics/:entityType
 * Get metrics for a specific entity type
 */
router.get('/metrics/:entityType', (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityType = req.params.entityType as CacheableEntityType
    const metrics = getEntityMetrics(entityType)
    const ttl = CACHE_TTL[entityType] ?? CACHE_TTL.default

    res.json({
      success: true,
      data: {
        entityType,
        metrics,
        ttlSeconds: ttl,
      },
    })
  } catch (error) {
    logError(`Error fetching metrics for ${req.params.entityType}`, error as Error)
    next(error)
  }
})

/**
 * POST /cache/reset
 * Reset all cache metrics (requires admin permissions)
 */
router.post('/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In production, you'd want to check for admin permissions here
    await resetMetrics()
    logInfo('Cache metrics reset by user')

    res.json({
      success: true,
      message: 'Cache metrics have been reset',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('Error resetting cache metrics', error as Error)
    next(error)
  }
})

/**
 * GET /cache/health
 * Check cache health status
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now()

    // Test Redis connection
    const pingResult = await redis.ping()
    const latencyMs = Date.now() - startTime

    // Get Redis info
    const info = await redis.info()
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
    const connectedClientsMatch = info.match(/connected_clients:(\d+)/)
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/)

    // Get key count
    const keyCount = await redis.dbsize()

    res.json({
      success: true,
      data: {
        status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
        latencyMs,
        memoryUsage: memoryMatch?.[1] ?? 'unknown',
        connectedClients: connectedClientsMatch?.[1] ? parseInt(connectedClientsMatch[1], 10) : 0,
        uptimeSeconds: uptimeMatch?.[1] ? parseInt(uptimeMatch[1], 10) : 0,
        totalKeys: keyCount,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logError('Cache health check failed', error as Error)
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    })
  }
})

/**
 * DELETE /cache/clear/:pattern
 * Clear cache entries matching a pattern (requires admin permissions)
 */
router.delete('/clear/:pattern', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pattern = req.params.pattern || '*'
    // In production, you'd want to check for admin permissions here

    const keysToDelete = await redis.keys(pattern)
    if (keysToDelete.length > 0) {
      await cacheHelpers.del(keysToDelete)
    }

    logInfo(`Cache cleared for pattern: ${pattern}, ${keysToDelete.length} keys deleted`)

    res.json({
      success: true,
      message: `Cleared ${keysToDelete.length} cache entries matching pattern "${pattern}"`,
      keysDeleted: keysToDelete.length,
    })
  } catch (error) {
    logError(`Error clearing cache for pattern ${req.params.pattern}`, error as Error)
    next(error)
  }
})

/**
 * GET /cache/keys/:prefix
 * List cache keys with a specific prefix (for debugging)
 */
router.get('/keys/:prefix', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefix = req.params.prefix || ''
    const limitParam = req.query.limit
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 100

    const keys = await redis.keys(`${prefix}*`)
    const limitedKeys = keys.slice(0, limit)

    // Get TTL for each key
    const keysWithTTL = await Promise.all(
      limitedKeys.map(async (key) => {
        const ttl = await redis.ttl(key)
        return { key, ttlSeconds: ttl }
      }),
    )

    res.json({
      success: true,
      data: {
        prefix,
        totalKeys: keys.length,
        showing: limitedKeys.length,
        keys: keysWithTTL,
      },
    })
  } catch (error) {
    logError(`Error listing cache keys for prefix ${req.params.prefix}`, error as Error)
    next(error)
  }
})

/**
 * GET /cache/summary
 * Get a quick summary of cache performance
 */
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = cacheMetrics.getSummary()
    const metrics = await getAggregatedMetrics()

    res.json({
      success: true,
      data: {
        summary,
        hitRate: `${metrics.overallHitRate.toFixed(2)}%`,
        totalRequests: metrics.totalRequests,
        totalHits: metrics.totalHits,
        totalMisses: metrics.totalMisses,
        avgLatencyMs: metrics.avgLatencyMs.toFixed(2),
        lastReset: metrics.lastReset,
      },
    })
  } catch (error) {
    logError('Error fetching cache summary', error as Error)
    next(error)
  }
})

export default router
