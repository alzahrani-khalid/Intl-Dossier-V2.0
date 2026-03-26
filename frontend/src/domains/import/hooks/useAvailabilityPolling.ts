/**
 * Availability Polling Hook
 * @module domains/import/hooks/useAvailabilityPolling
 *
 * Hooks for availability polling configuration and monitoring.
 * API calls delegated to import.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPollingConfigs as getPollingConfigsApi,
  getPollingConfig,
  createPollingConfig as createPollingConfigApi,
  updatePollingConfig as updatePollingConfigApi,
  deletePollingConfig as deletePollingConfigApi,
  triggerPoll as triggerPollApi,
  getPollingHistory as getPollingHistoryApi,
  getPollingStats as getPollingStatsApi,
} from '../repositories/import.repository'

export const pollingKeys = {
  all: ['availability-polling'] as const,
  list: (params?: Record<string, unknown>) => [...pollingKeys.all, 'list', params] as const,
  detail: (id: string) => [...pollingKeys.all, 'detail', id] as const,
  history: (id: string, params?: Record<string, unknown>) => [...pollingKeys.all, 'history', id, params] as const,
  stats: () => [...pollingKeys.all, 'stats'] as const,
}

export function usePollingConfigs(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: pollingKeys.list(params),
    queryFn: () => getPollingConfigsApi(searchParams),
    staleTime: 60 * 1000,
  })
}

export function usePollingConfig(id: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: id ? pollingKeys.detail(id) : ['availability-polling', 'disabled'],
    queryFn: () => (id ? getPollingConfig(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreatePollingConfig(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createPollingConfigApi(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: pollingKeys.all }) },
  })
}

export function useUpdatePollingConfig(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updatePollingConfigApi(params.id, params.data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: pollingKeys.all }) },
  })
}

export function useDeletePollingConfig(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePollingConfigApi(id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: pollingKeys.all }) },
  })
}

export function useTriggerPoll(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => triggerPollApi(id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: pollingKeys.all }) },
  })
}

export function usePollingHistory(
  id: string | null,
  params?: Record<string, unknown>,
): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: id ? pollingKeys.history(id, params) : ['availability-polling', 'history', 'disabled'],
    queryFn: () => (id ? getPollingHistoryApi(id, searchParams) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}

export function usePollingStats(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: pollingKeys.stats(),
    queryFn: () => getPollingStatsApi(),
    staleTime: 5 * 60 * 1000,
  })
}
