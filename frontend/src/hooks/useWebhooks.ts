/**
 * Webhooks Hook
 * Feature: webhook-integration
 *
 * Comprehensive TanStack Query hooks for webhook management:
 * - List webhooks with search/filters
 * - Get single webhook with full profile
 * - Create/update/delete webhooks
 * - Test webhook connectivity
 * - Get delivery logs and statistics
 * - Get webhook templates
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookSearchParams,
  WebhookListResponse,
  WebhookDelivery,
  WebhookDeliverySearchParams,
  WebhookDeliveryListResponse,
  WebhookStats,
  WebhookTemplate,
  WebhookTemplatesResponse,
  WebhookTestResult,
} from '@/types/webhook.types'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// Query Keys (hierarchical structure for cache management)
// ============================================================================

export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (params?: WebhookSearchParams) => [...webhookKeys.lists(), params] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  deliveries: (webhookId: string) => [...webhookKeys.all, 'deliveries', webhookId] as const,
  deliveryList: (params: WebhookDeliverySearchParams) =>
    [...webhookKeys.deliveries(params.webhook_id), params] as const,
  stats: (webhookId: string, days?: number) =>
    [...webhookKeys.all, 'stats', webhookId, days] as const,
  templates: () => [...webhookKeys.all, 'templates'] as const,
}

// ============================================================================
// Auth Helper
// ============================================================================

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// ============================================================================
// List Webhooks Hook
// ============================================================================

/**
 * Hook to list webhooks with search and filters
 */
export function useWebhooks(
  params?: WebhookSearchParams,
  options?: Omit<UseQueryOptions<WebhookListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: async (): Promise<WebhookListResponse> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params?.search) searchParams.set('search', params.search)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active))
      if (params?.event_type) searchParams.set('event_type', params.event_type)

      const response = await fetch(`${API_BASE_URL}/webhooks?${searchParams}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch webhooks')
      }

      return response.json()
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Single Webhook Hook
// ============================================================================

/**
 * Hook to get a single webhook with full profile
 */
export function useWebhook(
  id: string,
  options?: Omit<UseQueryOptions<Webhook, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: async (): Promise<Webhook> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks?id=${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch webhook')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

// ============================================================================
// Create Webhook Hook
// ============================================================================

/**
 * Hook to create a new webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('webhooks')

  return useMutation({
    mutationFn: async (data: WebhookCreate): Promise<Webhook> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create webhook')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() })
      if (data.id) {
        queryClient.setQueryData(webhookKeys.detail(data.id), data)
      }
      toast.success(t('messages.created', { name: data.name_en }))
    },
    onError: (error: Error) => {
      toast.error(t('messages.createError', { error: error.message }))
    },
  })
}

// ============================================================================
// Update Webhook Hook
// ============================================================================

/**
 * Hook to update an existing webhook
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('webhooks')

  return useMutation({
    mutationFn: async (data: WebhookUpdate): Promise<Webhook> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update webhook')
      }

      return response.json()
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: webhookKeys.detail(id) })
      const previousWebhook = queryClient.getQueryData<Webhook>(webhookKeys.detail(id))
      return { previousWebhook }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(webhookKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousWebhook) {
        queryClient.setQueryData(webhookKeys.detail(id), context.previousWebhook)
      }
      toast.error(t('messages.updateError', { error: error.message }))
    },
  })
}

// ============================================================================
// Delete Webhook Hook
// ============================================================================

/**
 * Hook to delete a webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('webhooks')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks?id=${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete webhook')
      }

      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: webhookKeys.detail(id) })
      queryClient.removeQueries({ queryKey: webhookKeys.deliveries(id) })
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() })
      toast.success(t('messages.deleted'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.deleteError', { error: error.message }))
    },
  })
}

// ============================================================================
// Toggle Webhook Active Status Hook
// ============================================================================

/**
 * Hook to quickly toggle a webhook's active status
 */
export function useToggleWebhookActive() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('webhooks')

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }): Promise<Webhook> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, is_active }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to toggle webhook')
      }

      return response.json()
    },
    onSuccess: (data, { id, is_active }) => {
      queryClient.setQueryData(webhookKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() })
      toast.success(is_active ? t('messages.enabled') : t('messages.disabled'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.toggleError', { error: error.message }))
    },
  })
}

// ============================================================================
// Test Webhook Hook
// ============================================================================

/**
 * Hook to test a webhook endpoint
 */
export function useTestWebhook() {
  const { t } = useTranslation('webhooks')

  return useMutation({
    mutationFn: async (data: {
      webhook_id?: string
      url?: string
      auth_type?: string
      auth_secret?: string
    }): Promise<WebhookTestResult> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to test webhook')
      }

      return response.json()
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('messages.testSuccess', { responseTime: result.response_time_ms }))
      } else {
        toast.error(
          t('messages.testFailed', { error: result.error_message || `HTTP ${result.status_code}` }),
        )
      }
    },
    onError: (error: Error) => {
      toast.error(t('messages.testError', { error: error.message }))
    },
  })
}

// ============================================================================
// Get Webhook Deliveries Hook
// ============================================================================

/**
 * Hook to get webhook delivery logs
 */
export function useWebhookDeliveries(
  params: WebhookDeliverySearchParams,
  options?: Omit<UseQueryOptions<WebhookDeliveryListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: webhookKeys.deliveryList(params),
    queryFn: async (): Promise<WebhookDeliveryListResponse> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      searchParams.set('webhook_id', params.webhook_id)
      if (params.page) searchParams.set('page', String(params.page))
      if (params.limit) searchParams.set('limit', String(params.limit))
      if (params.status) searchParams.set('status', params.status)

      const response = await fetch(`${API_BASE_URL}/webhooks/deliveries?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch deliveries')
      }

      return response.json()
    },
    enabled: !!params.webhook_id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Webhook Statistics Hook
// ============================================================================

/**
 * Hook to get webhook delivery statistics
 */
export function useWebhookStats(
  webhookId: string,
  days: number = 30,
  options?: Omit<UseQueryOptions<WebhookStats, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: webhookKeys.stats(webhookId, days),
    queryFn: async (): Promise<WebhookStats> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/webhooks/stats?webhook_id=${webhookId}&days=${days}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch statistics')
      }

      return response.json()
    },
    enabled: !!webhookId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Webhook Templates Hook
// ============================================================================

/**
 * Hook to get available webhook templates
 */
export function useWebhookTemplates(
  options?: Omit<UseQueryOptions<WebhookTemplate[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: webhookKeys.templates(),
    queryFn: async (): Promise<WebhookTemplate[]> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/webhooks/templates`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch templates')
      }

      const result: WebhookTemplatesResponse = await response.json()
      return result.data
    },
    staleTime: 24 * 60 * 60_000, // Cache for 24 hours
    gcTime: 48 * 60 * 60_000,
    ...options,
  })
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Hook to invalidate all webhook queries
 */
export function useInvalidateWebhooks() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: webhookKeys.all })
  }
}

/**
 * Hook to invalidate webhook deliveries
 */
export function useInvalidateWebhookDeliveries(webhookId: string) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries(webhookId) })
  }
}
