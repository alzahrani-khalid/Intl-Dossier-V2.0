/**
 * Stakeholder Influence Hook
 * @module domains/misc/hooks/useStakeholderInfluence
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getInfluenceData as getInfluenceDataApi,
  updateInfluenceScore as updateInfluenceScoreApi,
  getInfluenceNetwork as getInfluenceNetworkApi,
  getInfluenceHistory as getInfluenceHistoryApi,
  compareInfluence as compareInfluenceApi,
} from '../repositories/misc.repository'

export const influenceKeys = {
  all: ['stakeholder-influence'] as const,
  forStakeholder: (id: string) => [...influenceKeys.all, id] as const,
  network: (params?: Record<string, unknown>) => [...influenceKeys.all, 'network', params] as const,
  history: (id: string) => [...influenceKeys.all, 'history', id] as const,
}

export function useStakeholderInfluence(stakeholderId: string | null, params?: {
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: stakeholderId ? influenceKeys.forStakeholder(stakeholderId) : ['influence', 'disabled'],
    queryFn: () => (stakeholderId ? getInfluenceDataApi(stakeholderId) : Promise.resolve(null)),
    enabled: params?.enabled !== false && Boolean(stakeholderId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateInfluenceScore(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { stakeholderId: string; data: Record<string, unknown> }) =>
      updateInfluenceScoreApi(params.stakeholderId, params.data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: influenceKeys.all }) },
  })
}

export function useInfluenceNetwork(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: influenceKeys.network(params),
    queryFn: () => getInfluenceNetworkApi(searchParams),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInfluenceHistory(stakeholderId: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: stakeholderId ? influenceKeys.history(stakeholderId) : ['influence', 'history', 'disabled'],
    queryFn: () => (stakeholderId ? getInfluenceHistoryApi(stakeholderId) : Promise.resolve(null)),
    enabled: Boolean(stakeholderId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompareInfluence(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (stakeholderIds: string[]) => compareInfluenceApi(stakeholderIds),
  })
}
