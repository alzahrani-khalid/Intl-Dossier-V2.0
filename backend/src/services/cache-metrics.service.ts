/**
 * Cache Metrics Service
 *
 * Tracks cache hit/miss rates, latency, and other performance metrics.
 * Provides real-time insights into cache effectiveness.
 */

import { redis } from '../config/redis'
import { logInfo, logError } from '../utils/logger'
import type { CacheableEntityType } from '../config/cache-ttl.config'

/**
 * Metrics data structure for a single entity type
 */
export interface EntityCacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  avgLatencyMs: number
  lastUpdated: string
}

/**
 * Aggregated metrics across all entity types
 */
export interface AggregatedCacheMetrics {
  totalHits: number
  totalMisses: number
  overallHitRate: number
  totalRequests: number
  avgLatencyMs: number
  byEntityType: Record<string, EntityCacheMetrics>
  memoryUsageBytes: number
  connectedClients: number
  uptime: number
  lastReset: string
}

/**
 * Metrics entry for individual cache operation
 */
interface MetricsEntry {
  hits: number
  misses: number
  totalLatencyMs: number
  requestCount: number
}

// In-memory metrics storage with periodic Redis sync
const metricsStore: Map<string, MetricsEntry> = new Map()
const METRICS_KEY_PREFIX = 'cache:metrics:'
const METRICS_SYNC_INTERVAL = 60000 // Sync to Redis every minute
let metricsLastReset = new Date().toISOString()
let syncInterval: NodeJS.Timeout | null = null

/**
 * Initialize metrics service
 */
export function initializeCacheMetrics(): void {
  // Start periodic sync to Redis
  if (!syncInterval) {
    syncInterval = setInterval(syncMetricsToRedis, METRICS_SYNC_INTERVAL)
    logInfo('Cache metrics service initialized')
  }
}

/**
 * Stop metrics service (for graceful shutdown)
 */
export function stopCacheMetrics(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    // Final sync before shutdown
    syncMetricsToRedis().catch((err) => logError('Failed to sync metrics on shutdown', err))
  }
}

/**
 * Record a cache hit
 */
export function recordCacheHit(entityType: CacheableEntityType, latencyMs: number): void {
  const key = entityType
  const entry = metricsStore.get(key) || { hits: 0, misses: 0, totalLatencyMs: 0, requestCount: 0 }
  entry.hits++
  entry.totalLatencyMs += latencyMs
  entry.requestCount++
  metricsStore.set(key, entry)
}

/**
 * Record a cache miss
 */
export function recordCacheMiss(entityType: CacheableEntityType, latencyMs: number): void {
  const key = entityType
  const entry = metricsStore.get(key) || { hits: 0, misses: 0, totalLatencyMs: 0, requestCount: 0 }
  entry.misses++
  entry.totalLatencyMs += latencyMs
  entry.requestCount++
  metricsStore.set(key, entry)
}

/**
 * Get metrics for a specific entity type
 */
export function getEntityMetrics(entityType: CacheableEntityType): EntityCacheMetrics {
  const entry = metricsStore.get(entityType)
  if (!entry) {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      avgLatencyMs: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const totalRequests = entry.hits + entry.misses
  return {
    hits: entry.hits,
    misses: entry.misses,
    hitRate: totalRequests > 0 ? (entry.hits / totalRequests) * 100 : 0,
    totalRequests,
    avgLatencyMs: entry.requestCount > 0 ? entry.totalLatencyMs / entry.requestCount : 0,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get aggregated metrics across all entity types
 */
export async function getAggregatedMetrics(): Promise<AggregatedCacheMetrics> {
  let totalHits = 0
  let totalMisses = 0
  let totalLatency = 0
  let totalRequests = 0
  const byEntityType: Record<string, EntityCacheMetrics> = {}

  // Aggregate in-memory metrics
  for (const [entityType, entry] of metricsStore.entries()) {
    const entityRequests = entry.hits + entry.misses
    totalHits += entry.hits
    totalMisses += entry.misses
    totalLatency += entry.totalLatencyMs
    totalRequests += entityRequests

    byEntityType[entityType] = {
      hits: entry.hits,
      misses: entry.misses,
      hitRate: entityRequests > 0 ? (entry.hits / entityRequests) * 100 : 0,
      totalRequests: entityRequests,
      avgLatencyMs: entry.requestCount > 0 ? entry.totalLatencyMs / entry.requestCount : 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Get Redis server info
  let memoryUsageBytes = 0
  let connectedClients = 0
  let uptime = 0

  try {
    const info = await redis.info()
    const memoryMatch = info.match(/used_memory:(\d+)/)
    const clientsMatch = info.match(/connected_clients:(\d+)/)
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/)

    if (memoryMatch?.[1]) memoryUsageBytes = parseInt(memoryMatch[1], 10)
    if (clientsMatch?.[1]) connectedClients = parseInt(clientsMatch[1], 10)
    if (uptimeMatch?.[1]) uptime = parseInt(uptimeMatch[1], 10)
  } catch (err) {
    logError('Failed to get Redis info', err as Error)
  }

  const allRequests = totalHits + totalMisses
  return {
    totalHits,
    totalMisses,
    overallHitRate: allRequests > 0 ? (totalHits / allRequests) * 100 : 0,
    totalRequests: allRequests,
    avgLatencyMs: totalRequests > 0 ? totalLatency / totalRequests : 0,
    byEntityType,
    memoryUsageBytes,
    connectedClients,
    uptime,
    lastReset: metricsLastReset,
  }
}

/**
 * Reset all metrics
 */
export async function resetMetrics(): Promise<void> {
  metricsStore.clear()
  metricsLastReset = new Date().toISOString()

  // Clear Redis metrics
  try {
    const keys = await redis.keys(`${METRICS_KEY_PREFIX}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    logInfo('Cache metrics reset successfully')
  } catch (err) {
    logError('Failed to reset Redis metrics', err as Error)
  }
}

/**
 * Sync in-memory metrics to Redis for persistence
 */
async function syncMetricsToRedis(): Promise<void> {
  try {
    const pipeline = redis.pipeline()

    for (const [entityType, entry] of metricsStore.entries()) {
      const key = `${METRICS_KEY_PREFIX}${entityType}`
      pipeline.hset(key, {
        hits: entry.hits.toString(),
        misses: entry.misses.toString(),
        totalLatencyMs: entry.totalLatencyMs.toString(),
        requestCount: entry.requestCount.toString(),
        lastUpdated: new Date().toISOString(),
      })
      // Keep metrics for 24 hours
      pipeline.expire(key, 86400)
    }

    await pipeline.exec()
  } catch (err) {
    logError('Failed to sync cache metrics to Redis', err as Error)
  }
}

/**
 * Load metrics from Redis (for service restart recovery)
 */
export async function loadMetricsFromRedis(): Promise<void> {
  try {
    const keys = await redis.keys(`${METRICS_KEY_PREFIX}*`)

    for (const key of keys) {
      const entityType = key.replace(METRICS_KEY_PREFIX, '')
      const data = await redis.hgetall(key)

      if (data && Object.keys(data).length > 0) {
        metricsStore.set(entityType, {
          hits: parseInt(data.hits || '0', 10),
          misses: parseInt(data.misses || '0', 10),
          totalLatencyMs: parseFloat(data.totalLatencyMs || '0'),
          requestCount: parseInt(data.requestCount || '0', 10),
        })
      }
    }

    logInfo(`Loaded cache metrics for ${metricsStore.size} entity types from Redis`)
  } catch (err) {
    logError('Failed to load cache metrics from Redis', err as Error)
  }
}

/**
 * Get a metrics summary as a formatted string (for logging)
 */
export function getMetricsSummary(): string {
  let totalHits = 0
  let totalMisses = 0

  for (const entry of metricsStore.values()) {
    totalHits += entry.hits
    totalMisses += entry.misses
  }

  const total = totalHits + totalMisses
  const hitRate = total > 0 ? ((totalHits / total) * 100).toFixed(2) : '0.00'

  return `Cache Metrics: ${totalHits} hits, ${totalMisses} misses, ${hitRate}% hit rate`
}

// Export a singleton-style access pattern
export const cacheMetrics = {
  initialize: initializeCacheMetrics,
  stop: stopCacheMetrics,
  recordHit: recordCacheHit,
  recordMiss: recordCacheMiss,
  getEntityMetrics,
  getAggregatedMetrics,
  resetMetrics,
  loadFromRedis: loadMetricsFromRedis,
  getSummary: getMetricsSummary,
}

export default cacheMetrics
