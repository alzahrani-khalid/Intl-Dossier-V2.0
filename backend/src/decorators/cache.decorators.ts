/**
 * Cache Decorators
 *
 * TypeScript decorators for declarative caching:
 * - @Cacheable: Automatically cache method results
 * - @CacheInvalidate: Invalidate cache on write operations
 * - @CachePut: Update cache with method result
 *
 * Usage:
 * ```typescript
 * class DossierService {
 *   @Cacheable({ entityType: 'dossier', keyGenerator: (id) => id })
 *   async getById(id: string): Promise<Dossier> { ... }
 *
 *   @CacheInvalidate({ entityType: 'dossier', keyGenerator: (id) => id })
 *   async update(id: string, data: Partial<Dossier>): Promise<Dossier> { ... }
 * }
 * ```
 */

import { cacheHelpers } from '../config/redis'
import {
  type CacheableEntityType,
  getTTL,
  generateCacheKey,
  getTagsForEntity,
  CACHE_KEY_PREFIX,
} from '../config/cache-ttl.config'
import { recordCacheHit, recordCacheMiss } from '../services/cache-metrics.service'
import { logError, logDebug } from '../utils/logger'

/**
 * Options for @Cacheable decorator
 */
export interface CacheableOptions {
  /** Entity type for TTL and key prefix lookup */
  entityType: CacheableEntityType
  /** Custom TTL in seconds (overrides entity type default) */
  ttl?: number
  /** Function to generate cache key from method arguments */
  keyGenerator?: (...args: unknown[]) => string
  /** Additional tags for invalidation grouping */
  tags?: string[]
  /** Cache condition - return false to skip caching */
  condition?: (...args: unknown[]) => boolean
  /** Transform result before caching (e.g., to exclude sensitive data) */
  transformer?: (result: unknown) => unknown
  /** Skip cache on specific errors */
  skipOnError?: boolean
}

/**
 * Options for @CacheInvalidate decorator
 */
export interface CacheInvalidateOptions {
  /** Entity type for key prefix lookup */
  entityType: CacheableEntityType
  /** Function to generate cache key(s) to invalidate from method arguments */
  keyGenerator?: (...args: unknown[]) => string | string[]
  /** Invalidate all keys matching a pattern */
  pattern?: string | ((...args: unknown[]) => string)
  /** Invalidate by tags */
  tags?: string[]
  /** When to invalidate: 'before' or 'after' method execution */
  timing?: 'before' | 'after'
  /** Invalidate related entity types as well */
  invalidateRelated?: CacheableEntityType[]
}

/**
 * Options for @CachePut decorator
 */
export interface CachePutOptions {
  /** Entity type for TTL and key prefix lookup */
  entityType: CacheableEntityType
  /** Custom TTL in seconds (overrides entity type default) */
  ttl?: number
  /** Function to generate cache key from method arguments */
  keyGenerator?: (...args: unknown[]) => string
  /** Extract the key from the method result */
  keyFromResult?: (result: unknown) => string
}

/**
 * Tag-to-keys tracking storage
 */
const tagToKeysMap: Map<string, Set<string>> = new Map()

/**
 * Track a cache key under specific tags
 */
function trackTags(key: string, tags: string[]): void {
  for (const tag of tags) {
    if (!tagToKeysMap.has(tag)) {
      tagToKeysMap.set(tag, new Set())
    }
    tagToKeysMap.get(tag)!.add(key)
  }
}

/**
 * Get all keys associated with a tag
 */
function getKeysByTag(tag: string): string[] {
  return Array.from(tagToKeysMap.get(tag) || [])
}

/**
 * Invalidate all keys associated with specific tags
 */
async function invalidateByTags(tags: string[]): Promise<void> {
  const keysToDelete: Set<string> = new Set()

  for (const tag of tags) {
    const keys = getKeysByTag(tag)
    keys.forEach((key) => keysToDelete.add(key))
    // Clear the tag mapping
    tagToKeysMap.delete(tag)
  }

  if (keysToDelete.size > 0) {
    await cacheHelpers.del(Array.from(keysToDelete))
    logDebug(`Invalidated ${keysToDelete.size} keys for tags: ${tags.join(', ')}`)
  }
}

/**
 * @Cacheable decorator
 *
 * Caches the result of a method call. On subsequent calls with the same
 * arguments, returns the cached value instead of executing the method.
 */
export function Cacheable(options: CacheableOptions) {
  return function <T>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>

    if (typeof originalMethod !== 'function') {
      throw new Error(`@Cacheable can only be applied to methods`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: unknown[]): Promise<unknown> {
      const startTime = Date.now()

      // Check condition
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args)
      }

      // Generate cache key
      const keyIdentifier = options.keyGenerator
        ? options.keyGenerator(...args)
        : JSON.stringify(args)
      const cacheKey = generateCacheKey(options.entityType, keyIdentifier)

      try {
        // Try to get from cache
        const cached = await cacheHelpers.get(cacheKey)

        if (cached !== null && cached !== undefined) {
          const latency = Date.now() - startTime
          recordCacheHit(options.entityType, latency)
          logDebug(`Cache HIT for ${String(propertyKey)}: ${cacheKey}`)
          return cached
        }

        // Cache miss - execute method
        const result = await originalMethod.apply(this, args)
        const latency = Date.now() - startTime
        recordCacheMiss(options.entityType, latency)

        // Don't cache null/undefined results
        if (result === null || result === undefined) {
          return result
        }

        // Transform result if transformer provided
        const valueToCache = options.transformer ? options.transformer(result) : result

        // Get TTL
        const ttl = options.ttl ?? getTTL(options.entityType)

        // Cache the result
        await cacheHelpers.set(cacheKey, valueToCache, ttl)

        // Track tags for invalidation
        const tags = [...getTagsForEntity(options.entityType), ...(options.tags || [])]
        trackTags(cacheKey, tags)

        logDebug(`Cache MISS for ${String(propertyKey)}: ${cacheKey}, cached with TTL=${ttl}s`)

        return result
      } catch (error) {
        const latency = Date.now() - startTime
        recordCacheMiss(options.entityType, latency)

        if (options.skipOnError) {
          logError(
            `Cache error for ${String(propertyKey)}, executing method directly`,
            error as Error,
          )
          return originalMethod.apply(this, args)
        }
        throw error
      }
    } as T

    return descriptor
  }
}

/**
 * @CacheInvalidate decorator
 *
 * Invalidates cache entries when a method is called (typically on write operations).
 */
export function CacheInvalidate(options: CacheInvalidateOptions) {
  return function <T>(
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>

    if (typeof originalMethod !== 'function') {
      throw new Error(`@CacheInvalidate can only be applied to methods`)
    }

    const invalidate = async (args: unknown[]): Promise<void> => {
      const keysToInvalidate: string[] = []

      // Invalidate by key(s)
      if (options.keyGenerator) {
        const keys = options.keyGenerator(...args)
        const keyArray = Array.isArray(keys) ? keys : [keys]
        for (const key of keyArray) {
          keysToInvalidate.push(generateCacheKey(options.entityType, key))
        }
      }

      // Invalidate by pattern
      if (options.pattern) {
        const patternStr =
          typeof options.pattern === 'function' ? options.pattern(...args) : options.pattern
        const prefix = CACHE_KEY_PREFIX[options.entityType]
        await cacheHelpers.clearPattern(`${prefix}${patternStr}*`)
        logDebug(`Invalidated pattern: ${prefix}${patternStr}*`)
      }

      // Invalidate by tags
      if (options.tags && options.tags.length > 0) {
        await invalidateByTags(options.tags)
      }

      // Invalidate related entity types
      if (options.invalidateRelated && options.invalidateRelated.length > 0) {
        for (const relatedType of options.invalidateRelated) {
          const relatedTags = getTagsForEntity(relatedType)
          await invalidateByTags(relatedTags)
        }
      }

      // Delete specific keys
      if (keysToInvalidate.length > 0) {
        await cacheHelpers.del(keysToInvalidate)
        logDebug(`Invalidated keys: ${keysToInvalidate.join(', ')}`)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: unknown[]): Promise<unknown> {
      const timing = options.timing ?? 'after'

      // Invalidate before if specified
      if (timing === 'before') {
        await invalidate(args)
      }

      // Execute the original method
      const result = await originalMethod.apply(this, args)

      // Invalidate after (default)
      if (timing === 'after') {
        await invalidate(args)
      }

      return result
    } as T

    return descriptor
  }
}

/**
 * @CachePut decorator
 *
 * Always executes the method and updates the cache with the result.
 * Useful for update operations where you want to refresh the cache.
 */
export function CachePut(options: CachePutOptions) {
  return function <T>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>

    if (typeof originalMethod !== 'function') {
      throw new Error(`@CachePut can only be applied to methods`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: unknown[]): Promise<unknown> {
      // Always execute the method
      const result = await originalMethod.apply(this, args)

      // Don't cache null/undefined results
      if (result === null || result === undefined) {
        return result
      }

      try {
        // Generate cache key
        let keyIdentifier: string
        if (options.keyFromResult) {
          keyIdentifier = options.keyFromResult(result)
        } else if (options.keyGenerator) {
          keyIdentifier = options.keyGenerator(...args)
        } else {
          keyIdentifier = JSON.stringify(args)
        }

        const cacheKey = generateCacheKey(options.entityType, keyIdentifier)
        const ttl = options.ttl ?? getTTL(options.entityType)

        await cacheHelpers.set(cacheKey, result, ttl)

        // Track tags
        const tags = getTagsForEntity(options.entityType)
        trackTags(cacheKey, tags)

        logDebug(`CachePut for ${String(propertyKey)}: ${cacheKey}`)
      } catch (error) {
        logError(`CachePut failed for ${String(propertyKey)}`, error as Error)
      }

      return result
    } as T

    return descriptor
  }
}

/**
 * Utility function to manually invalidate cache by entity type
 */
export async function invalidateEntityCache(entityType: CacheableEntityType): Promise<void> {
  const prefix = CACHE_KEY_PREFIX[entityType]
  await cacheHelpers.clearPattern(`${prefix}*`)
  const tags = getTagsForEntity(entityType)
  await invalidateByTags(tags)
  logDebug(`Manually invalidated all cache for entity type: ${entityType}`)
}

/**
 * Utility function to manually invalidate cache by tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  await invalidateByTags([tag])
}

/**
 * Utility function to get current tag mappings (for debugging)
 */
export function getTagMappings(): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [tag, keys] of tagToKeysMap.entries()) {
    result[tag] = Array.from(keys)
  }
  return result
}

/**
 * Clear all tag mappings (for testing)
 */
export function clearTagMappings(): void {
  tagToKeysMap.clear()
}
