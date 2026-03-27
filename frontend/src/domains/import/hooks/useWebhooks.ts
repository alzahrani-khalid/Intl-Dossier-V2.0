/**
 * Webhooks Hook
 * @module domains/import/hooks/useWebhooks
 *
 * Hooks for webhook CRUD and management.
 * API calls delegated to import.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWebhooks as getWebhooksApi,
  getWebhook,
  createWebhook as createWebhookApi,
  updateWebhook as updateWebhookApi,
  deleteWebhook as deleteWebhookApi,
  toggleWebhook as toggleWebhookApi,
  testWebhook as testWebhookApi,
  getWebhookDeliveries as getWebhookDeliveriesApi,
  getWebhookStats as getWebhookStatsApi,
  getWebhookTemplates as getWebhookTemplatesApi,
} from '../repositories/import.repository'

export const webhookKeys = {
  all: ['webhooks'] as const,
  list: (params?: Record<string, unknown>) => [...webhookKeys.all, 'list', params] as const,
  detail: (id: string) => [...webhookKeys.all, 'detail', id] as const,
  deliveries: (params?: Record<string, unknown>) =>
    [...webhookKeys.all, 'deliveries', params] as const,
  stats: (webhookId: string) => [...webhookKeys.all, 'stats', webhookId] as const,
  templates: () => [...webhookKeys.all, 'templates'] as const,
}

export function useWebhooks(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: () => getWebhooksApi(searchParams),
    staleTime: 60 * 1000,
  })
}

export function useWebhook(id: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: id ? webhookKeys.detail(id) : ['webhooks', 'disabled'],
    queryFn: () => (id ? getWebhook(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreateWebhook(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createWebhookApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useUpdateWebhook(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateWebhookApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useDeleteWebhook(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebhookApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useToggleWebhook(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => toggleWebhookApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useTestWebhook(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => testWebhookApi(data),
  })
}

export function useWebhookDeliveries(
  params?: Record<string, unknown>,
): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: webhookKeys.deliveries(params),
    queryFn: () => getWebhookDeliveriesApi(searchParams),
    staleTime: 30 * 1000,
  })
}

export function useWebhookStats(webhookId: string, days: number = 30): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: webhookKeys.stats(webhookId),
    queryFn: () => getWebhookStatsApi(webhookId, days),
    enabled: Boolean(webhookId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useWebhookTemplates(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: webhookKeys.templates(),
    queryFn: () => getWebhookTemplatesApi(),
    staleTime: 30 * 60 * 1000,
  })
}

/* Alias – renamed during refactoring, still imported by pages */
export const useToggleWebhookActive = useToggleWebhook
