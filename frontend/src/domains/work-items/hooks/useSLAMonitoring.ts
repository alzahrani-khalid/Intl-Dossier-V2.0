/**
 * SLA Monitoring Hooks
 * @module domains/work-items/hooks/useSLAMonitoring
 *
 * TanStack Query hooks for SLA dashboard, policies, and escalations.
 * Uses custom fetch helpers for the SLA Edge Function endpoint
 * (specialized error handling with .data unwrapping).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  SLADashboardOverview,
  SLAComplianceByType,
  SLAComplianceByAssignee,
  SLAAtRiskItem,
  SLABreachedItem,
  SLAPolicy,
  SLAPolicyInput,
  SLAEscalation,
  SLAEntityType,
  SLAEscalationStatus,
} from '@/types/sla.types'

const SLA_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sla-monitoring`

// ============================================
// API Helpers (SLA-specific with .data unwrap)
// ============================================

async function fetchSLAEndpoint<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const url = new URL(`${SLA_FUNCTION_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch SLA data')
  }

  const result = await response.json()
  return result.data
}

async function postSLAEndpoint<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${SLA_FUNCTION_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to post SLA data')
  }

  const result = await response.json()
  return result.data
}

async function putSLAEndpoint<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${SLA_FUNCTION_URL}/${endpoint}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update SLA data')
  }

  const result = await response.json()
  return result.data
}

async function deleteSLAEndpoint(endpoint: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${SLA_FUNCTION_URL}/${endpoint}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete SLA data')
  }
}

// ============================================
// Dashboard Hooks
// ============================================

export interface SLADashboardParams {
  entityType?: SLAEntityType
  startDate?: string
  endDate?: string
}

export function useSLADashboard(params: SLADashboardParams = {}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'dashboard', params],
    queryFn: () =>
      fetchSLAEndpoint<SLADashboardOverview>('dashboard', {
        entity_type: params.entityType,
        start_date: params.startDate,
        end_date: params.endDate,
      }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useSLAComplianceByType(
  params: SLADashboardParams = {},
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'compliance', 'type', params],
    queryFn: () =>
      fetchSLAEndpoint<SLAComplianceByType[]>('compliance/type', {
        entity_type: params.entityType,
        start_date: params.startDate,
        end_date: params.endDate,
      }),
    staleTime: 30 * 1000,
  })
}

export interface SLAComplianceByAssigneeParams extends SLADashboardParams {
  limit?: number
}

export function useSLAComplianceByAssignee(
  params: SLAComplianceByAssigneeParams = {},
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'compliance', 'assignee', params],
    queryFn: () =>
      fetchSLAEndpoint<SLAComplianceByAssignee[]>('compliance/assignee', {
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit,
      }),
    staleTime: 30 * 1000,
  })
}

// ============================================
// At-Risk & Breached Items Hooks
// ============================================

export interface SLAAtRiskParams {
  entityType?: SLAEntityType
  threshold?: number
  limit?: number
}

export function useSLAAtRiskItems(params: SLAAtRiskParams = {}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'at-risk', params],
    queryFn: () =>
      fetchSLAEndpoint<SLAAtRiskItem[]>('at-risk', {
        entity_type: params.entityType,
        threshold: params.threshold,
        limit: params.limit,
      }),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useSLABreachedItems(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'breached'],
    queryFn: () => fetchSLAEndpoint<SLABreachedItem[]>('breached'),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })
}

// ============================================
// Policy Management Hooks
// ============================================

export function useSLAPolicies(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'policies'],
    queryFn: () => fetchSLAEndpoint<SLAPolicy[]>('policies'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSLAPolicy(policyId: string | undefined): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'policies', policyId],
    queryFn: () => fetchSLAEndpoint<SLAPolicy>(`policies/${policyId}`),
    enabled: !!policyId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateSLAPolicy(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SLAPolicyInput) =>
      postSLAEndpoint<SLAPolicy>('policies', input as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
    },
  })
}

export function useUpdateSLAPolicy(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: Partial<SLAPolicyInput> & { id: string }) =>
      putSLAEndpoint<SLAPolicy>(`policies/${id}`, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
      queryClient.invalidateQueries({ queryKey: ['sla', 'policies', variables.id] })
    },
  })
}

export function useDeleteSLAPolicy(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (policyId: string) => deleteSLAEndpoint(`policies/${policyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
    },
  })
}

// ============================================
// Escalation Hooks
// ============================================

export interface SLAEscalationsParams {
  status?: SLAEscalationStatus
  entityType?: SLAEntityType
  limit?: number
}

export function useSLAEscalations(params: SLAEscalationsParams = {}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['sla', 'escalations', params],
    queryFn: () =>
      fetchSLAEndpoint<SLAEscalation[]>('escalations', {
        status: params.status,
        entity_type: params.entityType,
        limit: params.limit,
      }),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useAcknowledgeEscalation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (escalationId: string) =>
      postSLAEndpoint<SLAEscalation>(`escalations/${escalationId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
    },
  })
}

export function useResolveEscalation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ escalationId, notes }: { escalationId: string; notes?: string }) =>
      postSLAEndpoint<SLAEscalation>(`escalations/${escalationId}/resolve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
    },
  })
}

// ============================================
// Manual Breach Check Hook
// ============================================

export function useCheckSLABreaches(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => postSLAEndpoint<{ breaches_detected: number }>('check-breaches'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla'] })
    },
  })
}

// ============================================
// Realtime Subscription Hook
// ============================================

export function useSLARealtimeUpdates(onUpdate?: () => void): void {
  const queryClient = useQueryClient()

  useQuery({
    queryKey: ['sla', 'realtime'],
    queryFn: async () => {
      const eventsChannel = supabase
        .channel('sla-events-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_events' }, () => {
          queryClient.invalidateQueries({ queryKey: ['sla', 'dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['sla', 'at-risk'] })
          queryClient.invalidateQueries({ queryKey: ['sla', 'breached'] })
          onUpdate?.()
        })
        .subscribe()

      const escalationsChannel = supabase
        .channel('sla-escalations-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_escalations' }, () => {
          queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
          onUpdate?.()
        })
        .subscribe()

      return { eventsChannel, escalationsChannel }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
