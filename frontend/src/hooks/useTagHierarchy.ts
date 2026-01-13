/**
 * useTagHierarchy Hook
 *
 * TanStack Query hooks for tag hierarchy management including:
 * - CRUD operations for tags
 * - Search with auto-suggestions
 * - Entity tag assignments
 * - Tag merging and renaming
 * - Usage analytics
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  TagCategory,
  TagCategoryCreate,
  TagCategoryUpdate,
  TagSynonym,
  TagSynonymCreate,
  EntityTagAssignment,
  EntityTagAssignmentCreate,
  TagSearchResult,
  TagSuggestion,
  TagUsageAnalytics,
  TagMergeHistory,
  TagRenameHistory,
  TagHierarchyFilters,
  TagSearchParams,
  TagAssignmentParams,
  TagMergeRequest,
  TagRenameRequest,
  TagHierarchyResponse,
  TagSearchResponse,
  TagSuggestionResponse,
  EntityTagsResponse,
  TagAnalyticsResponse,
  TagEntityType,
  buildTagHierarchy,
} from '@/types/tag-hierarchy.types'

// ============================================================================
// Query Key Factory
// ============================================================================

export const tagKeys = {
  all: ['tags'] as const,
  hierarchy: () => [...tagKeys.all, 'hierarchy'] as const,
  hierarchyFiltered: (filters: TagHierarchyFilters) => [...tagKeys.hierarchy(), filters] as const,
  flat: () => [...tagKeys.all, 'flat'] as const,
  search: (params: TagSearchParams) => [...tagKeys.all, 'search', params] as const,
  suggestions: (params: TagAssignmentParams) => [...tagKeys.all, 'suggestions', params] as const,
  entityTags: (params: TagAssignmentParams) => [...tagKeys.all, 'entity', params] as const,
  analytics: () => [...tagKeys.all, 'analytics'] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
  synonyms: (tagId: string) => [...tagKeys.all, 'synonyms', tagId] as const,
  mergeHistory: (tagId?: string) => [...tagKeys.all, 'merge-history', tagId] as const,
  renameHistory: (tagId?: string) => [...tagKeys.all, 'rename-history', tagId] as const,
}

// ============================================================================
// API Helper
// ============================================================================

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tag-hierarchy`

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('No active session')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get full tag hierarchy tree
 */
export function useTagHierarchy(
  filters: TagHierarchyFilters = {},
  options?: Omit<UseQueryOptions<TagHierarchyResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.hierarchyFiltered(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.root_id) params.set('root_id', filters.root_id)
      if (filters.max_depth) params.set('max_depth', filters.max_depth.toString())
      if (filters.include_inactive) params.set('include_inactive', 'true')

      const response = await fetchAPI<TagHierarchyResponse>(`/hierarchy?${params}`)
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Get hierarchical tag tree structure
 */
export function useTagHierarchyTree(
  filters: TagHierarchyFilters = {},
  options?: Omit<UseQueryOptions<TagCategory[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...tagKeys.hierarchyFiltered(filters), 'tree'],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.root_id) params.set('root_id', filters.root_id)
      if (filters.max_depth) params.set('max_depth', filters.max_depth.toString())
      if (filters.include_inactive) params.set('include_inactive', 'true')

      const response = await fetchAPI<TagHierarchyResponse>(`/hierarchy?${params}`)
      return buildTagHierarchy(response.data)
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Get flat list of all tags
 */
export function useTagsFlat(
  includeInactive = false,
  options?: Omit<UseQueryOptions<TagCategory[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...tagKeys.flat(), { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (includeInactive) params.set('include_inactive', 'true')

      const response = await fetchAPI<{ data: TagCategory[] }>(`?${params}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Search tags with auto-suggestions
 */
export function useTagSearch(
  params: TagSearchParams,
  options?: Omit<UseQueryOptions<TagSearchResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.search(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('query', params.query)
      if (params.language) searchParams.set('language', params.language)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.entity_type) searchParams.set('entity_type', params.entity_type)

      return fetchAPI<TagSearchResponse>(`/search?${searchParams}`)
    },
    enabled: params.query.length >= 1,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Get tag suggestions for an entity
 */
export function useTagSuggestions(
  params: TagAssignmentParams,
  limit = 5,
  options?: Omit<UseQueryOptions<TagSuggestionResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.suggestions(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        limit: limit.toString(),
      })

      return fetchAPI<TagSuggestionResponse>(`/suggestions?${searchParams}`)
    },
    enabled: Boolean(params.entity_type && params.entity_id),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Get tags assigned to an entity
 */
export function useEntityTags(
  params: TagAssignmentParams,
  options?: Omit<UseQueryOptions<EntityTagsResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.entityTags(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
      })

      return fetchAPI<EntityTagsResponse>(`/entity-tags?${searchParams}`)
    },
    enabled: Boolean(params.entity_type && params.entity_id),
    ...options,
  })
}

/**
 * Get tag usage analytics
 */
export function useTagAnalytics(
  options?: Omit<UseQueryOptions<TagAnalyticsResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.analytics(),
    queryFn: () => fetchAPI<TagAnalyticsResponse>('/analytics'),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Get tag synonyms
 */
export function useTagSynonyms(
  tagId: string,
  options?: Omit<UseQueryOptions<TagSynonym[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.synonyms(tagId),
    queryFn: async () => {
      const response = await fetchAPI<{ data: TagSynonym[] }>(`/synonyms?tag_id=${tagId}`)
      return response.data
    },
    enabled: Boolean(tagId),
    ...options,
  })
}

/**
 * Get merge history
 */
export function useTagMergeHistory(
  tagId?: string,
  options?: Omit<UseQueryOptions<TagMergeHistory[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.mergeHistory(tagId),
    queryFn: async () => {
      const params = tagId ? `?tag_id=${tagId}` : ''
      const response = await fetchAPI<{ data: TagMergeHistory[] }>(`/merge-history${params}`)
      return response.data
    },
    ...options,
  })
}

/**
 * Get rename history
 */
export function useTagRenameHistory(
  tagId?: string,
  options?: Omit<UseQueryOptions<TagRenameHistory[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tagKeys.renameHistory(tagId),
    queryFn: async () => {
      const params = tagId ? `?tag_id=${tagId}` : ''
      const response = await fetchAPI<{ data: TagRenameHistory[] }>(`/rename-history${params}`)
      return response.data
    },
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TagCategoryCreate) => {
      const response = await fetchAPI<{ data: TagCategory }>('/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

/**
 * Update a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: TagCategoryUpdate & { id: string }) => {
      const response = await fetchAPI<{ data: TagCategory }>(`?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.id) })
    },
  })
}

/**
 * Delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagId: string) => {
      await fetchAPI(`?id=${tagId}`, { method: 'DELETE' })
      return tagId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

/**
 * Add a synonym to a tag
 */
export function useAddSynonym() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TagSynonymCreate) => {
      const response = await fetchAPI<{ data: TagSynonym }>('/synonym', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.synonyms(variables.tag_id) })
    },
  })
}

/**
 * Remove a synonym
 */
export function useRemoveSynonym() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ synonymId, tagId }: { synonymId: string; tagId: string }) => {
      await fetchAPI(`/synonym?id=${synonymId}`, { method: 'DELETE' })
      return tagId
    },
    onSuccess: (tagId) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.synonyms(tagId) })
    },
  })
}

/**
 * Assign tag to entity
 */
export function useAssignTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EntityTagAssignmentCreate) => {
      const response = await fetchAPI<{ data: EntityTagAssignment }>('/assign', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.entityTags({
          entity_type: variables.entity_type,
          entity_id: variables.entity_id,
        }),
      })
      queryClient.invalidateQueries({ queryKey: tagKeys.analytics() })
    },
  })
}

/**
 * Remove tag from entity
 */
export function useUnassignTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entity_type,
      entity_id,
      tag_id,
    }: {
      entity_type: TagEntityType
      entity_id: string
      tag_id: string
    }) => {
      const params = new URLSearchParams({
        entity_type,
        entity_id,
        tag_id,
      })
      await fetchAPI(`/unassign?${params}`, { method: 'DELETE' })
      return { entity_type, entity_id, tag_id }
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.entityTags({
          entity_type: variables.entity_type,
          entity_id: variables.entity_id,
        }),
      })
      queryClient.invalidateQueries({ queryKey: tagKeys.analytics() })
    },
  })
}

/**
 * Merge two tags
 */
export function useMergeTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TagMergeRequest) => {
      const response = await fetchAPI<{ success: boolean }>('/merge', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.success
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

/**
 * Rename a tag
 */
export function useRenameTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TagRenameRequest) => {
      const response = await fetchAPI<{ success: boolean }>('/rename', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.success
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all })
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.tag_id) })
    },
  })
}

/**
 * Refresh analytics materialized view
 */
export function useRefreshTagAnalytics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetchAPI<{ success: boolean }>('/refresh-analytics', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      return response.success
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.analytics() })
    },
  })
}

// ============================================================================
// Utility Hook for Entity Tagging
// ============================================================================

/**
 * Combined hook for managing tags on a specific entity
 */
export function useEntityTagging(entityType: TagEntityType, entityId: string) {
  const params = { entity_type: entityType, entity_id: entityId }

  const tagsQuery = useEntityTags(params)
  const suggestionsQuery = useTagSuggestions(params)
  const assignMutation = useAssignTag()
  const unassignMutation = useUnassignTag()

  return {
    // Current tags
    tags: tagsQuery.data?.data || [],
    isLoadingTags: tagsQuery.isLoading,
    tagsError: tagsQuery.error,

    // Suggestions
    suggestions: suggestionsQuery.data?.data || [],
    isLoadingSuggestions: suggestionsQuery.isLoading,

    // Actions
    assignTag: (
      tagId: string,
      options?: { confidence_score?: number; is_auto_assigned?: boolean },
    ) => {
      return assignMutation.mutateAsync({
        entity_type: entityType,
        entity_id: entityId,
        tag_id: tagId,
        ...options,
      })
    },
    unassignTag: (tagId: string) => {
      return unassignMutation.mutateAsync({
        entity_type: entityType,
        entity_id: entityId,
        tag_id: tagId,
      })
    },

    // Mutation states
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
    assignError: assignMutation.error,
    unassignError: unassignMutation.error,

    // Refetch
    refetch: () => {
      tagsQuery.refetch()
      suggestionsQuery.refetch()
    },
  }
}
