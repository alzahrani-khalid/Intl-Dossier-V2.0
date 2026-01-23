/**
 * Relationship Hooks
 * @module hooks/useRelationships
 * @feature 026-unified-dossier-architecture
 * @feature 029-dynamic-country-intelligence
 *
 * TanStack Query hooks for dossier relationship CRUD operations with automatic caching,
 * cache invalidation, optimistic updates, and graph traversal support.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing dossier relationships:
 * - Query hooks for fetching single relationships, lists, and type-specific collections
 * - Mutation hooks for create, update, and delete operations with optimistic updates
 * - Relationship filtering by type, dossier, and custom criteria
 * - Bidirectional relationship queries (source ↔ target)
 * - Graph traversal for multi-degree network visualization
 * - Prefetch and cache invalidation utilities
 *
 * @example
 * // Fetch a single relationship
 * const { data, isLoading } = useRelationship('relationship-uuid');
 *
 * @example
 * // Fetch all relationships for a dossier
 * const { data } = useRelationshipsForDossier('dossier-uuid');
 *
 * @example
 * // Create a new relationship
 * const { mutate } = useCreateRelationship();
 * mutate({
 *   source_dossier_id: 'country-uuid',
 *   target_dossier_id: 'org-uuid',
 *   relationship_type: 'bilateral_relation',
 *   relationship_strength: 'primary'
 * });
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createRelationship,
  getRelationship,
  updateRelationship,
  deleteRelationship,
  listRelationships,
  getRelationshipsForDossier,
  getRelationshipsByType,
  type CreateRelationshipRequest,
  type UpdateRelationshipRequest,
  type RelationshipFilters,
  type RelationshipWithDossiers,
  type RelationshipsListResponse,
  type RelationshipType,
  RelationshipAPIError,
} from '@/services/relationship-api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

/**
 * Query Keys Factory for relationship-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for relationships.
 *
 * @example
 * // Invalidate all relationship queries
 * queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });
 *
 * @example
 * // Invalidate specific relationship detail
 * queryClient.invalidateQueries({ queryKey: relationshipKeys.detail('uuid') });
 */
export const relationshipKeys = {
  all: ['relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (filters?: RelationshipFilters) => [...relationshipKeys.lists(), { filters }] as const,
  details: () => [...relationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...relationshipKeys.details(), id] as const,
  forDossier: (dossierId: string, page?: number, page_size?: number) =>
    [...relationshipKeys.all, 'dossier', dossierId, { page, page_size }] as const,
  byType: (dossierId: string, type: RelationshipType, page?: number, page_size?: number) =>
    [...relationshipKeys.all, 'dossier', dossierId, 'type', type, { page, page_size }] as const,
}

/**
 * Hook to fetch a single relationship by ID
 *
 * @description
 * Fetches a complete relationship with populated source and target dossiers.
 * The query is automatically cached and can be invalidated using relationshipKeys.detail(id).
 *
 * @param id - The unique identifier (UUID) of the relationship to fetch
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with data typed as RelationshipWithDossiers
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useRelationship('relationship-uuid');
 *
 * @example
 * // With options
 * const { data } = useRelationship('uuid', {
 *   staleTime: 60000,
 *   enabled: !!relationshipId,
 * });
 */
export function useRelationship(
  id: string,
  options?: Omit<
    UseQueryOptions<RelationshipWithDossiers, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.detail(id),
    queryFn: () => getRelationship(id),
    ...options,
  })
}

/**
 * Hook to fetch list of relationships with filters
 *
 * @description
 * Fetches a paginated list of relationships with optional filtering by type, dossier,
 * and other criteria. Results are cached based on filter parameters.
 *
 * @param filters - Optional filters to apply (type, source_dossier_id, target_dossier_id, etc.)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated relationship list
 *
 * @example
 * // Fetch all relationships
 * const { data } = useRelationships();
 *
 * @example
 * // Fetch with filters
 * const { data } = useRelationships({
 *   relationship_type: 'bilateral_relation',
 *   relationship_strength: 'primary',
 *   page: 1,
 *   page_size: 20,
 * });
 */
export function useRelationships(
  filters?: RelationshipFilters,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.list(filters),
    queryFn: () => listRelationships(filters),
    ...options,
  })
}

/**
 * Hook to fetch all relationships for a dossier (bidirectional)
 *
 * @description
 * Fetches all relationships where the dossier is either source or target.
 * Useful for displaying the complete relationship network of a dossier.
 *
 * @param dossierId - The dossier UUID to find relationships for
 * @param page - Page number for pagination (1-indexed, defaults to 1)
 * @param page_size - Number of items per page (defaults to 20)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated relationship list
 *
 * @example
 * // Fetch all relationships for a country
 * const { data } = useRelationshipsForDossier('country-uuid');
 *
 * @example
 * // With pagination
 * const { data } = useRelationshipsForDossier('dossier-uuid', 2, 10);
 */
export function useRelationshipsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.forDossier(dossierId, page, page_size),
    queryFn: () => getRelationshipsForDossier(dossierId, page, page_size),
    ...options,
  })
}

/**
 * Hook to fetch relationships by type for a specific dossier
 *
 * @description
 * Fetches relationships filtered by a specific type (e.g., bilateral_relation, membership).
 * Useful for type-specific relationship displays.
 *
 * @param dossierId - The dossier UUID to find relationships for
 * @param relationshipType - The relationship type to filter by
 * @param page - Page number for pagination (1-indexed, defaults to 1)
 * @param page_size - Number of items per page (defaults to 20)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with filtered relationship list
 *
 * @example
 * // Fetch bilateral relations for a country
 * const { data } = useRelationshipsByType('country-uuid', 'bilateral_relation');
 *
 * @example
 * // With pagination
 * const { data } = useRelationshipsByType('uuid', 'membership', 1, 10);
 */
export function useRelationshipsByType(
  dossierId: string,
  relationshipType: RelationshipType,
  page?: number,
  page_size?: number,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: relationshipKeys.byType(dossierId, relationshipType, page, page_size),
    queryFn: () => getRelationshipsByType(dossierId, relationshipType, page, page_size),
    ...options,
  })
}

/**
 * Hook to create a new relationship
 *
 * @description
 * Creates a new dossier relationship with automatic cache invalidation and toast notifications.
 * On success, invalidates list queries for both dossiers and pre-populates the detail cache.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateRelationshipRequest
 *
 * @example
 * const { mutate, isLoading } = useCreateRelationship();
 *
 * mutate({
 *   source_dossier_id: 'country-uuid',
 *   target_dossier_id: 'org-uuid',
 *   relationship_type: 'bilateral_relation',
 *   relationship_strength: 'primary',
 *   established_date: '2024-01-01',
 * });
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (request: CreateRelationshipRequest) => createRelationship(request),
    onSuccess: (data) => {
      // Invalidate all relationship lists
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })

      // Invalidate relationships for both source and target dossiers
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      })

      // Set the new relationship in the cache
      queryClient.setQueryData(relationshipKeys.detail(data.id), data)

      toast.success(t('relationship.create.success'))
    },
    onError: (error: RelationshipAPIError) => {
      toast.error(t('relationship.create.error', { message: error.message }))
    },
  })
}

/**
 * Hook to update a relationship
 *
 * @description
 * Updates an existing relationship with optimistic updates and automatic rollback on error.
 * On success, updates the cache with server response and invalidates related queries.
 *
 * @returns TanStack Mutation result with mutate function accepting { id, request }
 *
 * @example
 * const { mutate, isLoading } = useUpdateRelationship();
 *
 * mutate({
 *   id: 'relationship-uuid',
 *   request: {
 *     relationship_strength: 'secondary',
 *     notes: 'Updated notes',
 *   },
 * });
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateRelationshipRequest }) =>
      updateRelationship(id, request),
    onMutate: async ({ id, request }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) })

      // Snapshot the previous value
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id),
      )

      // Optimistically update the cache
      if (previousRelationship) {
        queryClient.setQueryData<RelationshipWithDossiers>(relationshipKeys.detail(id), {
          ...previousRelationship,
          ...request,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousRelationship }
    },
    onSuccess: (data, { id }) => {
      // Update the cache with server response
      queryClient.setQueryData(relationshipKeys.detail(id), data)

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      })

      toast.success(t('relationship.update.success'))
    },
    onError: (error: RelationshipAPIError, { id }, context) => {
      // Rollback optimistic update on error
      if (context?.previousRelationship) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship)
      }

      toast.error(t('relationship.update.error', { message: error.message }))
    },
  })
}

/**
 * Hook to delete a relationship
 *
 * @description
 * Deletes a relationship with optimistic cache removal and automatic rollback on error.
 * On success, removes the relationship from cache and invalidates related queries.
 *
 * @returns TanStack Mutation result with mutate function accepting relationship ID string
 *
 * @example
 * const { mutate, isLoading } = useDeleteRelationship();
 *
 * mutate('relationship-uuid');
 *
 * @example
 * // With confirmation
 * const handleDelete = () => {
 *   if (confirm('Delete this relationship?')) {
 *     mutate(relationshipId);
 *   }
 * };
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteRelationship(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) })

      // Snapshot the previous value
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id),
      )

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: relationshipKeys.detail(id) })

      return { previousRelationship }
    },
    onSuccess: (_, id, context) => {
      // Invalidate all lists to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })

      // Invalidate relationships for both dossiers if we have the previous data
      if (context?.previousRelationship) {
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(context.previousRelationship.source_dossier_id),
        })
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(context.previousRelationship.target_dossier_id),
        })
      }

      toast.success(t('relationship.delete.success'))
    },
    onError: (error: RelationshipAPIError, id, context) => {
      // Restore the previous value on error
      if (context?.previousRelationship) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship)
      }

      toast.error(t('relationship.delete.error', { message: error.message }))
    },
  })
}

/**
 * Hook to prefetch relationships for a dossier
 *
 * @description
 * Returns a function to prefetch relationships for performance optimization.
 * Useful for hover effects, navigation hints, or preloading data before navigation.
 *
 * @returns Function accepting dossierId to prefetch relationships
 *
 * @example
 * const prefetch = usePrefetchRelationshipsForDossier();
 *
 * <div onMouseEnter={() => prefetch('dossier-uuid')}>
 *   View Relationships
 * </div>
 */
export function usePrefetchRelationshipsForDossier() {
  const queryClient = useQueryClient()

  return (dossierId: string) => {
    queryClient.prefetchQuery({
      queryKey: relationshipKeys.forDossier(dossierId),
      queryFn: () => getRelationshipsForDossier(dossierId),
    })
  }
}

/**
 * Hook to invalidate relationship queries
 *
 * @description
 * Returns a function to invalidate all relationship queries.
 * Useful after bulk operations or external changes that affect relationships.
 *
 * @returns Function to invalidate all relationship queries
 *
 * @example
 * const invalidateRelationships = useInvalidateRelationships();
 *
 * const handleBulkImport = async () => {
 *   await importRelationships(data);
 *   invalidateRelationships(); // Refresh all relationship data
 * };
 */
export function useInvalidateRelationships() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
  }
}

/**
 * Graph node representing a dossier in the relationship network
 *
 * @property id - Unique identifier (UUID) of the dossier
 * @property type - Dossier type (country, organization, person, etc.)
 * @property name_en - English name of the dossier
 * @property name_ar - Arabic name of the dossier
 * @property status - Dossier status (active, inactive, archived)
 * @property degree - Degrees of separation from the starting dossier
 * @property path - Array of dossier IDs showing the path from start to this node
 */
export interface GraphNode {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  path: string[]
}

/**
 * Graph edge representing a relationship between two dossiers
 *
 * @property source_id - UUID of the source dossier
 * @property target_id - UUID of the target dossier
 * @property relationship_type - Type of relationship connecting the dossiers
 */
export interface GraphEdge {
  source_id: string
  target_id: string
  relationship_type: string
}

/**
 * Complete graph data structure for network visualization
 *
 * @property start_dossier_id - UUID of the starting dossier
 * @property start_dossier - Full dossier object of the starting point
 * @property max_degrees - Maximum degrees of separation traversed
 * @property relationship_type_filter - Applied relationship type filter (if any)
 * @property nodes - Array of all dossier nodes in the graph
 * @property edges - Array of all relationship edges in the graph
 * @property stats - Performance and metadata statistics
 */
export interface GraphData {
  start_dossier_id: string
  start_dossier: {
    id: string
    type: string
    name_en: string
    name_ar: string
    status: string
  }
  max_degrees: number
  relationship_type_filter: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    node_count: number
    edge_count: number
    max_degree: number
    query_time_ms: number
    performance_warning: string | null
  }
}

/**
 * Query Keys Factory for graph traversal queries
 *
 * @description
 * Provides query keys for graph data caching and invalidation.
 *
 * @example
 * // Invalidate all graph queries
 * queryClient.invalidateQueries({ queryKey: graphKeys.all });
 */
export const graphKeys = {
  all: ['graph'] as const,
  traversal: (startDossierId: string, maxDegrees: number, relationshipType?: string) =>
    [...graphKeys.all, 'traversal', startDossierId, maxDegrees, relationshipType || 'all'] as const,
}

/**
 * Fetch graph traversal data from Edge Function
 *
 * @description
 * Internal function to fetch relationship graph data via the graph-traversal Edge Function.
 * Includes authentication and error handling.
 *
 * @param startDossierId - Starting dossier UUID
 * @param maxDegrees - Maximum degrees of separation (default 2, max 5)
 * @param relationshipType - Optional filter by relationship type
 * @returns Promise resolving to GraphData
 * @throws RelationshipAPIError on authentication or fetch failures
 */
async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string,
): Promise<GraphData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('Supabase configuration missing')
  }

  // Get user's auth session for proper authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new RelationshipAPIError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

  // Build query params
  const params = new URLSearchParams({
    startDossierId,
    maxDegrees: maxDegrees.toString(),
  })

  if (relationshipType) {
    params.append('relationshipType', relationshipType)
  }

  const url = `${supabaseUrl}/functions/v1/graph-traversal?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new RelationshipAPIError(
      errorData.error || 'Failed to fetch graph data',
      response.status,
      errorData.code || 'GRAPH_ERROR',
    )
  }

  return response.json()
}

/**
 * Hook to fetch graph data with degree expansion (T084)
 *
 * @description
 * Fetches relationship graph from a starting dossier up to N degrees of separation.
 * Returns nodes, edges, and statistics for network visualization (e.g., React Flow).
 * Data is cached for 5 minutes to optimize performance.
 *
 * @param startDossierId - Starting dossier UUID
 * @param maxDegrees - Maximum degrees of separation (default 2, max 5)
 * @param relationshipType - Optional filter by relationship type
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with GraphData containing nodes, edges, and stats
 *
 * @example
 * // Basic usage - 2 degrees of separation
 * const { data, isLoading } = useGraphData('country-uuid');
 *
 * @example
 * // 3 degrees with type filter
 * const { data } = useGraphData('dossier-uuid', 3, 'bilateral_relation');
 *
 * @example
 * // Use data for React Flow visualization
 * const { data } = useGraphData(dossierId, 2);
 * const reactFlowNodes = data?.nodes.map(n => ({
 *   id: n.id,
 *   data: { label: n.name_en },
 *   position: calculatePosition(n),
 * }));
 */
export function useGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string,
  options?: Omit<UseQueryOptions<GraphData, RelationshipAPIError>, 'queryKey' | 'queryFn'>,
) {
  const { t } = useTranslation()

  return useQuery({
    queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
    queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
    enabled: !!startDossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes - graph data changes infrequently
    ...options,
    meta: {
      errorMessage: t('graph.fetchError', 'Failed to load graph data'),
    },
  })
}

/**
 * Hook to prefetch graph data for performance optimization
 *
 * @description
 * Returns a function to prefetch graph data before it's actually needed.
 * Useful for hover effects, navigation hints, or preloading before navigation.
 *
 * @returns Function accepting (startDossierId, maxDegrees?, relationshipType?) to prefetch
 *
 * @example
 * const prefetchGraph = usePrefetchGraphData();
 *
 * <div onMouseEnter={() => prefetchGraph('dossier-uuid', 2)}>
 *   View Network Graph
 * </div>
 *
 * @example
 * // Prefetch before navigation
 * const navigate = useNavigate();
 * const prefetchGraph = usePrefetchGraphData();
 *
 * const handleClick = (dossierId) => {
 *   prefetchGraph(dossierId, 3);
 *   navigate(`/dossiers/${dossierId}/network`);
 * };
 */
export function usePrefetchGraphData() {
  const queryClient = useQueryClient()

  return (startDossierId: string, maxDegrees: number = 2, relationshipType?: string) => {
    queryClient.prefetchQuery({
      queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
      queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
      staleTime: 5 * 60 * 1000,
    })
  }
}
