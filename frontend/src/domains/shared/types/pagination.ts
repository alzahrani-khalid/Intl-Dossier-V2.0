/**
 * Shared Kernel - Pagination Types
 *
 * Standardized pagination types for consistent API responses
 * across all bounded contexts.
 */

/**
 * Offset-based pagination metadata
 */
export interface OffsetPagination {
  /** Current page number (0-indexed) */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether more pages exist */
  has_more: boolean
}

/**
 * Cursor-based pagination metadata
 */
export interface CursorPagination {
  /** Maximum items per page */
  limit: number
  /** Offset for pagination */
  offset: number
  /** Whether more items exist */
  has_more: boolean
  /** Next cursor for pagination */
  next_cursor?: string
  /** Previous cursor for pagination */
  prev_cursor?: string
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[]
  /** Pagination metadata */
  pagination: OffsetPagination | CursorPagination
}

/**
 * Pagination request parameters for offset-based pagination
 */
export interface OffsetPaginationParams {
  page?: number
  limit?: number
}

/**
 * Pagination request parameters for cursor-based pagination
 */
export interface CursorPaginationParams {
  cursor?: string
  limit?: number
  direction?: 'forward' | 'backward'
}

/**
 * Helper to create default offset pagination
 */
export function createDefaultOffsetPagination(page = 0, limit = 20, total = 0): OffsetPagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    has_more: (page + 1) * limit < total,
  }
}

/**
 * Helper to create default cursor pagination
 */
export function createDefaultCursorPagination(
  limit = 20,
  offset = 0,
  has_more = false,
): CursorPagination {
  return {
    limit,
    offset,
    has_more,
  }
}

/**
 * Type guard for OffsetPagination
 */
export function isOffsetPagination(
  pagination: OffsetPagination | CursorPagination,
): pagination is OffsetPagination {
  return 'page' in pagination && 'total' in pagination
}

/**
 * Type guard for CursorPagination
 */
export function isCursorPagination(
  pagination: OffsetPagination | CursorPagination,
): pagination is CursorPagination {
  return !('page' in pagination) || !('total' in pagination)
}
