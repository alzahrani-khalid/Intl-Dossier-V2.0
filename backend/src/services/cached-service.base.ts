/**
 * CachedServiceBase
 *
 * A base class that provides caching functionality using the cache decorators.
 * Services can extend this class to get automatic caching with consistent TTLs.
 *
 * Usage:
 * ```typescript
 * class CountryService extends CachedServiceBase<Country> {
 *   constructor() {
 *     super('country');
 *   }
 *
 *   // Override methods to add business logic
 *   async getById(id: string): Promise<Country | null> {
 *     return this.getCachedById(id, () => this.fetchFromDatabase(id));
 *   }
 * }
 * ```
 */

import { cacheHelpers } from '../config/redis'
import {
  type CacheableEntityType,
  getTTL,
  generateCacheKey,
  getTagsForEntity,
} from '../config/cache-ttl.config'
import { recordCacheHit, recordCacheMiss } from './cache-metrics.service'
import { logDebug, logError } from '../utils/logger'

/**
 * Options for cached operations
 */
export interface CacheOptions {
  /** Custom TTL in seconds (overrides entity type default) */
  ttl?: number
  /** Skip cache for this operation */
  skipCache?: boolean
  /** Tags for invalidation grouping */
  tags?: string[]
  /** Force refresh - bypass cache and update with fresh data */
  forceRefresh?: boolean
}

/**
 * Base class for services that need caching
 */
export abstract class CachedServiceBase<T> {
  protected readonly entityType: CacheableEntityType
  protected readonly defaultTTL: number

  constructor(entityType: CacheableEntityType) {
    this.entityType = entityType
    this.defaultTTL = getTTL(entityType)
  }

  /**
   * Get item by ID with caching
   */
  protected async getCachedById<R = T>(
    id: string,
    fetcher: () => Promise<R | null>,
    options: CacheOptions = {},
  ): Promise<R | null> {
    const startTime = Date.now()

    if (options.skipCache) {
      return fetcher()
    }

    const cacheKey = generateCacheKey(this.entityType, id)

    // Check cache first (unless force refresh)
    if (!options.forceRefresh) {
      try {
        const cached = await cacheHelpers.get<R>(cacheKey)
        if (cached !== null && cached !== undefined) {
          const latency = Date.now() - startTime
          recordCacheHit(this.entityType, latency)
          logDebug(`Cache HIT for ${this.entityType}:${id}`)
          return cached
        }
      } catch (error) {
        logError(`Cache read error for ${this.entityType}:${id}`, error as Error)
      }
    }

    // Fetch from source
    const result = await fetcher()
    const latency = Date.now() - startTime
    recordCacheMiss(this.entityType, latency)

    // Cache the result
    if (result !== null && result !== undefined) {
      try {
        const ttl = options.ttl ?? this.defaultTTL
        await cacheHelpers.set(cacheKey, result, ttl)
        logDebug(`Cache MISS for ${this.entityType}:${id}, cached with TTL=${ttl}s`)
      } catch (error) {
        logError(`Cache write error for ${this.entityType}:${id}`, error as Error)
      }
    }

    return result
  }

  /**
   * Get list with caching
   */
  protected async getCachedList<R = T[]>(
    params: Record<string, unknown>,
    fetcher: () => Promise<R>,
    options: CacheOptions = {},
  ): Promise<R> {
    const startTime = Date.now()

    if (options.skipCache) {
      return fetcher()
    }

    const cacheKey = generateCacheKey(this.entityType, { list: true, ...params })

    // Check cache first (unless force refresh)
    if (!options.forceRefresh) {
      try {
        const cached = await cacheHelpers.get<R>(cacheKey)
        if (cached !== null && cached !== undefined) {
          const latency = Date.now() - startTime
          recordCacheHit(this.entityType, latency)
          logDebug(`Cache HIT for ${this.entityType}:list`)
          return cached
        }
      } catch (error) {
        logError(`Cache read error for ${this.entityType}:list`, error as Error)
      }
    }

    // Fetch from source
    const result = await fetcher()
    const latency = Date.now() - startTime
    recordCacheMiss(this.entityType, latency)

    // Cache the result
    try {
      const ttl = options.ttl ?? this.defaultTTL
      await cacheHelpers.set(cacheKey, result, ttl)
      logDebug(`Cache MISS for ${this.entityType}:list, cached with TTL=${ttl}s`)
    } catch (error) {
      logError(`Cache write error for ${this.entityType}:list`, error as Error)
    }

    return result
  }

  /**
   * Invalidate cache for a specific item
   */
  protected async invalidateById(id: string): Promise<void> {
    try {
      const cacheKey = generateCacheKey(this.entityType, id)
      await cacheHelpers.del(cacheKey)
      logDebug(`Invalidated cache for ${this.entityType}:${id}`)
    } catch (error) {
      logError(`Cache invalidation error for ${this.entityType}:${id}`, error as Error)
    }
  }

  /**
   * Invalidate all list caches for this entity type
   */
  protected async invalidateListCaches(): Promise<void> {
    try {
      const prefix = generateCacheKey(this.entityType, '')
      await cacheHelpers.clearPattern(`${prefix}*list*`)
      logDebug(`Invalidated list caches for ${this.entityType}`)
    } catch (error) {
      logError(`Cache invalidation error for ${this.entityType}:list`, error as Error)
    }
  }

  /**
   * Invalidate all caches for this entity type
   */
  protected async invalidateAllCaches(): Promise<void> {
    try {
      const prefix = generateCacheKey(this.entityType, '')
      await cacheHelpers.clearPattern(`${prefix}*`)
      logDebug(`Invalidated all caches for ${this.entityType}`)
    } catch (error) {
      logError(`Cache invalidation error for ${this.entityType}`, error as Error)
    }
  }

  /**
   * Update cache after a create operation
   */
  protected async onEntityCreated(_entity: T): Promise<void> {
    // Invalidate list caches since there's a new item
    await this.invalidateListCaches()
    logDebug(`Entity created in ${this.entityType}, list caches invalidated`)
  }

  /**
   * Update cache after an update operation
   */
  protected async onEntityUpdated(id: string, entity: T): Promise<void> {
    // Update the specific item cache
    try {
      const cacheKey = generateCacheKey(this.entityType, id)
      await cacheHelpers.set(cacheKey, entity, this.defaultTTL)
      // Also invalidate list caches
      await this.invalidateListCaches()
      logDebug(`Entity updated in ${this.entityType}, caches refreshed`)
    } catch (error) {
      logError(`Cache update error for ${this.entityType}:${id}`, error as Error)
    }
  }

  /**
   * Update cache after a delete operation
   */
  protected async onEntityDeleted(id: string): Promise<void> {
    await this.invalidateById(id)
    await this.invalidateListCaches()
    logDebug(`Entity deleted in ${this.entityType}, caches invalidated`)
  }

  /**
   * Get the cache key for this entity type
   */
  protected getCacheKey(identifier: string | Record<string, unknown>): string {
    return generateCacheKey(this.entityType, identifier)
  }

  /**
   * Get tags for this entity type
   */
  protected getTags(): string[] {
    return getTagsForEntity(this.entityType)
  }
}

/**
 * Utility function to wrap any async function with caching
 */
export async function withCache<T>(
  entityType: CacheableEntityType,
  key: string | Record<string, unknown>,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const startTime = Date.now()

  if (options.skipCache) {
    return fetcher()
  }

  const cacheKey = generateCacheKey(entityType, key)

  // Check cache first (unless force refresh)
  if (!options.forceRefresh) {
    try {
      const cached = await cacheHelpers.get<T>(cacheKey)
      if (cached !== null && cached !== undefined) {
        const latency = Date.now() - startTime
        recordCacheHit(entityType, latency)
        return cached
      }
    } catch (error) {
      logError(`Cache read error for ${entityType}`, error as Error)
    }
  }

  // Fetch from source
  const result = await fetcher()
  const latency = Date.now() - startTime
  recordCacheMiss(entityType, latency)

  // Cache the result
  if (result !== null && result !== undefined) {
    try {
      const ttl = options.ttl ?? getTTL(entityType)
      await cacheHelpers.set(cacheKey, result, ttl)
    } catch (error) {
      logError(`Cache write error for ${entityType}`, error as Error)
    }
  }

  return result
}

/**
 * Utility function to invalidate cache by entity type and ID
 */
export async function invalidateCache(entityType: CacheableEntityType, id?: string): Promise<void> {
  try {
    if (id) {
      const cacheKey = generateCacheKey(entityType, id)
      await cacheHelpers.del(cacheKey)
    } else {
      const prefix = generateCacheKey(entityType, '')
      await cacheHelpers.clearPattern(`${prefix}*`)
    }
  } catch (error) {
    logError(`Cache invalidation error for ${entityType}`, error as Error)
  }
}

export default CachedServiceBase
