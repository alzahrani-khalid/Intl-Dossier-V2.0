/**
 * Stakeholder Timeline Hook
 * @module domains/misc/hooks/useStakeholderTimeline
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTimelineEvent as addTimelineEventApi,
  getTimelineCategories,
} from '../repositories/misc.repository'
import type {
  StakeholderTimelineEvent,
  StakeholderTimelineFilters,
} from '@/types/stakeholder-interaction.types'

export const timelineKeys = {
  all: ['stakeholder-timeline'] as const,
  forStakeholder: (id: string) => [...timelineKeys.all, id] as const,
  categories: () => [...timelineKeys.all, 'categories'] as const,
  stats: (id: string) => [...timelineKeys.all, 'stats', id] as const,
}

export interface StakeholderTimelineStats {
  total_interactions: number
  key_moments_count: number
  last_interaction_date: string | null
  most_common_type: string | null
  avg_sentiment: number
}

export interface StakeholderTimelineState {
  events: StakeholderTimelineEvent[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: Error | null
  fetchNextPage: () => Promise<unknown>
  refetch: () => Promise<unknown>
  filters: StakeholderTimelineFilters
  setFilters: (filters: StakeholderTimelineFilters) => void
  stats: StakeholderTimelineStats | null
  isLoadingStats: boolean
}

const EMPTY_FILTERS: StakeholderTimelineFilters = {}

export function useStakeholderTimeline(
  _stakeholderId: string | null,
  _params?: {
    from?: string
    to?: string
    category?: string
    enabled?: boolean
  },
): StakeholderTimelineState {
  const [filters, setFilters] = useState<StakeholderTimelineFilters>(EMPTY_FILTERS)

  return {
    events: [],
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    error: null,
    fetchNextPage: () => Promise.resolve(),
    refetch: () => Promise.resolve(),
    filters,
    setFilters,
    stats: null,
    isLoadingStats: false,
  }
}

export function useAddTimelineEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { stakeholderId: string; data: Record<string, unknown> }) =>
      addTimelineEventApi(params.stakeholderId, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
    },
  })
}

export function useTimelineCategories() {
  return useQuery({
    queryKey: timelineKeys.categories(),
    queryFn: () => getTimelineCategories(),
    staleTime: 30 * 60 * 1000,
  })
}

/* Stub exports – removed during refactoring, still imported by components */

export function useStakeholderInteractionMutations() {
  const queryClient = useQueryClient()
  const addInteraction = useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
    },
  })
  const updateInteraction = useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
    },
  })
  const deleteInteraction = useMutation({
    mutationFn: (_id: string) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
    },
  })
  return { addInteraction, updateInteraction, deleteInteraction }
}

export function getAvailableInteractionTypes(): string[] {
  return ['meeting', 'call', 'email', 'note', 'event']
}
