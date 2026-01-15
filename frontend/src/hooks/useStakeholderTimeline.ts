/**
 * useStakeholderTimeline Hook
 *
 * Fetches and manages stakeholder interaction timeline data with:
 * - Infinite scroll pagination (TanStack Query)
 * - Multi-source aggregation (calendar, interactions, documents, etc.)
 * - Filtering by type, date range, sentiment, and direction
 * - Full-text search
 * - Annotation management
 * - Statistics tracking
 */

import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  StakeholderTimelineEvent,
  StakeholderTimelineFilters,
  StakeholderTimelineResponse,
  StakeholderInteractionStats,
  UseStakeholderTimelineReturn,
  CreateInteractionRequest,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
  TimelineAnnotation,
  StakeholderInteraction,
} from '@/types/stakeholder-interaction.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface UseStakeholderTimelineOptions {
  stakeholderType: string
  stakeholderId: string
  initialFilters?: StakeholderTimelineFilters
  itemsPerPage?: number
  enableStats?: boolean
}

/**
 * Fetch timeline events from Edge Function
 */
async function fetchTimelineEvents(
  stakeholderType: string,
  stakeholderId: string,
  filters: StakeholderTimelineFilters,
  cursor?: string,
  limit: number = 20,
): Promise<StakeholderTimelineResponse> {
  const params = new URLSearchParams({
    stakeholder_type: stakeholderType,
    stakeholder_id: stakeholderId,
    limit: limit.toString(),
  })

  if (filters.event_types?.length) {
    params.set('event_types', filters.event_types.join(','))
  }
  if (filters.date_from) {
    params.set('date_from', filters.date_from)
  }
  if (filters.date_to) {
    params.set('date_to', filters.date_to)
  }
  if (filters.search_query) {
    params.set('search', filters.search_query)
  }
  if (cursor) {
    params.set('cursor', cursor)
  }

  const { data, error } = await supabase.functions.invoke<StakeholderTimelineResponse>(
    'stakeholder-timeline',
    {
      body: null,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  // Fallback to direct fetch if invoke doesn't support GET with params
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch timeline events')
  }

  return response.json()
}

/**
 * Fetch interaction statistics
 */
async function fetchStats(
  stakeholderType: string,
  stakeholderId: string,
): Promise<StakeholderInteractionStats> {
  const params = new URLSearchParams({
    stakeholder_type: stakeholderType,
    stakeholder_id: stakeholderId,
  })

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline/stats?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }

  return response.json()
}

/**
 * Hook for fetching stakeholder timeline data
 */
export function useStakeholderTimeline({
  stakeholderType,
  stakeholderId,
  initialFilters = {},
  itemsPerPage = 20,
  enableStats = true,
}: UseStakeholderTimelineOptions): UseStakeholderTimelineReturn {
  const [filters, setFilters] = useState<StakeholderTimelineFilters>(initialFilters)

  // Infinite query for timeline events
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } =
    useInfiniteQuery({
      queryKey: ['stakeholder-timeline', stakeholderType, stakeholderId, filters],
      queryFn: ({ pageParam }) =>
        fetchTimelineEvents(stakeholderType, stakeholderId, filters, pageParam, itemsPerPage),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        return lastPage.has_more ? lastPage.next_cursor : undefined
      },
      enabled: !!stakeholderType && !!stakeholderId,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    })

  // Query for statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stakeholder-timeline-stats', stakeholderType, stakeholderId],
    queryFn: () => fetchStats(stakeholderType, stakeholderId),
    enabled: enableStats && !!stakeholderType && !!stakeholderId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Flatten paginated results
  const events = useMemo<StakeholderTimelineEvent[]>(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.events)
  }, [data])

  return {
    events,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    error: error as Error | null,
    fetchNextPage: () => fetchNextPage(),
    refetch,
    filters,
    setFilters,
    stats: stats || null,
    isLoadingStats,
  }
}

/**
 * Hook for interaction and annotation mutations
 */
export function useStakeholderInteractionMutations(stakeholderType: string, stakeholderId: string) {
  const { t } = useTranslation('stakeholder-interactions')
  const queryClient = useQueryClient()

  // Create interaction mutation
  const createInteractionMutation = useMutation({
    mutationFn: async (data: CreateInteractionRequest): Promise<StakeholderInteraction> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline/interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify(data),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create interaction')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['stakeholder-timeline', stakeholderType, stakeholderId],
      })
      queryClient.invalidateQueries({
        queryKey: ['stakeholder-timeline-stats', stakeholderType, stakeholderId],
      })
      toast.success(t('interaction_created'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('interaction_create_error'))
    },
  })

  // Create annotation mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (data: CreateAnnotationRequest): Promise<TimelineAnnotation> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline/annotations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            ...data,
            stakeholder_type: stakeholderType,
            stakeholder_id: stakeholderId,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create annotation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['stakeholder-timeline', stakeholderType, stakeholderId],
      })
      toast.success(t('annotation_created'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('annotation_create_error'))
    },
  })

  // Update annotation mutation
  const updateAnnotationMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateAnnotationRequest
    }): Promise<TimelineAnnotation> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline/annotations/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify(data),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update annotation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['stakeholder-timeline', stakeholderType, stakeholderId],
      })
      toast.success(t('annotation_updated'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('annotation_update_error'))
    },
  })

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-timeline/annotations/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete annotation')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['stakeholder-timeline', stakeholderType, stakeholderId],
      })
      toast.success(t('annotation_deleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('annotation_delete_error'))
    },
  })

  return {
    createInteraction: createInteractionMutation.mutateAsync,
    isCreating: createInteractionMutation.isPending,
    createAnnotation: createAnnotationMutation.mutateAsync,
    updateAnnotation: useCallback(
      (id: string, data: UpdateAnnotationRequest) =>
        updateAnnotationMutation.mutateAsync({ id, data }),
      [updateAnnotationMutation],
    ),
    deleteAnnotation: deleteAnnotationMutation.mutateAsync,
    isAnnotating:
      createAnnotationMutation.isPending ||
      updateAnnotationMutation.isPending ||
      deleteAnnotationMutation.isPending,
  }
}

/**
 * Get default event types for stakeholder type
 */
export function getDefaultInteractionTypes(stakeholderType: string): string[] {
  const typeMap: Record<string, string[]> = {
    dossier: ['meeting', 'email', 'document_exchange', 'phone_call', 'visit'],
    contact: ['meeting', 'email', 'phone_call', 'message'],
    person: ['meeting', 'email', 'phone_call', 'conference', 'visit'],
  }
  return typeMap[stakeholderType] || ['meeting', 'email', 'phone_call']
}

/**
 * Get available event types for stakeholder type
 */
export function getAvailableInteractionTypes(stakeholderType: string): string[] {
  return [
    'email',
    'meeting',
    'phone_call',
    'document_exchange',
    'comment',
    'message',
    'visit',
    'conference',
    'workshop',
    'negotiation',
    'other',
  ]
}
