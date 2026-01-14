/**
 * Cache Port
 *
 * Defines the contract for caching operations.
 * Adapters can implement using Redis, Memcached, in-memory, etc.
 */

/**
 * Cache options for set operations
 */
export interface CacheSetOptions {
  /** Time-to-live in seconds */
  ttl?: number
  /** Tags for cache invalidation */
  tags?: string[]
  /** If true, only set if key doesn't exist */
  nx?: boolean
  /** If true, only set if key exists */
  xx?: boolean
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T
  createdAt: number
  expiresAt?: number
  tags?: string[]
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  keys: number
  memoryUsage?: number
  uptime?: number
}

/**
 * Cache Port
 *
 * Contract for cache operations. Implementations can use
 * Redis, Memcached, in-memory cache, or distributed cache.
 */
export interface ICachePort {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean>

  /**
   * Delete a key from cache
   */
  del(key: string | string[]): Promise<number>

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Get multiple values
   */
  mget<T>(keys: string[]): Promise<Map<string, T | null>>

  /**
   * Set multiple values
   */
  mset<T>(entries: Map<string, T>, options?: CacheSetOptions): Promise<boolean>

  /**
   * Delete keys matching a pattern
   */
  delPattern(pattern: string): Promise<number>

  /**
   * Get time-to-live for a key (in seconds)
   */
  ttl(key: string): Promise<number>

  /**
   * Set expiration on a key
   */
  expire(key: string, seconds: number): Promise<boolean>

  /**
   * Increment a numeric value
   */
  incr(key: string, by?: number): Promise<number>

  /**
   * Decrement a numeric value
   */
  decr(key: string, by?: number): Promise<number>

  // Hash operations
  /**
   * Set field in hash
   */
  hset(key: string, field: string, value: string): Promise<boolean>

  /**
   * Get field from hash
   */
  hget(key: string, field: string): Promise<string | null>

  /**
   * Get all fields from hash
   */
  hgetall(key: string): Promise<Record<string, string> | null>

  /**
   * Delete field from hash
   */
  hdel(key: string, field: string): Promise<boolean>

  // Set operations
  /**
   * Add member to set
   */
  sadd(key: string, member: string | string[]): Promise<number>

  /**
   * Get all members of set
   */
  smembers(key: string): Promise<string[]>

  /**
   * Check if member is in set
   */
  sismember(key: string, member: string): Promise<boolean>

  /**
   * Remove member from set
   */
  srem(key: string, member: string | string[]): Promise<number>

  // List operations
  /**
   * Push value to list (left)
   */
  lpush(key: string, value: string | string[]): Promise<number>

  /**
   * Push value to list (right)
   */
  rpush(key: string, value: string | string[]): Promise<number>

  /**
   * Pop value from list (left)
   */
  lpop(key: string): Promise<string | null>

  /**
   * Pop value from list (right)
   */
  rpop(key: string): Promise<string | null>

  /**
   * Get range from list
   */
  lrange(key: string, start: number, stop: number): Promise<string[]>

  // Tag-based invalidation
  /**
   * Invalidate all keys with a specific tag
   */
  invalidateByTag(tag: string): Promise<number>

  /**
   * Invalidate all keys with any of the specified tags
   */
  invalidateByTags(tags: string[]): Promise<number>

  // Utility
  /**
   * Clear all cache
   */
  flush(): Promise<boolean>

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>

  /**
   * Check if cache is connected/available
   */
  isConnected(): boolean

  /**
   * Ping the cache server
   */
  ping(): Promise<boolean>
}

/**
 * Cache key builder helper type
 */
export type CacheKeyBuilder<T extends Record<string, unknown>> = (params: T) => string

/**
 * Create a typed cache key builder
 */
export function createCacheKeyBuilder<T extends Record<string, unknown>>(
  prefix: string,
  paramOrder: (keyof T)[],
): CacheKeyBuilder<T> {
  return (params: T) => {
    const parts = paramOrder.map((key) => String(params[key] ?? ''))
    return `${prefix}:${parts.join(':')}`
  }
}
