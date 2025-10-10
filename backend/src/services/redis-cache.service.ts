/**
 * Redis Cache Service
 * Feature: 015-search-retrieval-spec
 * Task: T032
 *
 * Provides caching for search suggestions and results with:
 * - Graceful fallback when Redis unavailable
 * - Configurable TTL for different cache types
 * - Connection pooling for performance
 * - Error logging without breaking search functionality
 */

import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number;           // Time-to-live in seconds
  prefix?: string;        // Key prefix for namespace isolation
}

export interface SuggestionCacheItem {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  preview_en?: string;
  preview_ar?: string;
  score: number;
  match_position: number;
}

export class RedisCacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private fallbackMode: boolean = false;
  private errorLogged: boolean = false; // Track if error has been logged

  constructor(
    private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
    private options: { maxRetriesPerRequest: number; retryStrategy?: (times: number) => number | void } = {
      maxRetriesPerRequest: 1, // Reduce retries from 3 to 1
      retryStrategy: (times: number) => {
        if (times > 1) {
          return null; // Stop retrying after first attempt, enter fallback mode
        }
        return 100; // Wait 100ms before retry
      }
    }
  ) {
    this.initializeClient();
  }

  /**
   * Initialize Redis client with error handling
   */
  private initializeClient(): void {
    try {
      this.client = new Redis(this.redisUrl, this.options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.fallbackMode = false;
        this.errorLogged = false;
        console.log('✓ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        // Log error only once to avoid spam
        if (!this.errorLogged) {
          console.warn('⚠ Redis unavailable, running in fallback mode (caching disabled)');
          this.errorLogged = true;
        }
        this.isConnected = false;
        this.fallbackMode = true;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        if (this.errorLogged) {
          // Reset flag when connection closes after being in error state
          this.errorLogged = false;
        }
      });

    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.fallbackMode = true;
    }
  }

  /**
   * Get search suggestions from cache
   *
   * @param key - Cache key
   * @returns Cached suggestions or null if not found/error
   */
  async getSuggestions(key: string): Promise<SuggestionCacheItem[] | null> {
    if (!this.isConnected || this.fallbackMode) {
      return null;
    }

    try {
      const cached = await this.client!.zrevrange(key, 0, 9, 'WITHSCORES');

      if (!cached || cached.length === 0) {
        return null;
      }

      // Parse ZSET results (value, score, value, score, ...)
      const suggestions: SuggestionCacheItem[] = [];
      for (let i = 0; i < cached.length; i += 2) {
        try {
          const suggestion = JSON.parse(cached[i]);
          suggestion.score = parseFloat(cached[i + 1]);
          suggestions.push(suggestion);
        } catch (parseError) {
          console.warn('Failed to parse cached suggestion:', parseError);
          continue;
        }
      }

      return suggestions;

    } catch (error) {
      console.warn('Redis get error, returning null:', error);
      return null;
    }
  }

  /**
   * Cache search suggestions with TTL
   *
   * @param key - Cache key
   * @param suggestions - Array of suggestions to cache
   * @param ttl - Time-to-live in seconds (default: 300 = 5 minutes)
   */
  async setSuggestions(
    key: string,
    suggestions: SuggestionCacheItem[],
    ttl: number = 300
  ): Promise<boolean> {
    if (!this.isConnected || this.fallbackMode) {
      return false;
    }

    try {
      // Clear existing key
      await this.client!.del(key);

      if (suggestions.length === 0) {
        return true;
      }

      // Build ZADD arguments: score1, member1, score2, member2, ...
      const zaddArgs: (string | number)[] = [];
      for (const suggestion of suggestions) {
        zaddArgs.push(suggestion.score);
        zaddArgs.push(JSON.stringify(suggestion));
      }

      // Add to sorted set
      await this.client!.zadd(key, ...zaddArgs);

      // Set expiration
      await this.client!.expire(key, ttl);

      return true;

    } catch (error) {
      console.warn('Redis set error:', error);
      return false;
    }
  }

  /**
   * Get generic cached value
   *
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || this.fallbackMode) {
      return null;
    }

    try {
      const cached = await this.client!.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;

    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set generic cached value
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in seconds
   */
  async set(key: string, value: any, ttl: number = 60): Promise<boolean> {
    if (!this.isConnected || this.fallbackMode) {
      return false;
    }

    try {
      await this.client!.setex(key, ttl, JSON.stringify(value));
      return true;

    } catch (error) {
      console.warn('Redis set error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   *
   * @param pattern - Key pattern (e.g., 'search:suggest:*')
   * @returns Number of keys deleted
   */
  async invalidate(pattern: string): Promise<number> {
    if (!this.isConnected || this.fallbackMode) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.client!.del(...keys);
      return deleted;

    } catch (error) {
      console.warn('Redis invalidate error:', error);
      return 0;
    }
  }

  /**
   * Check if service is in fallback mode
   */
  isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    return this.isConnected && !this.fallbackMode;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key for suggestions
   *
   * @param entityType - Entity type filter
   * @param prefix - Search prefix
   * @param lang - Language
   * @returns Cache key
   */
  static generateSuggestionKey(entityType: string, prefix: string, lang: string = 'en'): string {
    return `search:suggest:${entityType}:${lang}:${prefix.toLowerCase()}`;
  }

  /**
   * Generate cache key for search results
   *
   * @param queryHash - Hash of search query
   * @param filters - Applied filters
   * @returns Cache key
   */
  static generateResultKey(queryHash: string, filters: string = ''): string {
    return `search:results:${queryHash}${filters ? `:${filters}` : ''}`;
  }
}

// Singleton instance
let cacheServiceInstance: RedisCacheService | null = null;

/**
 * Get singleton Redis cache service instance
 */
export function getRedisCacheService(): RedisCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new RedisCacheService();
  }
  return cacheServiceInstance;
}
