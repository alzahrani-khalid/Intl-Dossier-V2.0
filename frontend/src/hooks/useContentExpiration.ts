/**
 * Content Expiration Hook
 * Feature: content-expiration-dates
 * Provides expiration management functionality for dossiers, briefs, and positions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ContentExpirationStatus,
  ContentExpirationRule,
  ContentExpirationHistory,
  ContentExpirationStats,
  ExpiringContentItem,
  SetExpirationRequest,
  ExtendExpirationRequest,
  MarkReviewedRequest,
  RequestReviewRequest,
  UseContentExpirationOptions,
  ExpirationEntityType,
  SetExpirationResponse,
  ExtendExpirationResponse,
  MarkReviewedResponse,
  RequestReviewResponse,
} from '@/types/content-expiration.types'

const FUNCTION_URL = '/functions/v1/content-expiration'

// Query keys factory
export const contentExpirationKeys = {
  all: ['content-expiration'] as const,
  expiring: (entityType?: string, daysAhead?: number, includeExpired?: boolean) =>
    [...contentExpirationKeys.all, 'expiring', { entityType, daysAhead, includeExpired }] as const,
  status: (entityType: string, entityId: string) =>
    [...contentExpirationKeys.all, 'status', entityType, entityId] as const,
  stats: (forUser?: boolean) => [...contentExpirationKeys.all, 'stats', { forUser }] as const,
  rules: (entityType?: string) => [...contentExpirationKeys.all, 'rules', { entityType }] as const,
  history: (entityType: string, entityId: string) =>
    [...contentExpirationKeys.all, 'history', entityType, entityId] as const,
}

// API functions
async function fetchExpiringContent(
  entityType?: ExpirationEntityType,
  daysAhead: number = 30,
  includeExpired: boolean = false,
  limit: number = 100,
): Promise<ExpiringContentItem[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'list',
    days_ahead: daysAhead.toString(),
    include_expired: includeExpired.toString(),
    limit: limit.toString(),
  })

  if (entityType) {
    params.set('entity_type', entityType)
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiring content')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationStatus(
  entityType: ExpirationEntityType,
  entityId: string,
): Promise<ContentExpirationStatus | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'status',
    entity_type: entityType,
    entity_id: entityId,
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration status')
  }

  const result = await response.json()
  return result.data
}

async function fetchExpirationStats(forUser: boolean = false): Promise<ContentExpirationStats[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'stats',
    for_user: forUser.toString(),
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration stats')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationRules(
  entityType?: ExpirationEntityType,
): Promise<ContentExpirationRule[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({ action: 'rules' })

  if (entityType) {
    params.set('entity_type', entityType)
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration rules')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchExpirationHistory(
  entityType: ExpirationEntityType,
  entityId: string,
  limit: number = 50,
): Promise<ContentExpirationHistory[]> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    action: 'history',
    entity_type: entityType,
    entity_id: entityId,
    limit: limit.toString(),
  })

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiration history')
  }

  const result = await response.json()
  return result.data || []
}

// Mutation functions
async function setExpiration(params: SetExpirationRequest): Promise<SetExpirationResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/set`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to set expiration')
  }

  return response.json()
}

async function extendExpiration(
  params: ExtendExpirationRequest,
): Promise<ExtendExpirationResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/extend`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extend expiration')
  }

  return response.json()
}

async function markAsReviewed(params: MarkReviewedRequest): Promise<MarkReviewedResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark as reviewed')
  }

  return response.json()
}

async function requestReview(params: RequestReviewRequest): Promise<RequestReviewResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_URL}/request-review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to request review')
  }

  return response.json()
}

// Main hook
export function useContentExpiration(options: UseContentExpirationOptions = {}) {
  const {
    entityType,
    entityId,
    daysAhead = 30,
    includeExpired = false,
    forCurrentUser = false,
    enabled = true,
  } = options

  const queryClient = useQueryClient()

  // Expiring content query
  const expiringContentQuery = useQuery({
    queryKey: contentExpirationKeys.expiring(entityType, daysAhead, includeExpired),
    queryFn: () => fetchExpiringContent(entityType, daysAhead, includeExpired),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Expiration status query (for specific entity)
  const statusQuery = useQuery({
    queryKey: contentExpirationKeys.status(entityType || '', entityId || ''),
    queryFn: () => fetchExpirationStatus(entityType!, entityId!),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Stats query
  const statsQuery = useQuery({
    queryKey: contentExpirationKeys.stats(forCurrentUser),
    queryFn: () => fetchExpirationStats(forCurrentUser),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Rules query
  const rulesQuery = useQuery({
    queryKey: contentExpirationKeys.rules(entityType),
    queryFn: () => fetchExpirationRules(entityType),
    enabled: enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes (rules don't change often)
  })

  // History query (for specific entity)
  const historyQuery = useQuery({
    queryKey: contentExpirationKeys.history(entityType || '', entityId || ''),
    queryFn: () => fetchExpirationHistory(entityType!, entityId!),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Mutations
  const setExpirationMutation = useMutation({
    mutationFn: setExpiration,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const extendExpirationMutation = useMutation({
    mutationFn: extendExpiration,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const markAsReviewedMutation = useMutation({
    mutationFn: markAsReviewed,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.expiring(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  const requestReviewMutation = useMutation({
    mutationFn: requestReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.status(variables.entity_type, variables.entity_id),
      })
      queryClient.invalidateQueries({
        queryKey: contentExpirationKeys.history(variables.entity_type, variables.entity_id),
      })
    },
  })

  // Refetch all function
  const refetchAll = async () => {
    await Promise.all([
      expiringContentQuery.refetch(),
      statusQuery.refetch(),
      statsQuery.refetch(),
      historyQuery.refetch(),
    ])
  }

  return {
    // Query data
    expiringContent: expiringContentQuery.data || [],
    expirationStatus: statusQuery.data || null,
    expirationStats: statsQuery.data || [],
    expirationRules: rulesQuery.data || [],
    expirationHistory: historyQuery.data || [],

    // Loading states
    isLoadingContent: expiringContentQuery.isLoading,
    isLoadingStatus: statusQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingRules: rulesQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,

    // Error states
    contentError: expiringContentQuery.error,
    statusError: statusQuery.error,
    statsError: statsQuery.error,
    rulesError: rulesQuery.error,
    historyError: historyQuery.error,

    // Mutations
    setExpiration: setExpirationMutation.mutateAsync,
    extendExpiration: extendExpirationMutation.mutateAsync,
    markAsReviewed: markAsReviewedMutation.mutateAsync,
    requestReview: requestReviewMutation.mutateAsync,

    // Mutation states
    isSettingExpiration: setExpirationMutation.isPending,
    isExtending: extendExpirationMutation.isPending,
    isMarking: markAsReviewedMutation.isPending,
    isRequesting: requestReviewMutation.isPending,

    // Utility
    refetchAll,
  }
}

// Convenience hook for specific entity
export function useEntityExpiration(
  entityType: ExpirationEntityType,
  entityId: string,
  options: Omit<UseContentExpirationOptions, 'entityType' | 'entityId'> = {},
) {
  return useContentExpiration({
    ...options,
    entityType,
    entityId,
  })
}

// Hook for dashboard/overview
export function useExpirationOverview(forCurrentUser: boolean = false) {
  return useContentExpiration({
    forCurrentUser,
    daysAhead: 30,
    includeExpired: true,
  })
}

export default useContentExpiration
