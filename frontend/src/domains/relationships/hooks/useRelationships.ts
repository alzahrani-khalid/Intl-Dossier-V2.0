/**
 * Relationship Hooks
 * @module domains/relationships/hooks/useRelationships
 *
 * TanStack Query hooks for relationship operations with automatic caching,
 * invalidation, and graph traversal support.
 * Routes through the relationships repository / relationship-api service.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import * as RelationshipsRepo from '../repositories/relationships.repository'
import type {
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  RelationshipFilters,
  RelationshipWithDossiers,
  RelationshipsListResponse,
  RelationshipType,
} from '@/services/relationship-api'
import { RelationshipAPIError } from '@/services/relationship-api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ============================================================================
// Query Keys Factory
// ============================================================================

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

// ============================================================================
// Query Hooks
// ============================================================================

export function useRelationship(
  id: string,
  options?: Omit<
    UseQueryOptions<RelationshipWithDossiers, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: relationshipKeys.detail(id),
    queryFn: () => RelationshipsRepo.getRelationship(id),
    ...options,
  })
}

export function useRelationships(
  filters?: RelationshipFilters,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: relationshipKeys.list(filters),
    queryFn: () => RelationshipsRepo.listRelationships(filters),
    ...options,
  })
}

export function useRelationshipsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: relationshipKeys.forDossier(dossierId, page, page_size),
    queryFn: () => RelationshipsRepo.getRelationshipsForDossier(dossierId, page, page_size),
    ...options,
  })
}

export function useRelationshipsByType(
  dossierId: string,
  relationshipType: RelationshipType,
  page?: number,
  page_size?: number,
  options?: Omit<
    UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>,
    'queryKey' | 'queryFn'
  >,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: relationshipKeys.byType(dossierId, relationshipType, page, page_size),
    queryFn: () =>
      RelationshipsRepo.getRelationshipsByType(dossierId, relationshipType, page, page_size),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateRelationship(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (request: CreateRelationshipRequest) =>
      RelationshipsRepo.createRelationship(request),
    onSuccess: (data: RelationshipWithDossiers) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      })
      queryClient.setQueryData(relationshipKeys.detail(data.id), data)
      toast.success(t('relationship.create.success'))
    },
    onError: (error: RelationshipAPIError) => {
      toast.error(t('relationship.create.error', { message: error.message }))
    },
  })
}

export function useUpdateRelationship(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateRelationshipRequest }) =>
      RelationshipsRepo.updateRelationship(id, request),
    onMutate: async ({ id, request }) => {
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) })
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id),
      )
      if (previousRelationship) {
        queryClient.setQueryData<RelationshipWithDossiers>(
          relationshipKeys.detail(id),
          () =>
            ({
              ...previousRelationship,
              ...request,
            }) as RelationshipWithDossiers,
        )
      }
      return { previousRelationship }
    },
    onSuccess: (data: RelationshipWithDossiers, { id }) => {
      queryClient.setQueryData(relationshipKeys.detail(id), data)
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
      if (
        context &&
        typeof context === 'object' &&
        'previousRelationship' in context &&
        context.previousRelationship
      ) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship)
      }
      toast.error(t('relationship.update.error', { message: error.message }))
    },
  })
}

export function useDeleteRelationship(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => RelationshipsRepo.deleteRelationship(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) })
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id),
      )
      queryClient.removeQueries({ queryKey: relationshipKeys.detail(id) })
      return { previousRelationship }
    },
    onSuccess: (_: unknown, _id: string, context) => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
      if (
        context &&
        typeof context === 'object' &&
        'previousRelationship' in context &&
        context.previousRelationship
      ) {
        const prev = context.previousRelationship as RelationshipWithDossiers
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(prev.source_dossier_id),
        })
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(prev.target_dossier_id),
        })
      }
      toast.success(t('relationship.delete.success'))
    },
    onError: (error: RelationshipAPIError, id: string, context) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousRelationship' in context &&
        context.previousRelationship
      ) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship)
      }
      toast.error(t('relationship.delete.error', { message: error.message }))
    },
  })
}

export function usePrefetchRelationshipsForDossier(): (dossierId: string) => void {
  const queryClient = useQueryClient()

  return (dossierId: string) => {
    queryClient.prefetchQuery({
      queryKey: relationshipKeys.forDossier(dossierId),
      queryFn: () => RelationshipsRepo.getRelationshipsForDossier(dossierId),
    })
  }
}

export function useInvalidateRelationships(): () => void {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
  }
}

// ============================================================================
// Graph Traversal
// ============================================================================

export interface GraphNode {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  path: string[]
}

export interface GraphEdge {
  source_id: string
  target_id: string
  relationship_type: string
}

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

export const graphKeys = {
  all: ['graph'] as const,
  traversal: (startDossierId: string, maxDegrees: number, relationshipType?: string) =>
    [
      ...graphKeys.all,
      'traversal',
      startDossierId,
      maxDegrees,
      relationshipType || 'all',
    ] as const,
}

async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string,
): Promise<GraphData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('Supabase configuration missing')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new RelationshipAPIError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

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

export function useGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string,
  options?: Omit<UseQueryOptions<GraphData, RelationshipAPIError>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery> {
  const { t } = useTranslation()

  return useQuery({
    queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
    queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
    enabled: !!startDossierId,
    staleTime: STALE_TIME.NORMAL,
    ...options,
    meta: {
      errorMessage: t('graph.fetchError', 'Failed to load graph data'),
    },
  })
}

export function usePrefetchGraphData(): (
  startDossierId: string,
  maxDegrees?: number,
  relationshipType?: string,
) => void {
  const queryClient = useQueryClient()

  return (startDossierId: string, maxDegrees: number = 2, relationshipType?: string) => {
    queryClient.prefetchQuery({
      queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
      queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
      staleTime: STALE_TIME.NORMAL,
    })
  }
}
