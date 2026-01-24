/**
 * Content Expiration Management Hooks
 * @module hooks/useContentExpiration
 * @feature content-expiration-dates
 *
 * TanStack Query hooks for managing content expiration dates, review workflows,
 * and automated expiration notifications for dossiers, briefs, and positions.
 *
 * @description
 * This module provides a comprehensive set of React hooks for content lifecycle management:
 * - Query hooks for expiring content, expiration status, stats, rules, and history
 * - Mutation hooks for setting expiration dates, extending deadlines, and marking reviewed
 * - Review workflow management with request/approval tracking
 * - Automated expiration notifications and alerts
 * - Dashboard statistics for expiration monitoring
 * - Type-specific expiration rules and policies
 *
 * @example
 * // Monitor expiring content in dashboard
 * const { expiringContent, expirationStats } = useContentExpiration({
 *   daysAhead: 30,
 *   includeExpired: true,
 * });
 *
 * @example
 * // Manage specific entity expiration
 * const { expirationStatus, setExpiration } = useEntityExpiration('dossier', 'uuid');
 * await setExpiration({
 *   entity_type: 'dossier',
 *   entity_id: 'uuid',
 *   expires_at: '2025-12-31',
 * });
 *
 * @example
 * // Review workflow
 * const { markAsReviewed, requestReview } = useContentExpiration({ entityType, entityId });
 * await requestReview({ entity_type: 'brief', entity_id: 'uuid', reviewer_id: 'user-uuid' });
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ContentExpirationStatus,
  ContentExpirationRule,
  ContentExpirationHistory,
  ContentExpirationStats,
  ExpiringContentItem,
  SetExpirationRequest,
  ExtendExpirationRequest,
  MarkReviewedRequest,
  RequestReviewRequest,
  UseContentExpirationOptions,
  ExpirationEntityType,
  SetExpirationResponse,
  ExtendExpirationResponse,
  MarkReviewedResponse,
  RequestReviewResponse,
} from '@/types/content-expiration.types'

const FUNCTION_URL = '/functions/v1/content-expiration'

/**
 * Query Keys Factory for content expiration queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for expiring content,
 * status, statistics, rules, and history.
 *
 * @example
 * // Invalidate all expiration queries
 * queryClient.invalidateQueries({ queryKey: contentExpirationKeys.all });
 *
 * @example
 * // Invalidate specific entity status
 * queryClient.invalidateQueries({
 *   queryKey: contentExpirationKeys.status('dossier', 'uuid')
 * });
 *
 * @example
 * // Invalidate expiring content with filters
 * queryClient.invalidateQueries({
 *   queryKey: contentExpirationKeys.expiring('dossier', 30, false)
 * });
 */
export const contentExpirationKeys = {
  all: ['content-expiration'] as const,
  expiring: (entityType?: string, daysAhead?: number, includeExpired?: boolean) =>
    [...contentExpirationKeys.all, 'expiring', { entityType, daysAhead, includeExpired }] as const,
  status: (entityType: string, entityId: string) =>
    [...contentExpirationKeys.all, 'status', entityType, entityId] as const,
  stats: (forUser?: boolean) => [...contentExpirationKeys.all, 'stats', { forUser }] as const,
  rules: (entityType?: string) => [...contentExpirationKeys.all, 'rules', { entityType }] as const,
  history: (entityType: string, entityId: string) =>
    [...contentExpirationKeys.all, 'history', entityType, entityId] as const,
}

// API functions
async function fetchExpiringContent(
  entityType?: ExpirationEntityType,
  daysAhead: number = 30,
  includeExpired: boolean = false,
  limit: number = 100,
): Promise<ExpiringContentItem[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'list',
    days_ahead: daysAhead.toString(),
    include_expired: includeExpired.toString(),
    limit: limit.toString(),
  })

  if (entityType) {
    params.set('entity_type', entityType)
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiring content')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationStatus(
  entityType: ExpirationEntityType,
  entityId: string,
): Promise<ContentExpirationStatus | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'status',
    entity_type: entityType,
    entity_id: entityId,
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration status')
  }

  const result = await response.json()
  return result.data
}

async function fetchExpirationStats(forUser: boolean = false): Promise<ContentExpirationStats[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'stats',
    for_user: forUser.toString(),
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration stats')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationRules(
  entityType?: ExpirationEntityType,
): Promise<ContentExpirationRule[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({ action: 'rules' })

  if (entityType) {
    params.set('entity_type', entityType)
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration rules')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationHistory(
  entityType: ExpirationEntityType,
  entityId: string,
  limit: number = 50,
): Promise<ContentExpirationHistory[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'history',
    entity_type: entityType,
    entity_id: entityId,
    limit: limit.toString(),
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration history')
  }

  const result = await response.json()
  return result.data || []
}

// Mutation functions
async function setExpiration(params: SetExpirationRequest): Promise<SetExpirationResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/set`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to set expiration')
  }

  return response.json()
}

async function extendExpiration(
  params: ExtendExpirationRequest,
): Promise<ExtendExpirationResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/extend`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extend expiration')
  }

  return response.json()
}

async function markAsReviewed(params: MarkReviewedRequest): Promise<MarkReviewedResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark as reviewed')
  }

  return response.json()
}

async function requestReview(params: RequestReviewRequest): Promise<RequestReviewResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/request-review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to request review')
  }

  return response.json()
}

/**
 * Hook for comprehensive content expiration management
 *
 * @description
 * Main hook providing complete content expiration lifecycle management including:
 * - Fetching expiring content with customizable time horizons
 * - Querying expiration status for specific entities
 * - Retrieving expiration statistics and analytics
 * - Managing expiration rules and policies
 * - Viewing expiration history and audit trails
 * - Setting and extending expiration dates
 * - Marking content as reviewed
 * - Requesting and managing review workflows
 *
 * @param options - Configuration object for queries and filters
 * @param options.entityType - Filter by entity type ('dossier', 'brief', 'position')
 * @param options.entityId - Specific entity ID for status/history queries
 * @param options.daysAhead - Days ahead to check for expiring content (default: 30)
 * @param options.includeExpired - Include already-expired content (default: false)
 * @param options.forCurrentUser - Filter stats to current user's content (default: false)
 * @param options.enabled - Enable/disable queries (default: true)
 * @returns Object with query data, mutations, loading states, and utilities
 *
 * @example
 * // Dashboard expiration monitoring
 * const {
 *   expiringContent,
 *   expirationStats,
 *   isLoadingContent,
 * } = useContentExpiration({
 *   daysAhead: 30,
 *   includeExpired: false,
 * });
 * console.log(expiringContent); // Array of items expiring in next 30 days
 *
 * @example
 * // Manage specific entity expiration
 * const {
 *   expirationStatus,
 *   setExpiration,
 *   extendExpiration,
 * } = useContentExpiration({
 *   entityType: 'dossier',
 *   entityId: 'country-uuid',
 * });
 * await setExpiration({
 *   entity_type: 'dossier',
 *   entity_id: 'country-uuid',
 *   expires_at: '2025-12-31T23:59:59Z',
 *   alert_before_days: 30,
 * });
 *
 * @example
 * // Review workflow
 * const { markAsReviewed, requestReview } = useContentExpiration({
 *   entityType: 'brief',
 *   entityId: 'brief-uuid',
 * });
 * await requestReview({
 *   entity_type: 'brief',
 *   entity_id: 'brief-uuid',
 *   reviewer_id: 'manager-uuid',
 *   notes: 'Please review before expiration',
 * });
 * // Later, after review...
 * await markAsReviewed({
 *   entity_type: 'brief',
 *   entity_id: 'brief-uuid',
 *   should_extend: true,
 *   extend_by_days: 90,
 * });
 *
 * @example
 * // User-specific expiration stats
 * const { expirationStats } = useContentExpiration({
 *   forCurrentUser: true,
 * });
 * // Stats filtered to user's owned/assigned content
 */
export function useContentExpiration(options: UseContentExpirationOptions = {}) {
  const {
    entityType,
    entityId,
    daysAhead = 30,
    includeExpired = false,
    forCurrentUser = false,
    enabled = true,
  } = options

  const queryClient = useQueryClient()

  // Expiring content query
  const expiringContentQuery = useQuery({
    queryKey: contentExpirationKeys.expiring(entityType, daysAhead, includeExpired),
    queryFn: () => fetchExpiringContent(entityType, daysAhead, includeExpired),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Expiration status query (for specific entity)
  const statusQuery = useQuery({
    queryKey: contentExpirationKeys.status(entityType || '', entityId || ''),
    queryFn: () => fetchExpirationStatus(entityType!, entityId!),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Stats query
  const statsQuery = useQuery({
    queryKey: contentExpirationKeys.stats(forCurrentUser),
    queryFn: () => fetchExpirationStats(forCurrentUser),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Rules query
  const rulesQuery = useQuery({
    queryKey: contentExpirationKeys.rules(entityType),
    queryFn: () => fetchExpirationRules(entityType),
    enabled: enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes (rules don't change often)
  })

  // History query (for specific entity)
  const historyQuery = useQuery({
    queryKey: contentExpirationKeys.history(entityType || '', entityId || ''),
    queryFn: () => fetchExpirationHistory(entityType!, entityId!),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Mutations
  const setExpirationMutation = useMutation({
    mutationFn: setExpiration,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const extendExpirationMutation = useMutation({
    mutationFn: extendExpiration,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const markAsReviewedMutation = useMutation({
    mutationFn: markAsReviewed,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const requestReviewMutation = useMutation({
    mutationFn: requestReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  // Refetch all function
  const refetchAll = async () => {
    await Promise.all([
      expiringContentQuery.refetch(),
      statusQuery.refetch(),
      statsQuery.refetch(),
      historyQuery.refetch(),
    ])
  }

  return {
    // Query data
    expiringContent: expiringContentQuery.data || [],
    expirationStatus: statusQuery.data || null,
    expirationStats: statsQuery.data || [],
    expirationRules: rulesQuery.data || [],
    expirationHistory: historyQuery.data || [],

    // Loading states
    isLoadingContent: expiringContentQuery.isLoading,
    isLoadingStatus: statusQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingRules: rulesQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,

    // Error states
    contentError: expiringContentQuery.error,
    statusError: statusQuery.error,
    statsError: statsQuery.error,
    rulesError: rulesQuery.error,
    historyError: historyQuery.error,

    // Mutations
    setExpiration: setExpirationMutation.mutateAsync,
    extendExpiration: extendExpirationMutation.mutateAsync,
    markAsReviewed: markAsReviewedMutation.mutateAsync,
    requestReview: requestReviewMutation.mutateAsync,

    // Mutation states
    isSettingExpiration: setExpirationMutation.isPending,
    isExtending: extendExpirationMutation.isPending,
    isMarking: markAsReviewedMutation.isPending,
    isRequesting: requestReviewMutation.isPending,

    // Utility
    refetchAll,
  }
}

/**
 * Convenience hook for managing a specific entity's expiration
 *
 * @description
 * Simplified hook focused on a single entity's expiration management.
 * Automatically configures queries for the specified entity and provides
 * all expiration management functions in a concise interface.
 *
 * @param entityType - Type of entity ('dossier', 'brief', 'position')
 * @param entityId - Unique identifier of the entity
 * @param options - Additional options (excludes entityType and entityId)
 * @returns Same as useContentExpiration but focused on single entity
 *
 * @example
 * // Manage dossier expiration in detail view
 * const {
 *   expirationStatus,
 *   expirationHistory,
 *   setExpiration,
 *   extendExpiration,
 *   markAsReviewed,
 * } = useEntityExpiration('dossier', dossierId);
 *
 * @example
 * // Display expiration badge
 * const { expirationStatus } = useEntityExpiration('brief', briefId);
 * {expirationStatus?.is_expired && <Badge variant="destructive">Expired</Badge>}
 * {expirationStatus?.is_expiring_soon && <Badge variant="warning">Expiring Soon</Badge>}
 */
export function useEntityExpiration(
  entityType: ExpirationEntityType,
  entityId: string,
  options: Omit<UseContentExpirationOptions, 'entityType' | 'entityId'> = {},
) {
  return useContentExpiration({
    ...options,
    entityType,
    entityId,
  })
}

/**
 * Hook for dashboard expiration overview with comprehensive data
 *
 * @description
 * Preconfigured hook for dashboard views showing expiration overview.
 * Fetches expiring content for the next 30 days including already-expired items,
 * with optional filtering to current user's content.
 *
 * @param forCurrentUser - Filter to current user's content only (default: false)
 * @returns Expiration data optimized for dashboard display
 *
 * @example
 * // System-wide expiration dashboard
 * const { expiringContent, expirationStats } = useExpirationOverview(false);
 * // Shows all content expiring in next 30 days
 *
 * @example
 * // Personal expiration dashboard
 * const { expiringContent, expirationStats } = useExpirationOverview(true);
 * // Shows only user's content expiring in next 30 days
 *
 * @example
 * // Expiration summary widget
 * const { expirationStats } = useExpirationOverview();
 * const totalExpiring = expirationStats.reduce((sum, stat) => sum + stat.count, 0);
 * <Card>
 *   <h3>{totalExpiring} items expiring soon</h3>
 *   {expirationStats.map(stat => (
 *     <div key={stat.entity_type}>
 *       {stat.entity_type}: {stat.count}
 *     </div>
 *   ))}
 * </Card>
 */
export function useExpirationOverview(forCurrentUser: boolean = false) {
  return useContentExpiration({
    forCurrentUser,
    daysAhead: 30,
    includeExpired: true,
  })
}

export default useContentExpiration
