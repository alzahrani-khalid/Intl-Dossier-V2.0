/**
 * Enhanced Contact Service with Redis Caching and Cursor Pagination
 *
 * Provides optimized CRUD operations for contacts with caching and improved pagination.
 * Redis caching is optional and gracefully degrades if Redis is unavailable.
 *
 * @module contact-service-enhanced
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { Database } from '../types/contact-directory.types.js';

// Optional Redis client (will be null if Redis is not configured)
let redisClient: any = null;

// Try to import Redis client if available
try {
  const { Redis } = await import('ioredis');
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      retryStrategy: () => null, // Fail fast if Redis is down
    });

    redisClient.on('error', (err: any) => {
      console.warn('Redis client error (caching disabled):', err.message);
      redisClient = null; // Disable Redis on error
    });
  }
} catch (error) {
  console.log('Redis not available - caching disabled');
}

type Contact = Database['public']['Tables']['cd_contacts']['Row'];
type ContactInsert = Database['public']['Tables']['cd_contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['cd_contacts']['Update'];

export interface PaginatedSearchResult {
  contacts: Contact[];
  nextCursor?: string;
  prevCursor?: string;
  total: number;
  hasMore: boolean;
}

export interface SearchQuery {
  search?: string;
  organization_id?: string;
  tags?: string[];
  cursor?: string; // For cursor-based pagination
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  group_by_organization?: boolean;
}

export class ContactServiceEnhanced {
  private readonly CACHE_TTL = 300; // 5 minutes cache TTL
  private readonly CACHE_PREFIX = 'contacts:';

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get contact by ID with Redis caching
   *
   * @param id - Contact UUID
   * @returns Contact record or null
   */
  async getById(id: string): Promise<Contact | null> {
    // Try to get from cache first
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .select('*')
      .eq('id', id)
      .eq('is_archived', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Cache the result
    if (data) {
      await this.setCache(cacheKey, data, this.CACHE_TTL);
    }

    return data;
  }

  /**
   * Search contacts with cursor-based pagination and caching
   *
   * @param query - Search parameters with cursor support
   * @returns Paginated search results
   */
  async searchWithCursor(query: SearchQuery): Promise<PaginatedSearchResult> {
    const limit = Math.min(query.limit || 50, 100);

    // Generate cache key based on query parameters (excluding cursor)
    const cacheKey = this.generateCacheKey('search', {
      search: query.search,
      organization_id: query.organization_id,
      tags: query.tags,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
    });

    // Try cache for count (total results)
    const cachedCount = await this.getFromCache(`${cacheKey}:count`);
    let total = cachedCount;

    // Parse cursor if provided
    let cursorDate: Date | null = null;
    let cursorId: string | null = null;

    if (query.cursor) {
      try {
        const decoded = Buffer.from(query.cursor, 'base64').toString('utf-8');
        const [date, id] = decoded.split('|');
        cursorDate = new Date(date);
        cursorId = id;
      } catch (error) {
        console.warn('Invalid cursor:', query.cursor);
      }
    }

    // Build query
    let queryBuilder = this.supabase
      .from('cd_contacts')
      .select('*', { count: 'exact' })
      .eq('is_archived', false);

    // Apply filters
    if (query.search) {
      queryBuilder = queryBuilder.textSearch('full_name', query.search, {
        type: 'websearch',
        config: 'simple'
      });
    }

    if (query.organization_id) {
      queryBuilder = queryBuilder.eq('organization_id', query.organization_id);
    }

    if (query.tags && query.tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', query.tags);
    }

    // Apply cursor-based pagination
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';

    if (cursorDate && cursorId) {
      if (sortOrder === 'desc') {
        queryBuilder = queryBuilder
          .or(`${sortBy}.lt.${cursorDate.toISOString()},and(${sortBy}.eq.${cursorDate.toISOString()},id.lt.${cursorId})`);
      } else {
        queryBuilder = queryBuilder
          .or(`${sortBy}.gt.${cursorDate.toISOString()},and(${sortBy}.eq.${cursorDate.toISOString()},id.gt.${cursorId})`);
      }
    }

    // Apply sorting and limit
    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: sortOrder === 'asc' })
      .limit(limit + 1); // Fetch one extra to determine hasMore

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    const contacts = data || [];

    // Update total count and cache it
    if (count !== null && !cachedCount) {
      total = count;
      await this.setCache(`${cacheKey}:count`, total, this.CACHE_TTL);
    }

    // Determine pagination info
    const hasMore = contacts.length > limit;
    const resultContacts = hasMore ? contacts.slice(0, limit) : contacts;

    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (hasMore && resultContacts.length > 0) {
      const lastContact = resultContacts[resultContacts.length - 1];
      const lastSortValue = lastContact[sortBy as keyof Contact] as string;
      nextCursor = Buffer.from(`${lastSortValue}|${lastContact.id}`).toString('base64');
    }

    if (cursorDate && resultContacts.length > 0) {
      const firstContact = resultContacts[0];
      const firstSortValue = firstContact[sortBy as keyof Contact] as string;
      prevCursor = Buffer.from(`${firstSortValue}|${firstContact.id}`).toString('base64');
    }

    return {
      contacts: resultContacts,
      nextCursor,
      prevCursor,
      total: total || 0,
      hasMore,
    };
  }

  /**
   * Get frequently accessed contacts (cached)
   *
   * @param limit - Number of contacts to return
   * @returns Array of frequently accessed contacts
   */
  async getFrequentContacts(limit: number = 10): Promise<Contact[]> {
    const cacheKey = `${this.CACHE_PREFIX}frequent:${limit}`;

    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch most recently updated contacts as a proxy for frequency
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const contacts = data || [];

    // Cache for longer as these don't change often
    await this.setCache(cacheKey, contacts, this.CACHE_TTL * 2);

    return contacts;
  }

  /**
   * Invalidate cache for a contact
   *
   * @param id - Contact ID to invalidate
   */
  async invalidateCache(id: string): Promise<void> {
    if (!redisClient) return;

    try {
      // Delete specific contact cache
      await redisClient.del(`${this.CACHE_PREFIX}${id}`);

      // Delete all search caches (pattern matching)
      const keys = await redisClient.keys(`${this.CACHE_PREFIX}search:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }

      // Delete frequent contacts cache
      const frequentKeys = await redisClient.keys(`${this.CACHE_PREFIX}frequent:*`);
      if (frequentKeys.length > 0) {
        await redisClient.del(...frequentKeys);
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Create a new contact with cache invalidation
   */
  async create(contact: ContactInsert): Promise<Contact> {
    // Validate (same as original implementation)
    if (!contact.full_name || contact.full_name.trim().length < 2) {
      throw new Error('full_name is required and must be at least 2 characters');
    }

    if (contact.full_name.length > 200) {
      throw new Error('full_name cannot exceed 200 characters');
    }

    // Insert contact
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .insert(contact)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create contact');

    // Invalidate relevant caches
    await this.invalidateCache(data.id);

    return data;
  }

  /**
   * Update a contact with cache invalidation
   */
  async update(id: string, updates: ContactUpdate): Promise<Contact> {
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contact not found');

    // Invalidate cache
    await this.invalidateCache(id);

    return data;
  }

  /**
   * Archive (soft delete) a contact with cache invalidation
   */
  async archive(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('cd_contacts')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Invalidate cache
    await this.invalidateCache(id);
  }

  // Cache helper methods

  private async getFromCache(key: string): Promise<any> {
    if (!redisClient) return null;

    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, value: any, ttl: number): Promise<void> {
    if (!redisClient) return;

    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 16);

    return `${this.CACHE_PREFIX}${prefix}:${hash}`;
  }
}