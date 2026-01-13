/**
 * Graph Traversal Hooks
 * Feature: relationship-graph-traversal
 *
 * TanStack Query hooks for advanced graph traversal operations including:
 * - Bidirectional N-degree traversal
 * - Shortest path finding
 * - All paths between entities
 * - Connected entities discovery
 * - Relationship chain pattern matching
 * - Common connections analysis
 * - Graph statistics
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type {
  TraverseBidirectionalParams,
  TraverseBidirectionalResponse,
  ShortestPathParams,
  ShortestPathResponse,
  AllPathsParams,
  AllPathsResponse,
  ConnectedEntitiesParams,
  ConnectedEntitiesResponse,
  RelationshipChainParams,
  RelationshipChainResponse,
  CommonConnectionsParams,
  CommonConnectionsResponse,
  GraphStatisticsParams,
  GraphStatisticsResponse,
  GraphTraversalError,
} from '@/types/graph-traversal.types'

// ============================================
// API Client
// ============================================

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-traversal-advanced`

async function fetchGraphAPI<T>(operation: string, params: Record<string, unknown>): Promise<T> {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
  }

  // Convert params to query string for GET requests
  const queryParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        queryParams.set(key, JSON.stringify(value))
      } else {
        queryParams.set(key, String(value))
      }
    }
  })

  const url = `${EDGE_FUNCTION_URL}/${operation}?${queryParams.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error = new Error(errorData.error || 'Graph traversal failed') as GraphTraversalError
    error.statusCode = response.status
    throw error
  }

  return response.json()
}

// ============================================
// Query Keys
// ============================================

export const graphTraversalKeys = {
  all: ['graph-traversal'] as const,

  traverse: (params: TraverseBidirectionalParams) =>
    [...graphTraversalKeys.all, 'traverse', params] as const,

  shortestPath: (params: ShortestPathParams) =>
    [...graphTraversalKeys.all, 'shortest-path', params] as const,

  allPaths: (params: AllPathsParams) => [...graphTraversalKeys.all, 'all-paths', params] as const,

  connectedEntities: (params: ConnectedEntitiesParams) =>
    [...graphTraversalKeys.all, 'connected-entities', params] as const,

  relationshipChain: (params: RelationshipChainParams) =>
    [...graphTraversalKeys.all, 'relationship-chain', params] as const,

  commonConnections: (params: CommonConnectionsParams) =>
    [...graphTraversalKeys.all, 'common-connections', params] as const,

  statistics: (params: GraphStatisticsParams) =>
    [...graphTraversalKeys.all, 'statistics', params] as const,
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for bidirectional N-degree graph traversal
 *
 * @param params - Traversal parameters
 * @param options - TanStack Query options
 *
 * @example
 * const { data, isLoading } = useGraphTraverse({
 *   startDossierId: 'uuid',
 *   maxDegrees: 3,
 *   relationshipTypes: ['member_of', 'cooperates_with'],
 * });
 */
export function useGraphTraverse(
  params: TraverseBidirectionalParams,
  options?: Omit<
    UseQueryOptions<TraverseBidirectionalResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.traverse(params),
    queryFn: () =>
      fetchGraphAPI<TraverseBidirectionalResponse>('traverse', {
        startDossierId: params.startDossierId,
        maxDegrees: params.maxDegrees,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
        dossierTypeFilter: params.dossierTypeFilter,
      }),
    enabled: !!params.startDossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
    meta: {
      errorMessage: t('errors.traverseFailed', 'Failed to traverse graph'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for finding shortest path between two entities
 *
 * @param params - Path finding parameters
 * @param options - TanStack Query options
 *
 * @example
 * const { data } = useShortestPath({
 *   sourceId: 'uuid1',
 *   targetId: 'uuid2',
 *   maxDepth: 5,
 * });
 */
export function useShortestPath(
  params: ShortestPathParams,
  options?: Omit<
    UseQueryOptions<ShortestPathResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.shortestPath(params),
    queryFn: () =>
      fetchGraphAPI<ShortestPathResponse>('shortest-path', {
        sourceId: params.sourceId,
        targetId: params.targetId,
        maxDepth: params.maxDepth,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    enabled: !!params.sourceId && !!params.targetId,
    staleTime: 5 * 60 * 1000,
    ...options,
    meta: {
      errorMessage: t('errors.shortestPathFailed', 'Failed to find shortest path'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for finding all paths between two entities
 *
 * @param params - All paths parameters
 * @param options - TanStack Query options
 *
 * @example
 * const { data } = useAllPaths({
 *   sourceId: 'uuid1',
 *   targetId: 'uuid2',
 *   maxDepth: 4,
 *   maxPaths: 10,
 * });
 */
export function useAllPaths(
  params: AllPathsParams,
  options?: Omit<UseQueryOptions<AllPathsResponse, GraphTraversalError>, 'queryKey' | 'queryFn'>,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.allPaths(params),
    queryFn: () =>
      fetchGraphAPI<AllPathsResponse>('all-paths', {
        sourceId: params.sourceId,
        targetId: params.targetId,
        maxDepth: params.maxDepth,
        maxPaths: params.maxPaths,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    enabled: !!params.sourceId && !!params.targetId,
    staleTime: 5 * 60 * 1000,
    ...options,
    meta: {
      errorMessage: t('errors.allPathsFailed', 'Failed to find paths'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for finding all connected entities
 *
 * @param params - Connected entities parameters
 * @param options - TanStack Query options
 *
 * @example
 * const { data } = useConnectedEntities({
 *   startDossierId: 'uuid',
 *   maxEntities: 100,
 *   dossierTypeFilter: ['country', 'organization'],
 * });
 */
export function useConnectedEntities(
  params: ConnectedEntitiesParams,
  options?: Omit<
    UseQueryOptions<ConnectedEntitiesResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.connectedEntities(params),
    queryFn: () =>
      fetchGraphAPI<ConnectedEntitiesResponse>('connected-entities', {
        startDossierId: params.startDossierId,
        maxEntities: params.maxEntities,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
        dossierTypeFilter: params.dossierTypeFilter,
      }),
    enabled: !!params.startDossierId,
    staleTime: 5 * 60 * 1000,
    ...options,
    meta: {
      errorMessage: t('errors.connectedEntitiesFailed', 'Failed to find connected entities'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for finding relationship chain patterns
 *
 * @param params - Relationship chain parameters
 * @param options - TanStack Query options
 *
 * @example
 * // Find: Country -> member_of -> Organization -> participates_in -> Forum
 * const { data } = useRelationshipChain({
 *   startDossierId: 'country-uuid',
 *   relationshipChain: ['member_of', 'participates_in'],
 * });
 */
export function useRelationshipChain(
  params: RelationshipChainParams,
  options?: Omit<
    UseQueryOptions<RelationshipChainResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.relationshipChain(params),
    queryFn: () =>
      fetchGraphAPI<RelationshipChainResponse>('relationship-chain', {
        startDossierId: params.startDossierId,
        relationshipChain: params.relationshipChain,
        bidirectionalChain: params.bidirectionalChain,
      }),
    enabled: !!params.startDossierId && params.relationshipChain?.length > 0,
    staleTime: 5 * 60 * 1000,
    ...options,
    meta: {
      errorMessage: t('errors.relationshipChainFailed', 'Failed to find relationship chains'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for finding common connections between two entities
 *
 * @param params - Common connections parameters
 * @param options - TanStack Query options
 *
 * @example
 * const { data } = useCommonConnections({
 *   dossierAId: 'uuid1',
 *   dossierBId: 'uuid2',
 * });
 */
export function useCommonConnections(
  params: CommonConnectionsParams,
  options?: Omit<
    UseQueryOptions<CommonConnectionsResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.commonConnections(params),
    queryFn: () =>
      fetchGraphAPI<CommonConnectionsResponse>('common-connections', {
        dossierAId: params.dossierAId,
        dossierBId: params.dossierBId,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    enabled: !!params.dossierAId && !!params.dossierBId,
    staleTime: 5 * 60 * 1000,
    ...options,
    meta: {
      errorMessage: t('errors.commonConnectionsFailed', 'Failed to find common connections'),
      ...options?.meta,
    },
  })
}

/**
 * Hook for getting graph statistics
 *
 * @param params - Statistics parameters (optional startDossierId for subgraph)
 * @param options - TanStack Query options
 *
 * @example
 * // Full graph statistics
 * const { data } = useGraphStatistics({});
 *
 * // Subgraph statistics
 * const { data } = useGraphStatistics({
 *   startDossierId: 'uuid',
 *   maxDegrees: 3,
 * });
 */
export function useGraphStatistics(
  params: GraphStatisticsParams = {},
  options?: Omit<
    UseQueryOptions<GraphStatisticsResponse, GraphTraversalError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { t } = useTranslation('graph-traversal')

  return useQuery({
    queryKey: graphTraversalKeys.statistics(params),
    queryFn: () =>
      fetchGraphAPI<GraphStatisticsResponse>('statistics', {
        startDossierId: params.startDossierId,
        maxDegrees: params.maxDegrees,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes for statistics
    ...options,
    meta: {
      errorMessage: t('errors.statisticsFailed', 'Failed to load graph statistics'),
      ...options?.meta,
    },
  })
}

// ============================================
// Mutation Hooks (for operations that might be expensive)
// ============================================

/**
 * Mutation hook for on-demand shortest path finding
 * Use when you need to trigger path finding manually (e.g., button click)
 */
export function useFindShortestPathMutation() {
  const { t } = useTranslation('graph-traversal')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: ShortestPathParams) =>
      fetchGraphAPI<ShortestPathResponse>('shortest-path', {
        sourceId: params.sourceId,
        targetId: params.targetId,
        maxDepth: params.maxDepth,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    onSuccess: (data, params) => {
      // Cache the result
      queryClient.setQueryData(graphTraversalKeys.shortestPath(params), data)

      if (data.found) {
        toast.success(
          t('success.pathFound', {
            length: data.path_length,
            defaultValue: 'Path found with {{length}} hops',
          }),
        )
      } else {
        toast.info(t('info.noPathFound', 'No path found between entities'))
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.shortestPathFailed', 'Failed to find path'))
    },
  })
}

/**
 * Mutation hook for on-demand all paths finding
 */
export function useFindAllPathsMutation() {
  const { t } = useTranslation('graph-traversal')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: AllPathsParams) =>
      fetchGraphAPI<AllPathsResponse>('all-paths', {
        sourceId: params.sourceId,
        targetId: params.targetId,
        maxDepth: params.maxDepth,
        maxPaths: params.maxPaths,
        relationshipTypes: params.relationshipTypes,
        includeInactive: params.includeInactive,
      }),
    onSuccess: (data, params) => {
      queryClient.setQueryData(graphTraversalKeys.allPaths(params), data)

      toast.success(
        t('success.pathsFound', {
          count: data.path_count,
          defaultValue: 'Found {{count}} path(s)',
        }),
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || t('errors.allPathsFailed', 'Failed to find paths'))
    },
  })
}

// ============================================
// Prefetch Hooks
// ============================================

/**
 * Hook to prefetch graph data (useful for hover effects)
 */
export function usePrefetchGraphTraverse() {
  const queryClient = useQueryClient()

  return (params: TraverseBidirectionalParams) => {
    if (!params.startDossierId) return

    queryClient.prefetchQuery({
      queryKey: graphTraversalKeys.traverse(params),
      queryFn: () =>
        fetchGraphAPI<TraverseBidirectionalResponse>('traverse', {
          startDossierId: params.startDossierId,
          maxDegrees: params.maxDegrees || 2,
          relationshipTypes: params.relationshipTypes,
          includeInactive: params.includeInactive,
          dossierTypeFilter: params.dossierTypeFilter,
        }),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook to prefetch connected entities
 */
export function usePrefetchConnectedEntities() {
  const queryClient = useQueryClient()

  return (params: ConnectedEntitiesParams) => {
    if (!params.startDossierId) return

    queryClient.prefetchQuery({
      queryKey: graphTraversalKeys.connectedEntities(params),
      queryFn: () =>
        fetchGraphAPI<ConnectedEntitiesResponse>('connected-entities', {
          startDossierId: params.startDossierId,
          maxEntities: params.maxEntities || 50,
          relationshipTypes: params.relationshipTypes,
          includeInactive: params.includeInactive,
          dossierTypeFilter: params.dossierTypeFilter,
        }),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================
// Invalidation Hooks
// ============================================

/**
 * Hook to invalidate all graph traversal queries
 * Useful after relationship mutations
 */
export function useInvalidateGraphTraversal() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: graphTraversalKeys.all })
  }
}

/**
 * Hook to invalidate graph queries for a specific dossier
 */
export function useInvalidateGraphForDossier() {
  const queryClient = useQueryClient()

  return (dossierId: string) => {
    // Invalidate all queries that might involve this dossier
    queryClient.invalidateQueries({
      queryKey: graphTraversalKeys.all,
      predicate: (query) => {
        const key = query.queryKey
        // Check if the dossierId appears anywhere in the query key
        return JSON.stringify(key).includes(dossierId)
      },
    })
  }
}
