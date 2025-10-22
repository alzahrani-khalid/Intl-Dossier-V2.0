/**
 * Filter Service
 *
 * Provides filtering logic for waiting queue assignments
 * Note: This service provides utility functions that can be imported by Edge Functions
 * Edge Functions contain their own business logic per architecture decision
 *
 * Task: T076 [P] [US5]
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Redis } from 'ioredis';
import crypto from 'crypto';

export interface FilterCriteria {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  aging?: '0-2' | '3-6' | '7+';
  type?: 'dossier' | 'ticket' | 'position' | 'task';
  assignee?: string;
  status?: 'pending' | 'assigned';
  sort_by?: 'assigned_at_asc' | 'assigned_at_desc' | 'priority_asc' | 'priority_desc';
  page?: number;
  page_size?: number;
}

export interface FilterResult {
  data: any[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

/**
 * Build filter query for Supabase
 * Constructs the query with all applicable filters
 */
export function buildFilterQuery(
  supabase: SupabaseClient,
  filters: FilterCriteria,
  userId: string
) {
  let query = supabase
    .from('assignments')
    .select('*, auth_users:assignee_id(id, full_name, email, locale)', { count: 'exact' });

  // Filter by status (default to active assignments)
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.in('status', ['pending', 'assigned']);
  }

  // Filter by priority
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  // Filter by work item type
  if (filters.type) {
    query = query.eq('work_item_type', filters.type);
  }

  // Filter by assignee
  if (filters.assignee) {
    query = query.eq('assignee_id', filters.assignee);
  }

  // Filter by aging bucket
  if (filters.aging) {
    const now = new Date();
    switch (filters.aging) {
      case '0-2':
        query = query.gte('assigned_at', new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case '3-6':
        query = query
          .lte('assigned_at', new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .gte('assigned_at', new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case '7+':
        query = query.lte('assigned_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        break;
    }
  }

  // Apply sorting
  const sortBy = filters.sort_by || 'assigned_at_desc';
  switch (sortBy) {
    case 'assigned_at_asc':
      query = query.order('assigned_at', { ascending: true });
      break;
    case 'assigned_at_desc':
      query = query.order('assigned_at', { ascending: false });
      break;
    case 'priority_asc':
      query = query.order('priority', { ascending: true }).order('assigned_at', { ascending: false });
      break;
    case 'priority_desc':
      query = query.order('priority', { ascending: false }).order('assigned_at', { ascending: false });
      break;
  }

  // Apply pagination
  const page = filters.page || 1;
  const pageSize = Math.min(filters.page_size || 50, 100); // Max 100 items per page
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  return query;
}

/**
 * Generate cache key hash from filter criteria
 */
export function generateCacheKey(userId: string, filters: FilterCriteria): string {
  // Create deterministic hash of filter criteria
  const filterString = JSON.stringify(filters, Object.keys(filters).sort());
  const hash = crypto.createHash('sha256').update(filterString).digest('hex').substring(0, 16);
  return `queue-filter:${userId}:${hash}`;
}

/**
 * Cache filter results in Redis with 5-minute TTL
 */
export async function cacheFilterResults(
  redis: Redis,
  cacheKey: string,
  result: FilterResult
): Promise<void> {
  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5-min TTL
}

/**
 * Get cached filter results from Redis
 */
export async function getCachedResults(
  redis: Redis,
  cacheKey: string
): Promise<FilterResult | null> {
  const cached = await redis.get(cacheKey);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Invalidate cache for a specific user or all users
 */
export async function invalidateCache(
  redis: Redis,
  pattern: string = 'queue-filter:*'
): Promise<number> {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;

  await redis.del(...keys);
  return keys.length;
}

/**
 * Invalidate cache for specific user
 */
export async function invalidateUserCache(
  redis: Redis,
  userId: string
): Promise<number> {
  return invalidateCache(redis, `queue-filter:${userId}:*`);
}

/**
 * Validate filter parameters
 */
export function validateFilters(filters: FilterCriteria): { valid: boolean; error?: string } {
  // Validate priority
  if (filters.priority && !['low', 'medium', 'high', 'urgent'].includes(filters.priority)) {
    return { valid: false, error: 'Invalid priority value. Must be one of: low, medium, high, urgent' };
  }

  // Validate aging
  if (filters.aging && !['0-2', '3-6', '7+'].includes(filters.aging)) {
    return { valid: false, error: 'Invalid aging value. Must be one of: 0-2, 3-6, 7+' };
  }

  // Validate type
  if (filters.type && !['dossier', 'ticket', 'position', 'task'].includes(filters.type)) {
    return { valid: false, error: 'Invalid type value. Must be one of: dossier, ticket, position, task' };
  }

  // Validate status
  if (filters.status && !['pending', 'assigned'].includes(filters.status)) {
    return { valid: false, error: 'Invalid status value. Must be one of: pending, assigned' };
  }

  // Validate sort_by
  if (filters.sort_by && !['assigned_at_asc', 'assigned_at_desc', 'priority_asc', 'priority_desc'].includes(filters.sort_by)) {
    return { valid: false, error: 'Invalid sort_by value. Must be one of: assigned_at_asc, assigned_at_desc, priority_asc, priority_desc' };
  }

  // Validate page
  if (filters.page !== undefined && (filters.page < 1 || !Number.isInteger(filters.page))) {
    return { valid: false, error: 'Invalid page value. Must be a positive integer' };
  }

  // Validate page_size
  if (filters.page_size !== undefined) {
    if (filters.page_size < 1 || filters.page_size > 100 || !Number.isInteger(filters.page_size)) {
      return { valid: false, error: 'Invalid page_size value. Must be an integer between 1 and 100' };
    }
  }

  return { valid: true };
}

/**
 * Calculate aging in days for each assignment
 */
export function calculateAging(assignments: any[]): any[] {
  const now = Date.now();
  return assignments.map(assignment => ({
    ...assignment,
    days_waiting: Math.floor((now - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
  }));
}

/**
 * Generate ETag for cache validation
 */
export function generateETag(data: any): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `"${hash}"`;
}
