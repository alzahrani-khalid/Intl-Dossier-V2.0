/**
 * Scenario Sandbox Hooks
 * Feature: Scenario Planning and What-If Analysis
 *
 * TanStack Query hooks for scenario sandbox operations
 * with automatic caching, invalidation, and optimistic updates.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  Scenario,
  ScenarioFull,
  ScenarioVariable,
  ScenarioOutcome,
  ScenarioComparison,
  ScenarioComparisonData,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  CreateVariableRequest,
  UpdateVariableRequest,
  CreateOutcomeRequest,
  UpdateOutcomeRequest,
  CreateComparisonRequest,
  CloneScenarioRequest,
  AddCollaboratorRequest,
  ListScenariosParams,
  PaginatedResponse,
  SuccessResponse,
} from '@/types/scenario-sandbox.types'

// ============================================================================
// API Error Class
// ============================================================================

export class ScenarioAPIError extends Error {
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
    this.name = 'ScenarioAPIError'
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

async function fetchScenarioAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  const token = getAuthToken()

  const url = `${supabaseUrl}/functions/v1/scenario-sandbox${endpoint}`

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
    throw new ScenarioAPIError(
      data.error?.message_en || 'An error occurred',
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message_ar,
    )
  }

  return data.data !== undefined ? data.data : data
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const scenarioKeys = {
  all: ['scenario-sandbox'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: (params?: ListScenariosParams) => [...scenarioKeys.lists(), { params }] as const,
  details: () => [...scenarioKeys.all, 'detail'] as const,
  detail: (id: string) => [...scenarioKeys.details(), id] as const,
  variables: (scenarioId: string) => [...scenarioKeys.all, 'variables', scenarioId] as const,
  outcomes: (scenarioId: string) => [...scenarioKeys.all, 'outcomes', scenarioId] as const,
  comparisons: () => [...scenarioKeys.all, 'comparisons'] as const,
  comparison: (ids: string[]) => [...scenarioKeys.comparisons(), ids] as const,
}

// ============================================================================
// Scenario Hooks
// ============================================================================

/**
 * Hook to fetch list of scenarios
 */
export function useScenarios(
  params?: ListScenariosParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Scenario>, ScenarioAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: scenarioKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.offset) queryParams.set('offset', params.offset.toString())
      if (params?.status) queryParams.set('status', params.status)
      if (params?.type) queryParams.set('type', params.type)
      if (params?.search) queryParams.set('search', params.search)
      if (params?.sort_by) queryParams.set('sort_by', params.sort_by)
      if (params?.sort_order) queryParams.set('sort_order', params.sort_order)

      const query = queryParams.toString()
      const response = await fetchScenarioAPI<PaginatedResponse<Scenario>>(query ? `?${query}` : '')
      return response
    },
    ...options,
  })
}

/**
 * Hook to fetch a single scenario with full data
 */
export function useScenario(
  id: string,
  options?: Omit<UseQueryOptions<ScenarioFull, ScenarioAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: scenarioKeys.detail(id),
    queryFn: () => fetchScenarioAPI<ScenarioFull>(`/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to create a new scenario
 */
export function useCreateScenario() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: (data: CreateScenarioRequest) =>
      fetchScenarioAPI<Scenario>('', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() })
      toast.success(t('scenario.messages.created'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to update a scenario
 */
export function useUpdateScenario() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScenarioRequest }) =>
      fetchScenarioAPI<Scenario>(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() })
      toast.success(t('scenario.messages.updated'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a scenario
 */
export function useDeleteScenario() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: (id: string) => fetchScenarioAPI<SuccessResponse>(`/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() })
      toast.success(t('scenario.messages.deleted'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to clone a scenario
 */
export function useCloneScenario() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloneScenarioRequest }) =>
      fetchScenarioAPI<Scenario>(`/${id}/clone`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() })
      toast.success(t('scenario.messages.cloned'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Variable Hooks
// ============================================================================

/**
 * Hook to fetch variables for a scenario
 */
export function useScenarioVariables(
  scenarioId: string,
  options?: Omit<UseQueryOptions<ScenarioVariable[], ScenarioAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: scenarioKeys.variables(scenarioId),
    queryFn: () => fetchScenarioAPI<ScenarioVariable[]>(`/${scenarioId}/variables`),
    enabled: !!scenarioId,
    ...options,
  })
}

/**
 * Hook to create a variable
 */
export function useCreateVariable() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ scenarioId, data }: { scenarioId: string; data: CreateVariableRequest }) =>
      fetchScenarioAPI<ScenarioVariable>(`/${scenarioId}/variables`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.variables(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('variable.messages.added'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to update a variable
 */
export function useUpdateVariable() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({
      id,
      scenarioId,
      data,
    }: {
      id: string
      scenarioId: string
      data: UpdateVariableRequest
    }) =>
      fetchScenarioAPI<ScenarioVariable>(`/variables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.variables(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('variable.messages.updated'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a variable
 */
export function useDeleteVariable() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ id, scenarioId }: { id: string; scenarioId: string }) =>
      fetchScenarioAPI<SuccessResponse>(`/variables/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.variables(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('variable.messages.deleted'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Outcome Hooks
// ============================================================================

/**
 * Hook to fetch outcomes for a scenario
 */
export function useScenarioOutcomes(
  scenarioId: string,
  options?: Omit<UseQueryOptions<ScenarioOutcome[], ScenarioAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: scenarioKeys.outcomes(scenarioId),
    queryFn: () => fetchScenarioAPI<ScenarioOutcome[]>(`/${scenarioId}/outcomes`),
    enabled: !!scenarioId,
    ...options,
  })
}

/**
 * Hook to create an outcome
 */
export function useCreateOutcome() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ scenarioId, data }: { scenarioId: string; data: CreateOutcomeRequest }) =>
      fetchScenarioAPI<ScenarioOutcome>(`/${scenarioId}/outcomes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.outcomes(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('outcome.messages.added'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to update an outcome
 */
export function useUpdateOutcome() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({
      id,
      scenarioId,
      data,
    }: {
      id: string
      scenarioId: string
      data: UpdateOutcomeRequest
    }) =>
      fetchScenarioAPI<ScenarioOutcome>(`/outcomes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.outcomes(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('outcome.messages.updated'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to delete an outcome
 */
export function useDeleteOutcome() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ id, scenarioId }: { id: string; scenarioId: string }) =>
      fetchScenarioAPI<SuccessResponse>(`/outcomes/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.outcomes(scenarioId) })
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('outcome.messages.deleted'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Comparison Hooks
// ============================================================================

/**
 * Hook to fetch comparisons
 */
export function useScenarioComparisons(
  options?: Omit<UseQueryOptions<ScenarioComparison[], ScenarioAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: scenarioKeys.comparisons(),
    queryFn: () => fetchScenarioAPI<ScenarioComparison[]>('/comparisons'),
    ...options,
  })
}

/**
 * Hook to compare scenarios
 */
export function useCompareScenarios(
  scenarioIds: string[],
  options?: Omit<UseQueryOptions<ScenarioComparisonData, ScenarioAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: scenarioKeys.comparison(scenarioIds),
    queryFn: () =>
      fetchScenarioAPI<ScenarioComparisonData>('/comparisons/compare', {
        method: 'POST',
        body: JSON.stringify({ scenario_ids: scenarioIds }),
      }),
    enabled: scenarioIds.length >= 2,
    ...options,
  })
}

/**
 * Hook to create a comparison
 */
export function useCreateComparison() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: (data: CreateComparisonRequest) =>
      fetchScenarioAPI<ScenarioComparison>('/comparisons', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.comparisons() })
      toast.success(t('comparison.messages.created'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a comparison
 */
export function useDeleteComparison() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: (id: string) =>
      fetchScenarioAPI<SuccessResponse>(`/comparisons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.comparisons() })
      toast.success(t('comparison.messages.deleted'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Collaborator Hooks
// ============================================================================

/**
 * Hook to add a collaborator
 */
export function useAddCollaborator() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ scenarioId, data }: { scenarioId: string; data: AddCollaboratorRequest }) =>
      fetchScenarioAPI<{ id: string }>(`/${scenarioId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('collaborator.messages.added'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

/**
 * Hook to remove a collaborator
 */
export function useRemoveCollaborator() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation('scenario-sandbox')

  return useMutation({
    mutationFn: ({ scenarioId, userId }: { scenarioId: string; userId: string }) =>
      fetchScenarioAPI<SuccessResponse>(`/${scenarioId}/collaborators/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(scenarioId) })
      toast.success(t('collaborator.messages.removed'))
    },
    onError: (error: ScenarioAPIError) => {
      const message = i18n.language === 'ar' ? error.message_ar : error.message
      toast.error(message)
    },
  })
}

// ============================================================================
// Invalidation Hook
// ============================================================================

/**
 * Hook to invalidate all scenario queries
 */
export function useInvalidateScenarioQueries() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: scenarioKeys.all })
  }
}
