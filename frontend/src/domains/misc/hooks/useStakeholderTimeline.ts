/**
 * Stakeholder Timeline Hook
 * @module domains/misc/hooks/useStakeholderTimeline
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getStakeholderTimeline as getStakeholderTimelineApi,
  addTimelineEvent as addTimelineEventApi,
  getTimelineCategories,
  getTimelineExport,
  getTimelineStats,
  compareTimelines as compareTimelinesApi,
} from '../repositories/misc.repository'

export const timelineKeys = {
  all: ['stakeholder-timeline'] as const,
  forStakeholder: (id: string) => [...timelineKeys.all, id] as const,
  categories: () => [...timelineKeys.all, 'categories'] as const,
  stats: (id: string) => [...timelineKeys.all, 'stats', id] as const,
}

export function useStakeholderTimeline(stakeholderId: string | null, params?: {
  from?: string
  to?: string
  category?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  if (params?.category) searchParams.set('category', params.category)

  return useQuery({
    queryKey: stakeholderId ? timelineKeys.forStakeholder(stakeholderId) : ['timeline', 'disabled'],
    queryFn: () => (stakeholderId ? getStakeholderTimelineApi(stakeholderId, searchParams) : Promise.resolve(null)),
    enabled: params?.enabled !== false && Boolean(stakeholderId),
    staleTime: 60 * 1000,
  })
}

export function useAddTimelineEvent(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { stakeholderId: string; data: Record<string, unknown> }) =>
      addTimelineEventApi(params.stakeholderId, params.data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: timelineKeys.all }) },
  })
}

export function useTimelineCategories(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: timelineKeys.categories(),
    queryFn: () => getTimelineCategories(),
    staleTime: 30 * 60 * 1000,
  })
}
