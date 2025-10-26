/**
 * Relationship Hooks
 * Part of: 026-unified-dossier-architecture implementation
 *
 * TanStack Query hooks for relationship operations with automatic caching,
 * invalidation, and graph traversal support.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
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
} from '@/services/relationship-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Query Keys Factory
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
};

/**
 * Hook to fetch a single relationship by ID
 */
export function useRelationship(
  id: string,
  options?: Omit<UseQueryOptions<RelationshipWithDossiers, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.detail(id),
    queryFn: () => getRelationship(id),
    ...options,
  });
}

/**
 * Hook to fetch list of relationships with filters
 */
export function useRelationships(
  filters?: RelationshipFilters,
  options?: Omit<UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.list(filters),
    queryFn: () => listRelationships(filters),
    ...options,
  });
}

/**
 * Hook to fetch all relationships for a dossier (bidirectional)
 */
export function useRelationshipsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number,
  options?: Omit<UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.forDossier(dossierId, page, page_size),
    queryFn: () => getRelationshipsForDossier(dossierId, page, page_size),
    ...options,
  });
}

/**
 * Hook to fetch relationships by type
 */
export function useRelationshipsByType(
  dossierId: string,
  relationshipType: RelationshipType,
  page?: number,
  page_size?: number,
  options?: Omit<UseQueryOptions<RelationshipsListResponse, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: relationshipKeys.byType(dossierId, relationshipType, page, page_size),
    queryFn: () => getRelationshipsByType(dossierId, relationshipType, page, page_size),
    ...options,
  });
}

/**
 * Hook to create a new relationship
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (request: CreateRelationshipRequest) => createRelationship(request),
    onSuccess: (data) => {
      // Invalidate all relationship lists
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });

      // Invalidate relationships for both source and target dossiers
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      });
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      });

      // Set the new relationship in the cache
      queryClient.setQueryData(relationshipKeys.detail(data.id), data);

      toast.success(t('relationship.create.success'));
    },
    onError: (error: RelationshipAPIError) => {
      toast.error(t('relationship.create.error', { message: error.message }));
    },
  });
}

/**
 * Hook to update a relationship
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateRelationshipRequest }) =>
      updateRelationship(id, request),
    onMutate: async ({ id, request }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) });

      // Snapshot the previous value
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id)
      );

      // Optimistically update the cache
      if (previousRelationship) {
        queryClient.setQueryData<RelationshipWithDossiers>(relationshipKeys.detail(id), {
          ...previousRelationship,
          ...request,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousRelationship };
    },
    onSuccess: (data, { id }) => {
      // Update the cache with server response
      queryClient.setQueryData(relationshipKeys.detail(id), data);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.source_dossier_id),
      });
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.forDossier(data.target_dossier_id),
      });

      toast.success(t('relationship.update.success'));
    },
    onError: (error: RelationshipAPIError, { id }, context) => {
      // Rollback optimistic update on error
      if (context?.previousRelationship) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship);
      }

      toast.error(t('relationship.update.error', { message: error.message }));
    },
  });
}

/**
 * Hook to delete a relationship
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => deleteRelationship(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: relationshipKeys.detail(id) });

      // Snapshot the previous value
      const previousRelationship = queryClient.getQueryData<RelationshipWithDossiers>(
        relationshipKeys.detail(id)
      );

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: relationshipKeys.detail(id) });

      return { previousRelationship };
    },
    onSuccess: (_, id, context) => {
      // Invalidate all lists to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all });

      // Invalidate relationships for both dossiers if we have the previous data
      if (context?.previousRelationship) {
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(context.previousRelationship.source_dossier_id),
        });
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.forDossier(context.previousRelationship.target_dossier_id),
        });
      }

      toast.success(t('relationship.delete.success'));
    },
    onError: (error: RelationshipAPIError, id, context) => {
      // Restore the previous value on error
      if (context?.previousRelationship) {
        queryClient.setQueryData(relationshipKeys.detail(id), context.previousRelationship);
      }

      toast.error(t('relationship.delete.error', { message: error.message }));
    },
  });
}

/**
 * Hook to prefetch relationships for a dossier (useful for hover effects, navigation hints)
 */
export function usePrefetchRelationshipsForDossier() {
  const queryClient = useQueryClient();

  return (dossierId: string) => {
    queryClient.prefetchQuery({
      queryKey: relationshipKeys.forDossier(dossierId),
      queryFn: () => getRelationshipsForDossier(dossierId),
    });
  };
}

/**
 * Hook to invalidate relationship queries (useful after bulk operations)
 */
export function useInvalidateRelationships() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
  };
}

/**
 * T084: Hook to fetch graph data with degree expansion
 * Fetches relationship graph from starting dossier up to N degrees of separation
 */
export interface GraphNode {
  id: string;
  type: string;
  name_en: string;
  name_ar: string;
  status: string;
  degree: number;
  path: string[];
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
  relationship_type: string;
}

export interface GraphData {
  start_dossier_id: string;
  start_dossier: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    status: string;
  };
  max_degrees: number;
  relationship_type_filter: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    node_count: number;
    edge_count: number;
    max_degree: number;
    query_time_ms: number;
    performance_warning: string | null;
  };
}

export const graphKeys = {
  all: ['graph'] as const,
  traversal: (startDossierId: string, maxDegrees: number, relationshipType?: string) =>
    [...graphKeys.all, 'traversal', startDossierId, maxDegrees, relationshipType || 'all'] as const,
};

/**
 * Fetch graph traversal data from Edge Function
 */
async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string
): Promise<GraphData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  // Build query params
  const params = new URLSearchParams({
    startDossierId,
    maxDegrees: maxDegrees.toString(),
  });

  if (relationshipType) {
    params.append('relationshipType', relationshipType);
  }

  const url = `${supabaseUrl}/functions/v1/graph-traversal?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new RelationshipAPIError(
      errorData.error || 'Failed to fetch graph data',
      response.status
    );
  }

  return response.json();
}

/**
 * Hook to fetch graph data with degree expansion
 * Fetches relationship graph from starting dossier up to N degrees of separation
 *
 * @param startDossierId - Starting dossier UUID
 * @param maxDegrees - Maximum degrees of separation (default 2, max 5)
 * @param relationshipType - Optional filter by relationship type
 * @param options - TanStack Query options
 *
 * @example
 * const { data, isLoading, error } = useGraphData('dossier-uuid', 3, 'bilateral_relation');
 * // data contains nodes, edges, and stats for visualization
 */
export function useGraphData(
  startDossierId: string,
  maxDegrees: number = 2,
  relationshipType?: string,
  options?: Omit<UseQueryOptions<GraphData, RelationshipAPIError>, 'queryKey' | 'queryFn'>
) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
    queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
    enabled: !!startDossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes - graph data changes infrequently
    ...options,
    meta: {
      errorMessage: t('graph.fetchError', 'Failed to load graph data'),
    },
  });
}

/**
 * Hook to prefetch graph data (useful for hover effects, navigation hints)
 */
export function usePrefetchGraphData() {
  const queryClient = useQueryClient();

  return (startDossierId: string, maxDegrees: number = 2, relationshipType?: string) => {
    queryClient.prefetchQuery({
      queryKey: graphKeys.traversal(startDossierId, maxDegrees, relationshipType),
      queryFn: () => fetchGraphData(startDossierId, maxDegrees, relationshipType),
      staleTime: 5 * 60 * 1000,
    });
  };
}
