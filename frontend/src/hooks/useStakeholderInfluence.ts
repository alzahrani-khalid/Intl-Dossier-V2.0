/**
 * Stakeholder Influence Hooks
 * Feature: stakeholder-influence-visualization
 *
 * TanStack Query hooks for stakeholder influence analysis operations
 * with automatic caching, invalidation, and network visualization support.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  StakeholderInfluenceSummary,
  StakeholderInfluenceDetail,
  NetworkVisualizationData,
  NetworkOverviewStatistics,
  NetworkCluster,
  KeyConnector,
  InfluenceReport,
  StakeholderInfluenceListParams,
  TopInfluencersParams,
  NetworkVisualizationParams,
  CreateReportParams,
  PaginatedResponse,
  CalculationResult,
  InfluenceTier,
} from '@/types/stakeholder-influence.types'

// ============================================================================
// API Error Class
// ============================================================================

export class InfluenceAPIError extends Error {
  public code: string
  public status: number
  public message_ar: string

  constructor(
    message: string,
    status: number,
    code: string = 'UNKNOWN_ERROR',
    message_ar?: string,
  ) {
    super(message)
    this.name = 'InfluenceAPIError'
    this.status = status
    this.code = code
    this.message_ar = message_ar || message
  }
}

// ============================================================================
// API Helper Functions
// ============================================================================

const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
  }

  return { supabaseUrl, supabaseAnonKey }
}

const getAuthToken = (): string => {
  // Get the token from localStorage (set by Supabase auth)
  const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
  const authData = localStorage.getItem(storageKey)
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      return parsed.access_token || ''
    } catch {
      return ''
    }
  }
  return ''
}

async function fetchInfluenceAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  const token = getAuthToken()

  const url = `${supabaseUrl}/functions/v1/stakeholder-influence${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token || supabaseAnonKey}`,
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new InfluenceAPIError(
      data.error?.message_en || 'An error occurred',
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message_ar,
    )
  }

  return data
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const influenceKeys = {
  all: ['stakeholder-influence'] as const,
  lists: () => [...influenceKeys.all, 'list'] as const,
  list: (params?: StakeholderInfluenceListParams) =>
    [...influenceKeys.lists(), { params }] as const,
  details: () => [...influenceKeys.all, 'detail'] as const,
  detail: (dossierId: string) => [...influenceKeys.details(), dossierId] as const,
  network: (dossierId: string, degrees?: number) =>
    [...influenceKeys.all, 'network', dossierId, degrees || 2] as const,
  topInfluencers: (params?: TopInfluencersParams) =>
    [...influenceKeys.all, 'top-influencers', { params }] as const,
  keyConnectors: (limit?: number, minScore?: number) =>
    [...influenceKeys.all, 'key-connectors', { limit, minScore }] as const,
  clusters: () => [...influenceKeys.all, 'clusters'] as const,
  statistics: () => [...influenceKeys.all, 'statistics'] as const,
  reports: () => [...influenceKeys.all, 'reports'] as const,
  report: (reportId: string) => [...influenceKeys.reports(), reportId] as const,
}

// ============================================================================
// Stakeholder Influence Hooks
// ============================================================================

/**
 * Hook to fetch list of stakeholders with influence scores
 */
export function useStakeholderInfluenceList(
  params?: StakeholderInfluenceListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<StakeholderInfluenceSummary>, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.offset) queryParams.set('offset', params.offset.toString())
      if (params?.sort_by) queryParams.set('sort_by', params.sort_by)
      if (params?.sort_order) queryParams.set('sort_order', params.sort_order)
      if (params?.type) queryParams.set('type', params.type)
      if (params?.min_score) queryParams.set('min_score', params.min_score.toString())

      const query = queryParams.toString()
      return fetchInfluenceAPI<PaginatedResponse<StakeholderInfluenceSummary>>(
        query ? `?${query}` : '',
      )
    },
    ...options,
  })
}

/**
 * Hook to fetch detailed influence metrics for a specific stakeholder
 */
export function useStakeholderInfluenceDetail(
  dossierId: string,
  options?: Omit<
    UseQueryOptions<StakeholderInfluenceDetail, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.detail(dossierId),
    queryFn: () => fetchInfluenceAPI<StakeholderInfluenceDetail>(`/${dossierId}`),
    enabled: !!dossierId,
    ...options,
  })
}

/**
 * Hook to fetch network visualization data for a stakeholder
 */
export function useInfluenceNetworkData(
  dossierId: string,
  params?: NetworkVisualizationParams,
  options?: Omit<
    UseQueryOptions<NetworkVisualizationData, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.network(dossierId, params?.degrees),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.degrees) queryParams.set('degrees', params.degrees.toString())

      const query = queryParams.toString()
      return fetchInfluenceAPI<NetworkVisualizationData>(
        `/${dossierId}/network${query ? `?${query}` : ''}`,
      )
    },
    enabled: !!dossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes - network data changes infrequently
    ...options,
  })
}

/**
 * Hook to fetch top influencers
 */
export function useTopInfluencers(
  params?: TopInfluencersParams,
  options?: Omit<
    UseQueryOptions<{ data: StakeholderInfluenceSummary[]; total: number }, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.topInfluencers(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.type) queryParams.set('type', params.type)
      if (params?.tier) queryParams.set('tier', params.tier)

      const query = queryParams.toString()
      return fetchInfluenceAPI<{ data: StakeholderInfluenceSummary[]; total: number }>(
        `/top-influencers${query ? `?${query}` : ''}`,
      )
    },
    ...options,
  })
}

/**
 * Hook to fetch key connectors (bridge stakeholders)
 */
export function useKeyConnectors(
  limit?: number,
  minScore?: number,
  options?: Omit<
    UseQueryOptions<{ data: KeyConnector[]; total: number }, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.keyConnectors(limit, minScore),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (limit) queryParams.set('limit', limit.toString())
      if (minScore) queryParams.set('min_score', minScore.toString())

      const query = queryParams.toString()
      return fetchInfluenceAPI<{ data: KeyConnector[]; total: number }>(
        `/key-connectors${query ? `?${query}` : ''}`,
      )
    },
    ...options,
  })
}

/**
 * Hook to fetch network clusters
 */
export function useNetworkClusters(
  options?: Omit<
    UseQueryOptions<{ data: NetworkCluster[]; total: number }, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.clusters(),
    queryFn: () => fetchInfluenceAPI<{ data: NetworkCluster[]; total: number }>('/clusters'),
    ...options,
  })
}

/**
 * Hook to fetch network-wide statistics
 */
export function useNetworkStatistics(
  options?: Omit<
    UseQueryOptions<NetworkOverviewStatistics, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.statistics(),
    queryFn: () => fetchInfluenceAPI<NetworkOverviewStatistics>('/statistics'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch list of influence reports
 */
export function useInfluenceReports(
  params?: { limit?: number; offset?: number; type?: string },
  options?: Omit<
    UseQueryOptions<PaginatedResponse<InfluenceReport>, InfluenceAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: influenceKeys.reports(),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.offset) queryParams.set('offset', params.offset.toString())
      if (params?.type) queryParams.set('type', params.type)

      const query = queryParams.toString()
      return fetchInfluenceAPI<PaginatedResponse<InfluenceReport>>(
        `/reports${query ? `?${query}` : ''}`,
      )
    },
    ...options,
  })
}

/**
 * Hook to fetch a specific influence report
 */
export function useInfluenceReport(
  reportId: string,
  options?: Omit<UseQueryOptions<InfluenceReport, InfluenceAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: influenceKeys.report(reportId),
    queryFn: () => fetchInfluenceAPI<InfluenceReport>(`/reports/${reportId}`),
    enabled: !!reportId,
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to calculate influence scores for all stakeholders
 */
export function useCalculateInfluenceScores() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()

  return useMutation({
    mutationFn: () => fetchInfluenceAPI<CalculationResult>('/calculate', { method: 'POST' }),
    onSuccess: (data) => {
      // Invalidate all influence queries
      queryClient.invalidateQueries({ queryKey: influenceKeys.all })

      const message = i18n.language === 'ar' ? data.message_ar : data.message_en
      toast.success(
        `${message} (${data.stakeholders_updated} ${t('stakeholders', 'stakeholders')})`,
      )
    },
    onError: (error: InfluenceAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to generate an influence report
 */
export function useCreateInfluenceReport() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()

  return useMutation({
    mutationFn: (params: CreateReportParams) =>
      fetchInfluenceAPI<InfluenceReport>('/report', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: influenceKeys.reports() })

      // Add new report to cache
      queryClient.setQueryData(influenceKeys.report(data.id), data)

      const title = i18n.language === 'ar' ? data.title_ar : data.title_en
      toast.success(t('influence.report.created', { title }))
    },
    onError: (error: InfluenceAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Prefetch Hooks
// ============================================================================

/**
 * Hook to prefetch stakeholder influence data (useful for hover effects)
 */
export function usePrefetchStakeholderInfluence() {
  const queryClient = useQueryClient()

  return (dossierId: string) => {
    queryClient.prefetchQuery({
      queryKey: influenceKeys.detail(dossierId),
      queryFn: () => fetchInfluenceAPI<StakeholderInfluenceDetail>(`/${dossierId}`),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook to prefetch network data
 */
export function usePrefetchNetworkData() {
  const queryClient = useQueryClient()

  return (dossierId: string, degrees: number = 2) => {
    queryClient.prefetchQuery({
      queryKey: influenceKeys.network(dossierId, degrees),
      queryFn: () =>
        fetchInfluenceAPI<NetworkVisualizationData>(`/${dossierId}/network?degrees=${degrees}`),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================================================
// Invalidation Hook
// ============================================================================

/**
 * Hook to invalidate all influence queries (useful after bulk operations)
 */
export function useInvalidateInfluenceQueries() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: influenceKeys.all })
  }
}

// ============================================================================
// Combined Data Hook
// ============================================================================

/**
 * Hook to fetch all influence dashboard data
 * Combines statistics, top influencers, and key connectors
 */
export function useInfluenceDashboardData() {
  const statistics = useNetworkStatistics()
  const topInfluencers = useTopInfluencers({ limit: 10 })
  const keyConnectors = useKeyConnectors(10, 40)
  const clusters = useNetworkClusters()

  return {
    statistics,
    topInfluencers,
    keyConnectors,
    clusters,
    isLoading:
      statistics.isLoading ||
      topInfluencers.isLoading ||
      keyConnectors.isLoading ||
      clusters.isLoading,
    isError:
      statistics.isError || topInfluencers.isError || keyConnectors.isError || clusters.isError,
    refetch: () => {
      statistics.refetch()
      topInfluencers.refetch()
      keyConnectors.refetch()
      clusters.refetch()
    },
  }
}
