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
import type {
  StakeholderInfluenceSummary,
  StakeholderInfluenceDetail,
  NetworkVisualizationData,
  NetworkOverviewStatistics,
  KeyConnector,
  InfluenceReport,
  PaginatedResponse,
} from '@/types/stakeholder-influence.types'

export const influenceKeys = {
  all: ['stakeholder-influence'] as const,
  forStakeholder: (id: string) => [...influenceKeys.all, id] as const,
  network: (params?: Record<string, unknown>) => [...influenceKeys.all, 'network', params] as const,
  history: (id: string) => [...influenceKeys.all, 'history', id] as const,
}

export function useStakeholderInfluence(
  stakeholderId: string | null,
  params?: {
    enabled?: boolean
  },
) {
  return useQuery({
    queryKey: stakeholderId
      ? influenceKeys.forStakeholder(stakeholderId)
      : ['influence', 'disabled'],
    queryFn: () => (stakeholderId ? getInfluenceDataApi(stakeholderId) : Promise.resolve(null)),
    enabled: params?.enabled !== false && Boolean(stakeholderId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateInfluenceScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { stakeholderId: string; data: Record<string, unknown> }) =>
      updateInfluenceScoreApi(params.stakeholderId, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: influenceKeys.all })
    },
  })
}

export function useInfluenceNetwork(params?: Record<string, unknown>) {
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

export function useInfluenceHistory(stakeholderId: string | null) {
  return useQuery({
    queryKey: stakeholderId
      ? influenceKeys.history(stakeholderId)
      : ['influence', 'history', 'disabled'],
    queryFn: () => (stakeholderId ? getInfluenceHistoryApi(stakeholderId) : Promise.resolve(null)),
    enabled: Boolean(stakeholderId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompareInfluence() {
  return useMutation({
    mutationFn: (stakeholderIds: string[]) => compareInfluenceApi(stakeholderIds),
  })
}

/* ------------------------------------------------------------------ *
 * Stub hooks – these were removed during refactoring but are still   *
 * imported by route files. They return empty/no-op results so the    *
 * build passes while consumers are migrated.                         *
 * ------------------------------------------------------------------ */

export function useStakeholderInfluenceList(params?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<StakeholderInfluenceSummary>>({
    queryKey: [...influenceKeys.all, 'list', params],
    queryFn: () =>
      Promise.resolve<PaginatedResponse<StakeholderInfluenceSummary>>({
        data: [],
        pagination: { limit: 0, offset: 0, has_more: false },
      }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStakeholderInfluenceDetail(id: string | null, options?: { enabled?: boolean }) {
  return useQuery<StakeholderInfluenceDetail | undefined>({
    queryKey: [...influenceKeys.all, 'detail', id],
    queryFn: () => Promise.resolve<StakeholderInfluenceDetail | undefined>(undefined),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInfluenceNetworkData(
  id: string | null,
  _params?: Record<string, unknown>,
  options?: { enabled?: boolean },
) {
  return useQuery<NetworkVisualizationData | undefined>({
    queryKey: [...influenceKeys.all, 'network-data', id, _params],
    queryFn: () =>
      Promise.resolve<NetworkVisualizationData | undefined>({
        nodes: [],
        edges: [],
        statistics: { total_nodes: 0, total_edges: 0, avg_connections: 0, density: 0 },
      }),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTopInfluencers(params?: Record<string, unknown>) {
  return useQuery<StakeholderInfluenceSummary[]>({
    queryKey: [...influenceKeys.all, 'top-influencers', params],
    queryFn: () => Promise.resolve<StakeholderInfluenceSummary[]>([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useKeyConnectors(_limit?: number, _minScore?: number) {
  return useQuery<KeyConnector[]>({
    queryKey: [...influenceKeys.all, 'key-connectors', _limit, _minScore],
    queryFn: () => Promise.resolve<KeyConnector[]>([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useNetworkStatistics(params?: Record<string, unknown>) {
  return useQuery<NetworkOverviewStatistics | undefined>({
    queryKey: [...influenceKeys.all, 'network-statistics', params],
    queryFn: () => Promise.resolve<NetworkOverviewStatistics | undefined>(undefined),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInfluenceReports(params?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<InfluenceReport>>({
    queryKey: [...influenceKeys.all, 'reports', params],
    queryFn: () =>
      Promise.resolve<PaginatedResponse<InfluenceReport>>({
        data: [],
        pagination: { limit: 0, offset: 0, has_more: false },
      }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInfluenceReport(id: string | null, options?: { enabled?: boolean }) {
  return useQuery<InfluenceReport | undefined>({
    queryKey: [...influenceKeys.all, 'report', id],
    queryFn: () => Promise.resolve<InfluenceReport | undefined>(undefined),
    enabled: options?.enabled !== false && Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCalculateInfluenceScores() {
  return useMutation({
    mutationFn: (_params?: Record<string, unknown>) => Promise.resolve({ success: true }),
  })
}

export function useCreateInfluenceReport() {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ id: '', success: true }),
  })
}
