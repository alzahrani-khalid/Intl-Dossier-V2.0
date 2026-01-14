/**
 * Infrastructure Ports Index
 *
 * Re-exports all infrastructure port interfaces.
 * These define contracts for infrastructure services.
 */

// Cache
export type {
  ICachePort,
  CacheSetOptions,
  CacheEntry,
  CacheStats,
  CacheKeyBuilder,
} from './cache.port'

export { createCacheKeyBuilder } from './cache.port'

// Logger
export type { ILoggerPort, ILoggerFactory, LogLevel, LogContext } from './logger.port'
