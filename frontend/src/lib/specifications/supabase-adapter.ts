/**
 * Supabase Query Adapter
 *
 * Provides utilities for converting specifications to Supabase queries
 * and building complex filter strings.
 *
 * @module specifications/supabase-adapter
 */

import type { Specification, SupabaseQueryBuilder, FilterOperator } from './types'

// ============================================
// Query Helper Functions
// ============================================

/**
 * Apply a specification to a Supabase query
 */
export function applySpecification<T, QueryBuilder extends SupabaseQueryBuilder>(
  query: QueryBuilder,
  spec: Specification<T>,
): QueryBuilder {
  return spec.toSupabaseFilter(query)
}

/**
 * Apply multiple specifications to a Supabase query (AND logic)
 */
export function applySpecifications<T, QueryBuilder extends SupabaseQueryBuilder>(
  query: QueryBuilder,
  specs: Specification<T>[],
): QueryBuilder {
  let result = query
  for (const spec of specs) {
    result = spec.toSupabaseFilter(result) as QueryBuilder
  }
  return result
}

// ============================================
// Filter String Builder
// ============================================

/**
 * Build a Supabase filter string for OR conditions
 */
export function buildOrFilterString(
  conditions: Array<{
    column: string
    operator: FilterOperator
    value: unknown
  }>,
): string {
  return conditions
    .map((c) => buildFilterClause(c.column, c.operator, c.value))
    .filter(Boolean)
    .join(',')
}

/**
 * Build a single filter clause string
 */
export function buildFilterClause(
  column: string,
  operator: FilterOperator,
  value: unknown,
): string {
  // Escape special characters in values
  const escapeValue = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const str = String(v)
    // Escape commas and parentheses for Supabase filter strings
    return str.replace(/[(),]/g, (match) => `\\${match}`)
  }

  switch (operator) {
    case 'equals':
      return `${column}.eq.${escapeValue(value)}`
    case 'not_equals':
      return `${column}.neq.${escapeValue(value)}`
    case 'contains':
      return `${column}.ilike.*${escapeValue(value)}*`
    case 'not_contains':
      return `${column}.not.ilike.*${escapeValue(value)}*`
    case 'starts_with':
      return `${column}.ilike.${escapeValue(value)}*`
    case 'ends_with':
      return `${column}.ilike.*${escapeValue(value)}`
    case 'greater_than':
      return `${column}.gt.${escapeValue(value)}`
    case 'less_than':
      return `${column}.lt.${escapeValue(value)}`
    case 'greater_equal':
      return `${column}.gte.${escapeValue(value)}`
    case 'less_equal':
      return `${column}.lte.${escapeValue(value)}`
    case 'in':
      if (!Array.isArray(value)) return ''
      return `${column}.in.(${value.map(escapeValue).join(',')})`
    case 'not_in':
      if (!Array.isArray(value)) return ''
      return `${column}.not.in.(${value.map(escapeValue).join(',')})`
    case 'is_null':
      return `${column}.is.null`
    case 'is_not_null':
      return `${column}.not.is.null`
    case 'matches_regex':
      return `${column}.match.${escapeValue(value)}`
    default:
      return ''
  }
}

// ============================================
// Query Builder Utilities
// ============================================

/**
 * Options for query building
 */
export interface QueryOptions {
  select?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
  cursor?: {
    column: string
    value: unknown
    direction: 'after' | 'before'
  }
}

/**
 * Apply common query options to a Supabase query
 */
export function applyQueryOptions<QueryBuilder extends SupabaseQueryBuilder>(
  query: QueryBuilder,
  options: QueryOptions,
): QueryBuilder {
  let result = query

  // Apply ordering
  if (options.orderBy) {
    result = result.order(options.orderBy, {
      ascending: options.orderDirection !== 'desc',
    }) as QueryBuilder
  }

  // Apply cursor pagination
  if (options.cursor) {
    const { column, value, direction } = options.cursor
    if (direction === 'after') {
      result = result.gt(column, value) as QueryBuilder
    } else {
      result = result.lt(column, value) as QueryBuilder
    }
  }

  // Apply offset pagination
  if (options.offset !== undefined || options.limit !== undefined) {
    const offset = options.offset ?? 0
    const limit = options.limit ?? 50
    result = result.range(offset, offset + limit - 1) as QueryBuilder
  }

  return result
}

// ============================================
// Date Filter Utilities
// ============================================

/**
 * Calculate date range from preset
 */
export function getDateRangeFromPreset(preset: string): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    case 'yesterday': {
      const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    }
    case 'last_7_days':
      return {
        from: new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'last_30_days':
      return {
        from: new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'last_90_days':
      return {
        from: new Date(startOfDay.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    case 'this_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      }
    case 'next_7_days':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000),
      }
    case 'next_30_days':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 30 * 24 * 60 * 60 * 1000),
      }
    default:
      return { from: startOfDay, to: now }
  }
}

/**
 * Format date for Supabase query
 */
export function formatDateForQuery(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

// ============================================
// RPC Helper
// ============================================

/**
 * Convert specification parameters to RPC function arguments
 */
export function specToRPCParams<T>(
  spec: Specification<T>,
  paramPrefix = 'p_',
): Record<string, unknown> {
  const json = (spec as { toJSON?: () => { params?: Record<string, unknown> } }).toJSON?.()
  if (!json?.params) return {}

  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(json.params)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    params[`${paramPrefix}${snakeKey}`] = value
  }

  return params
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if a value is a valid Supabase query builder
 */
export function isSupabaseQueryBuilder(value: unknown): value is SupabaseQueryBuilder {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.eq === 'function' &&
    typeof obj.neq === 'function' &&
    typeof obj.gt === 'function' &&
    typeof obj.gte === 'function' &&
    typeof obj.lt === 'function' &&
    typeof obj.lte === 'function' &&
    typeof obj.in === 'function' &&
    typeof obj.is === 'function' &&
    typeof obj.or === 'function'
  )
}
