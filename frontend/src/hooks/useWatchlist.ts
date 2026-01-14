// useWatchlist Hook
// Feature: personal-watchlist

import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AddToWatchlistRequest,
  BulkAddRequest,
  BulkRemoveRequest,
  UpdateWatchRequest,
  WatchableEntityType,
  WatchCheckResponse,
  WatchlistFilters,
  WatchlistItem,
  WatchlistResponse,
  WatchlistSummaryResponse,
  WatchlistTemplate,
} from '@/types/watchlist.types'

// Query key factory
export const WATCHLIST_KEYS = {
  all: ['watchlist'] as const,
  lists: () => [...WATCHLIST_KEYS.all, 'list'] as const,
  list: (filters: WatchlistFilters) => [...WATCHLIST_KEYS.lists(), filters] as const,
  summary: () => [...WATCHLIST_KEYS.all, 'summary'] as const,
  templates: () => [...WATCHLIST_KEYS.all, 'templates'] as const,
  check: (entityType: WatchableEntityType, entityId: string) =>
    [...WATCHLIST_KEYS.all, 'check', entityType, entityId] as const,
  events: (watchId: string) => [...WATCHLIST_KEYS.all, 'events', watchId] as const,
}

// API functions
const watchlistApi = {
  async getList(filters: WatchlistFilters, cursor?: string): Promise<WatchlistResponse> {
    const params = new URLSearchParams()
    if (filters.entity_type) params.set('entity_type', filters.entity_type)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.active_only !== undefined) params.set('active_only', String(filters.active_only))
    if (filters.include_details !== undefined)
      params.set('include_details', String(filters.include_details))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (cursor) params.set('cursor', cursor)

    // Use fetch for GET with query params
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/list?${params}`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist')
    }

    return response.json()
  },

  async getSummary(): Promise<WatchlistSummaryResponse> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/summary`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist summary')
    }

    return response.json()
  },

  async checkIfWatched(
    entityType: WatchableEntityType,
    entityId: string,
  ): Promise<WatchCheckResponse> {
    const params = new URLSearchParams({
      entity_type: entityType,
      entity_id: entityId,
    })

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/check?${params}`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to check watch status')
    }

    return response.json()
  },

  async addToWatchlist(
    request: AddToWatchlistRequest,
  ): Promise<{ success: boolean; watch_id: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/add`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to add to watchlist')
    }

    return response.json()
  },

  async removeFromWatchlist(
    entityType: WatchableEntityType,
    entityId: string,
  ): Promise<{ success: boolean }> {
    const params = new URLSearchParams({
      entity_type: entityType,
      entity_id: entityId,
    })

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist?${params}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to remove from watchlist')
    }

    return response.json()
  },

  async removeById(watchId: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ id: watchId })

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist?${params}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to remove from watchlist')
    }

    return response.json()
  },

  async bulkAdd(request: BulkAddRequest): Promise<{ success: boolean; added_count: number }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/bulk-add`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to bulk add to watchlist')
    }

    return response.json()
  },

  async bulkRemove(
    request: BulkRemoveRequest,
  ): Promise<{ success: boolean; removed_count: number }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/bulk-remove`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to bulk remove from watchlist')
    }

    return response.json()
  },

  async updateWatch(
    request: UpdateWatchRequest,
  ): Promise<{ success: boolean; watch: WatchlistItem }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist?id=${request.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to update watch')
    }

    return response.json()
  },

  async toggleActive(watchId: string): Promise<{ success: boolean; is_active: boolean }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/toggle-active`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ watch_id: watchId }),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to toggle watch')
    }

    return response.json()
  },

  async getTemplates(): Promise<{ templates: WatchlistTemplate[] }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/templates`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch templates')
    }

    return response.json()
  },

  async applyTemplate(
    templateId: string,
    autoSync: boolean = true,
  ): Promise<{ success: boolean; added_count: number }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watchlist/apply-template`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template_id: templateId, auto_sync: autoSync }),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to apply template')
    }

    return response.json()
  },
}

// Main hook
export function useWatchlist(filters: WatchlistFilters = {}) {
  const queryClient = useQueryClient()

  // Infinite query for paginated watchlist
  const watchlistQuery = useInfiniteQuery({
    queryKey: WATCHLIST_KEYS.list(filters),
    queryFn: ({ pageParam }) => watchlistApi.getList(filters, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Summary query
  const summaryQuery = useQuery({
    queryKey: WATCHLIST_KEYS.summary(),
    queryFn: watchlistApi.getSummary,
    staleTime: 60 * 1000, // 1 minute
  })

  // Templates query
  const templatesQuery = useQuery({
    queryKey: WATCHLIST_KEYS.templates(),
    queryFn: watchlistApi.getTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Add mutation
  const addMutation = useMutation({
    mutationFn: watchlistApi.addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: WatchableEntityType; entityId: string }) =>
      watchlistApi.removeFromWatchlist(entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Remove by ID mutation
  const removeByIdMutation = useMutation({
    mutationFn: watchlistApi.removeById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Bulk add mutation
  const bulkAddMutation = useMutation({
    mutationFn: watchlistApi.bulkAdd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: watchlistApi.bulkRemove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: watchlistApi.updateWatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: watchlistApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: ({ templateId, autoSync }: { templateId: string; autoSync?: boolean }) =>
      watchlistApi.applyTemplate(templateId, autoSync),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
  })

  // Flatten paginated data
  const watchlist = useMemo(() => {
    return watchlistQuery.data?.pages.flatMap((page) => page.watchlist) ?? []
  }, [watchlistQuery.data])

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('watchlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_watchlist',
        },
        () => {
          // Invalidate queries on changes
          queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    // Data
    watchlist,
    summary: summaryQuery.data?.summary ?? [],
    totals: summaryQuery.data?.totals ?? { total: 0, active: 0 },
    templates: templatesQuery.data?.templates ?? [],

    // Query states
    isLoading: watchlistQuery.isLoading,
    isFetching: watchlistQuery.isFetching,
    isLoadingSummary: summaryQuery.isLoading,
    isLoadingTemplates: templatesQuery.isLoading,
    hasNextPage: watchlistQuery.hasNextPage,
    error: watchlistQuery.error,

    // Pagination
    fetchNextPage: watchlistQuery.fetchNextPage,
    refetch: watchlistQuery.refetch,

    // Mutations
    addToWatchlist: addMutation.mutate,
    addToWatchlistAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,

    removeFromWatchlist: removeMutation.mutate,
    removeFromWatchlistAsync: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,

    removeById: removeByIdMutation.mutate,
    removeByIdAsync: removeByIdMutation.mutateAsync,

    bulkAdd: bulkAddMutation.mutate,
    bulkAddAsync: bulkAddMutation.mutateAsync,
    isBulkAdding: bulkAddMutation.isPending,

    bulkRemove: bulkRemoveMutation.mutate,
    bulkRemoveAsync: bulkRemoveMutation.mutateAsync,
    isBulkRemoving: bulkRemoveMutation.isPending,

    updateWatch: updateMutation.mutate,
    updateWatchAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    toggleActive: toggleActiveMutation.mutate,
    toggleActiveAsync: toggleActiveMutation.mutateAsync,

    applyTemplate: applyTemplateMutation.mutate,
    applyTemplateAsync: applyTemplateMutation.mutateAsync,
    isApplyingTemplate: applyTemplateMutation.isPending,
  }
}

// Hook to check if a specific entity is watched
export function useIsEntityWatched(
  entityType: WatchableEntityType,
  entityId: string,
  enabled: boolean = true,
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: WATCHLIST_KEYS.check(entityType, entityId),
    queryFn: () => watchlistApi.checkIfWatched(entityType, entityId),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 30 * 1000,
  })

  // Toggle watch function
  const toggleWatch = useCallback(
    async (options?: Omit<AddToWatchlistRequest, 'entity_type' | 'entity_id'>) => {
      if (query.data?.is_watched) {
        await watchlistApi.removeFromWatchlist(entityType, entityId)
      } else {
        await watchlistApi.addToWatchlist({
          entity_type: entityType,
          entity_id: entityId,
          ...options,
        })
      }
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEYS.all })
    },
    [entityType, entityId, query.data?.is_watched, queryClient],
  )

  return {
    isWatched: query.data?.is_watched ?? false,
    watch: query.data?.watch ?? null,
    isLoading: query.isLoading,
    toggleWatch,
  }
}

// Export API for direct use
export { watchlistApi }
