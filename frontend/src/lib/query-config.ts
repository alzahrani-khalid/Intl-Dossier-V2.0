/**
 * Query Cache Configuration
 * Phase 3: Performance Improvements
 *
 * Provides consistent cache policies across the application.
 * These policies optimize for different data freshness requirements.
 */

import type { UseQueryOptions } from '@tanstack/react-query'

/**
 * Standard cache time policies
 *
 * - static: Data that rarely changes (enums, reference data)
 * - dynamic: Regular data that updates occasionally (dossiers, documents)
 * - realtime: Frequently changing data (tasks, notifications)
 * - critical: Data that must always be fresh (permissions, session)
 */
export const CACHE_POLICIES = {
  /**
   * Static data - 1 hour
   * Examples: Enum values, countries list, reference data
   */
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  /**
   * Dynamic data - 5 minutes
   * Examples: Dossiers, documents, positions
   */
  dynamic: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  /**
   * Realtime data - 30 seconds
   * Examples: Tasks, notifications, activity feeds
   */
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  /**
   * Critical data - Always fresh
   * Examples: Current user, permissions, session
   */
  critical: {
    staleTime: 0, // Always stale
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  /**
   * Infinite query data - For paginated lists
   */
  paginated: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
} as const

/**
 * Apply cache policy to query options
 *
 * @example
 * ```tsx
 * const { data } = useQuery({
 *   queryKey: ['dossiers'],
 *   queryFn: fetchDossiers,
 *   ...withCachePolicy('dynamic'),
 * });
 * ```
 */
export function withCachePolicy(
  policy: keyof typeof CACHE_POLICIES,
): Pick<UseQueryOptions, 'staleTime' | 'gcTime' | 'refetchOnWindowFocus' | 'refetchOnMount'> {
  return CACHE_POLICIES[policy]
}

/**
 * Query key factory patterns
 * Ensures consistent key naming and easy invalidation
 */
export const queryKeyPatterns = {
  // Dossiers
  dossiers: {
    all: ['dossiers'] as const,
    lists: () => [...queryKeyPatterns.dossiers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeyPatterns.dossiers.lists(), filters] as const,
    details: () => [...queryKeyPatterns.dossiers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeyPatterns.dossiers.details(), id] as const,
    statistics: (id: string) => [...queryKeyPatterns.dossiers.detail(id), 'statistics'] as const,
  },

  // Work items (unified)
  workItems: {
    all: ['work-items'] as const,
    lists: () => [...queryKeyPatterns.workItems.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeyPatterns.workItems.lists(), filters] as const,
    summary: (userId: string) => [...queryKeyPatterns.workItems.all, 'summary', userId] as const,
    metrics: (userId: string) => [...queryKeyPatterns.workItems.all, 'metrics', userId] as const,
    team: (managerId: string) => [...queryKeyPatterns.workItems.all, 'team', managerId] as const,
  },

  // Engagements
  engagements: {
    all: ['engagements'] as const,
    lists: () => [...queryKeyPatterns.engagements.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeyPatterns.engagements.lists(), filters] as const,
    detail: (id: string) => [...queryKeyPatterns.engagements.all, 'detail', id] as const,
    upcoming: () => [...queryKeyPatterns.engagements.all, 'upcoming'] as const,
  },

  // Positions
  positions: {
    all: ['positions'] as const,
    byDossier: (dossierId: string) =>
      [...queryKeyPatterns.positions.all, 'dossier', dossierId] as const,
    detail: (id: string) => [...queryKeyPatterns.positions.all, 'detail', id] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    byDossier: (dossierId: string) =>
      [...queryKeyPatterns.documents.all, 'dossier', dossierId] as const,
    detail: (id: string) => [...queryKeyPatterns.documents.all, 'detail', id] as const,
    recent: () => [...queryKeyPatterns.documents.all, 'recent'] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    semantic: (query: string, types: string[]) =>
      [...queryKeyPatterns.search.all, 'semantic', query, ...types] as const,
    global: (query: string) => [...queryKeyPatterns.search.all, 'global', query] as const,
  },

  // Current user
  currentUser: {
    all: ['current-user'] as const,
    profile: () => [...queryKeyPatterns.currentUser.all, 'profile'] as const,
    permissions: () => [...queryKeyPatterns.currentUser.all, 'permissions'] as const,
    preferences: () => [...queryKeyPatterns.currentUser.all, 'preferences'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeyPatterns.notifications.all, 'unread'] as const,
    list: (page?: number) => [...queryKeyPatterns.notifications.all, 'list', page] as const,
  },
} as const

/**
 * Suggested cache policies per query pattern
 */
export const recommendedPolicies: Record<string, keyof typeof CACHE_POLICIES> = {
  dossiers: 'dynamic',
  'work-items': 'realtime',
  engagements: 'dynamic',
  positions: 'dynamic',
  documents: 'dynamic',
  search: 'dynamic',
  'current-user': 'critical',
  notifications: 'realtime',
}

// ============================================================================
// Query Key Validation & Type Safety
// ============================================================================

/**
 * Valid top-level query key prefixes
 * Use these to ensure consistent key naming
 */
export const VALID_KEY_PREFIXES = [
  'dossiers',
  'work-items',
  'engagements',
  'positions',
  'documents',
  'search',
  'current-user',
  'notifications',
  'users',
  'roles',
  'delegations',
  'access-reviews',
  'sessions',
  'audit-logs',
  'dossier-overview',
  'relationships',
  'calendar',
  'contacts',
  'activity',
  'commitments',
  'tasks',
  'intake',
] as const

export type ValidKeyPrefix = (typeof VALID_KEY_PREFIXES)[number]

/**
 * Validate a query key follows conventions
 * Use in development to catch inconsistent key usage
 */
export function validateQueryKey(key: readonly unknown[]): boolean {
  if (key.length === 0) {
    console.warn('[Query Key] Empty query key is not recommended')
    return false
  }

  const prefix = key[0]
  if (typeof prefix !== 'string') {
    console.warn('[Query Key] First element should be a string prefix')
    return false
  }

  if (!VALID_KEY_PREFIXES.includes(prefix as ValidKeyPrefix)) {
    console.warn(
      `[Query Key] Unknown prefix "${prefix}". Consider adding it to VALID_KEY_PREFIXES.`,
    )
    return false
  }

  return true
}

/**
 * Create a validated query key with type safety
 *
 * @example
 * ```typescript
 * // Type-safe key creation
 * const key = createQueryKey('dossiers', 'detail', dossierId)
 * // Results in: ['dossiers', 'detail', dossierId]
 * ```
 */
export function createQueryKey<T extends readonly unknown[]>(
  prefix: ValidKeyPrefix,
  ...parts: T
): readonly [ValidKeyPrefix, ...T] {
  return [prefix, ...parts] as const
}

/**
 * Get cache policy for a query key based on its prefix
 */
export function getCachePolicyForKey(
  key: readonly unknown[],
): (typeof CACHE_POLICIES)[keyof typeof CACHE_POLICIES] {
  const prefix = key[0] as string
  const policyName = recommendedPolicies[prefix] || 'dynamic'
  return CACHE_POLICIES[policyName]
}

/**
 * Hook helper: Apply recommended cache policy based on query key
 *
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: queryKeyPatterns.dossiers.detail(id),
 *   queryFn: () => fetchDossier(id),
 *   ...withAutoCachePolicy(queryKeyPatterns.dossiers.detail(id)),
 * })
 * ```
 */
export function withAutoCachePolicy(
  key: readonly unknown[],
): Pick<UseQueryOptions, 'staleTime' | 'gcTime' | 'refetchOnWindowFocus' | 'refetchOnMount'> {
  return getCachePolicyForKey(key)
}

/**
 * Development-only query key validation wrapper
 * In production, this is a no-op
 */
export function assertValidQueryKey(key: readonly unknown[]): void {
  if (import.meta.env.DEV) {
    validateQueryKey(key)
  }
}
