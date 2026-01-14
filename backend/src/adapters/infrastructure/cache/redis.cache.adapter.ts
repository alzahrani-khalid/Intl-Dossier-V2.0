/**
 * Redis Cache Adapter
 *
 * Implements the ICachePort using Redis as the caching backend.
 * This is an adapter in the hexagonal architecture.
 */

import type { Redis } from 'ioredis'
import { ICachePort, CacheSetOptions, CacheStats } from '../../../core/ports/infrastructure'

/**
 * Redis implementation of the Cache Port
 */
export class RedisCacheAdapter implements ICachePort {
  private connected = false
  private tagPrefix = 'tag:'

  constructor(private readonly redis: Redis) {
    // Track connection status
    this.redis.on('connect', () => {
      this.connected = true
    })
    this.redis.on('close', () => {
      this.connected = false
    })
    this.redis.on('error', () => {
      this.connected = false
    })
    // Set initial connection status
    this.connected = this.redis.status === 'ready'
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      if (!value) return null

      try {
        return JSON.parse(value) as T
      } catch {
        // If not JSON, return as string
        return value as unknown as T
      }
    } catch (error) {
      console.error('RedisCacheAdapter.get error:', error)
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

      let result: string | null

      // Use appropriate Redis command based on options
      if (options?.ttl && options?.nx) {
        result = await this.redis.set(key, stringValue, 'EX', options.ttl, 'NX')
      } else if (options?.ttl && options?.xx) {
        result = await this.redis.set(key, stringValue, 'EX', options.ttl, 'XX')
      } else if (options?.ttl) {
        result = await this.redis.setex(key, options.ttl, stringValue)
      } else if (options?.nx) {
        const setResult = await this.redis.setnx(key, stringValue)
        result = setResult === 1 ? 'OK' : null
      } else {
        result = await this.redis.set(key, stringValue)
      }

      // If tags are specified, track them
      if (options?.tags && result === 'OK') {
        await this.trackTags(key, options.tags, options.ttl)
      }

      return result === 'OK'
    } catch (error) {
      console.error('RedisCacheAdapter.set error:', error)
      return false
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string | string[]): Promise<number> {
    try {
      const keys = Array.isArray(key) ? key : [key]
      if (keys.length === 0) return 0
      return await this.redis.del(...keys)
    } catch (error) {
      console.error('RedisCacheAdapter.del error:', error)
      return 0
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('RedisCacheAdapter.exists error:', error)
      return false
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    try {
      const values = await this.redis.mget(...keys)
      const result = new Map<string, T | null>()

      keys.forEach((key, index) => {
        const value = values[index]
        if (value === null || value === undefined) {
          result.set(key, null)
        } else {
          try {
            result.set(key, JSON.parse(value) as T)
          } catch {
            result.set(key, value as unknown as T)
          }
        }
      })

      return result
    } catch (error) {
      console.error('RedisCacheAdapter.mget error:', error)
      return new Map()
    }
  }

  /**
   * Set multiple values
   */
  async mset<T>(entries: Map<string, T>, options?: CacheSetOptions): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline()
      const ttl = options?.ttl

      entries.forEach((value, key) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

        if (ttl) {
          pipeline.setex(key, ttl, stringValue)
        } else {
          pipeline.set(key, stringValue)
        }

        // Track tags
        if (options?.tags) {
          options.tags.forEach((tag) => {
            pipeline.sadd(`${this.tagPrefix}${tag}`, key)
            if (ttl) {
              pipeline.expire(`${this.tagPrefix}${tag}`, ttl)
            }
          })
        }
      })

      await pipeline.exec()
      return true
    } catch (error) {
      console.error('RedisCacheAdapter.mset error:', error)
      return false
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      return await this.redis.del(...keys)
    } catch (error) {
      console.error('RedisCacheAdapter.delPattern error:', error)
      return 0
    }
  }

  /**
   * Get time-to-live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error('RedisCacheAdapter.ttl error:', error)
      return -2 // Key doesn't exist
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds)
      return result === 1
    } catch (error) {
      console.error('RedisCacheAdapter.expire error:', error)
      return false
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, by = 1): Promise<number> {
    try {
      if (by === 1) {
        return await this.redis.incr(key)
      }
      return await this.redis.incrby(key, by)
    } catch (error) {
      console.error('RedisCacheAdapter.incr error:', error)
      return 0
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, by = 1): Promise<number> {
    try {
      if (by === 1) {
        return await this.redis.decr(key)
      }
      return await this.redis.decrby(key, by)
    } catch (error) {
      console.error('RedisCacheAdapter.decr error:', error)
      return 0
    }
  }

  // Hash operations

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      const result = await this.redis.hset(key, field, value)
      return result >= 0
    } catch (error) {
      console.error('RedisCacheAdapter.hset error:', error)
      return false
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field)
    } catch (error) {
      console.error('RedisCacheAdapter.hget error:', error)
      return null
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      const result = await this.redis.hgetall(key)
      if (!result || Object.keys(result).length === 0) return null
      return result
    } catch (error) {
      console.error('RedisCacheAdapter.hgetall error:', error)
      return null
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.redis.hdel(key, field)
      return result === 1
    } catch (error) {
      console.error('RedisCacheAdapter.hdel error:', error)
      return false
    }
  }

  // Set operations

  async sadd(key: string, member: string | string[]): Promise<number> {
    try {
      const members = Array.isArray(member) ? member : [member]
      return await this.redis.sadd(key, ...members)
    } catch (error) {
      console.error('RedisCacheAdapter.sadd error:', error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key)
    } catch (error) {
      console.error('RedisCacheAdapter.smembers error:', error)
      return []
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, member)
      return result === 1
    } catch (error) {
      console.error('RedisCacheAdapter.sismember error:', error)
      return false
    }
  }

  async srem(key: string, member: string | string[]): Promise<number> {
    try {
      const members = Array.isArray(member) ? member : [member]
      return await this.redis.srem(key, ...members)
    } catch (error) {
      console.error('RedisCacheAdapter.srem error:', error)
      return 0
    }
  }

  // List operations

  async lpush(key: string, value: string | string[]): Promise<number> {
    try {
      const values = Array.isArray(value) ? value : [value]
      return await this.redis.lpush(key, ...values)
    } catch (error) {
      console.error('RedisCacheAdapter.lpush error:', error)
      return 0
    }
  }

  async rpush(key: string, value: string | string[]): Promise<number> {
    try {
      const values = Array.isArray(value) ? value : [value]
      return await this.redis.rpush(key, ...values)
    } catch (error) {
      console.error('RedisCacheAdapter.rpush error:', error)
      return 0
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.redis.lpop(key)
    } catch (error) {
      console.error('RedisCacheAdapter.lpop error:', error)
      return null
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key)
    } catch (error) {
      console.error('RedisCacheAdapter.rpop error:', error)
      return null
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop)
    } catch (error) {
      console.error('RedisCacheAdapter.lrange error:', error)
      return []
    }
  }

  // Tag-based invalidation

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `${this.tagPrefix}${tag}`
      const keys = await this.redis.smembers(tagKey)

      if (keys.length === 0) return 0

      const deleted = await this.redis.del(...keys)
      await this.redis.del(tagKey)

      return deleted
    } catch (error) {
      console.error('RedisCacheAdapter.invalidateByTag error:', error)
      return 0
    }
  }

  /**
   * Invalidate all keys with any of the specified tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalDeleted = 0

      for (const tag of tags) {
        const deleted = await this.invalidateByTag(tag)
        totalDeleted += deleted
      }

      return totalDeleted
    } catch (error) {
      console.error('RedisCacheAdapter.invalidateByTags error:', error)
      return 0
    }
  }

  // Utility

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    try {
      await this.redis.flushdb()
      return true
    } catch (error) {
      console.error('RedisCacheAdapter.flush error:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('stats')
      const memoryInfo = await this.redis.info('memory')
      const dbSize = await this.redis.dbsize()

      // Parse stats
      const hitsMatch = info.match(/keyspace_hits:(\d+)/)
      const missesMatch = info.match(/keyspace_misses:(\d+)/)
      const memoryMatch = memoryInfo.match(/used_memory:(\d+)/)
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/)

      return {
        hits: hitsMatch && hitsMatch[1] ? parseInt(hitsMatch[1], 10) : 0,
        misses: missesMatch && missesMatch[1] ? parseInt(missesMatch[1], 10) : 0,
        keys: dbSize,
        memoryUsage: memoryMatch && memoryMatch[1] ? parseInt(memoryMatch[1], 10) : undefined,
        uptime: uptimeMatch && uptimeMatch[1] ? parseInt(uptimeMatch[1], 10) : undefined,
      }
    } catch (error) {
      console.error('RedisCacheAdapter.getStats error:', error)
      return {
        hits: 0,
        misses: 0,
        keys: 0,
      }
    }
  }

  /**
   * Check if cache is connected
   */
  isConnected(): boolean {
    return this.connected && this.redis.status === 'ready'
  }

  /**
   * Ping the cache server
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('RedisCacheAdapter.ping error:', error)
      return false
    }
  }

  /**
   * Track tags for a key
   */
  private async trackTags(key: string, tags: string[], ttl?: number): Promise<void> {
    const pipeline = this.redis.pipeline()

    tags.forEach((tag) => {
      const tagKey = `${this.tagPrefix}${tag}`
      pipeline.sadd(tagKey, key)
      if (ttl) {
        pipeline.expire(tagKey, ttl)
      }
    })

    await pipeline.exec()
  }
}
