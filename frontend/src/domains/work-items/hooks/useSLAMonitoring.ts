/**
 * SLA Monitoring Hooks
 * @module domains/work-items/hooks/useSLAMonitoring
 *
 * TanStack Query hooks for SLA dashboard, policies, and escalations.
 * All API calls go through the work-items repository → shared apiClient.
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { supabase } from '@/lib/supabase'
import type { SLAPolicyInput, SLAEntityType, SLAEscalationStatus } from '@/types/sla.types'
import {
  getSLADashboard,
  getSLAComplianceByType,
  getSLAComplianceByAssignee,
  getSLAAtRiskItems,
  getSLABreachedItems,
  getSLAPolicies,
  getSLAPolicy,
  createSLAPolicy as repoCreateSLAPolicy,
  updateSLAPolicy as repoUpdateSLAPolicy,
  deleteSLAPolicy as repoDeleteSLAPolicy,
  getSLAEscalations,
  acknowledgeSLAEscalation,
  resolveSLAEscalation,
  checkSLABreaches,
} from '../repositories/work-items.repository'

// ============================================
// Dashboard Hooks
// ============================================

export interface SLADashboardParams {
  entityType?: SLAEntityType
  startDate?: string
  endDate?: string
}

export function useSLADashboard(params: SLADashboardParams = {}) {
  return useQuery({
    queryKey: ['sla', 'dashboard', params],
    queryFn: () =>
      getSLADashboard({
        entity_type: params.entityType,
        start_date: params.startDate,
        end_date: params.endDate,
      }),
    staleTime: STALE_TIME.LIVE,
    refetchInterval: 60 * 1000,
  })
}

export function useSLAComplianceByType(params: SLADashboardParams = {}) {
  return useQuery({
    queryKey: ['sla', 'compliance', 'type', params],
    queryFn: () =>
      getSLAComplianceByType({
        entity_type: params.entityType,
        start_date: params.startDate,
        end_date: params.endDate,
      }),
    staleTime: STALE_TIME.LIVE,
  })
}

export interface SLAComplianceByAssigneeParams extends SLADashboardParams {
  limit?: number
}

export function useSLAComplianceByAssignee(params: SLAComplianceByAssigneeParams = {}) {
  return useQuery({
    queryKey: ['sla', 'compliance', 'assignee', params],
    queryFn: () =>
      getSLAComplianceByAssignee({
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit,
      }),
    staleTime: STALE_TIME.LIVE,
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

export function useSLAAtRiskItems(params: SLAAtRiskParams = {}) {
  return useQuery({
    queryKey: ['sla', 'at-risk', params],
    queryFn: () =>
      getSLAAtRiskItems({
        entity_type: params.entityType,
        threshold: params.threshold,
        limit: params.limit,
      }),
    staleTime: STALE_TIME.LIVE,
    refetchInterval: 30 * 1000,
  })
}

export function useSLABreachedItems() {
  return useQuery({
    queryKey: ['sla', 'breached'],
    queryFn: () => getSLABreachedItems(),
    staleTime: STALE_TIME.LIVE,
    refetchInterval: 30 * 1000,
  })
}

// ============================================
// Policy Management Hooks
// ============================================

export function useSLAPolicies() {
  return useQuery({
    queryKey: ['sla', 'policies'],
    queryFn: () => getSLAPolicies(),
    staleTime: STALE_TIME.STATIC,
  })
}

export function useSLAPolicy(policyId: string | undefined) {
  return useQuery({
    queryKey: ['sla', 'policies', policyId],
    queryFn: () => getSLAPolicy(policyId!),
    enabled: !!policyId,
    staleTime: STALE_TIME.STATIC,
  })
}

export function useCreateSLAPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SLAPolicyInput) => repoCreateSLAPolicy(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
    },
  })
}

export function useUpdateSLAPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: Partial<SLAPolicyInput> & { id: string }) =>
      repoUpdateSLAPolicy(id, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
      void queryClient.invalidateQueries({ queryKey: ['sla', 'policies', variables.id] })
    },
  })
}

export function useDeleteSLAPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (policyId: string) => repoDeleteSLAPolicy(policyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sla', 'policies'] })
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

export function useSLAEscalations(params: SLAEscalationsParams = {}) {
  return useQuery({
    queryKey: ['sla', 'escalations', params],
    queryFn: () =>
      getSLAEscalations({
        status: params.status,
        entity_type: params.entityType,
        limit: params.limit,
      }),
    staleTime: STALE_TIME.LIVE,
    refetchInterval: 30 * 1000,
  })
}

export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (escalationId: string) => acknowledgeSLAEscalation(escalationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
    },
  })
}

export function useResolveEscalation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ escalationId, notes }: { escalationId: string; notes?: string }) =>
      resolveSLAEscalation(escalationId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
    },
  })
}

// ============================================
// Manual Breach Check Hook
// ============================================

export function useCheckSLABreaches() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => checkSLABreaches(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sla'] })
    },
  })
}

// ============================================
// Realtime Subscription Hook
// ============================================

// CR-14: subscriptions are side-effects, not queries. Using useQuery's queryFn
// to create channels meant the cleanup never ran — every navigation leaked
// two Supabase channels into the realtime client's subscription map. Switched
// to useEffect with an explicit removeChannel cleanup so the channels are
// torn down when the consuming component unmounts.
export function useSLARealtimeUpdates(onUpdate?: () => void): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const eventsChannel = supabase
      .channel('sla-events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_events' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['sla', 'dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['sla', 'at-risk'] })
        void queryClient.invalidateQueries({ queryKey: ['sla', 'breached'] })
        onUpdate?.()
      })
      .subscribe()

    const escalationsChannel = supabase
      .channel('sla-escalations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_escalations' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
        onUpdate?.()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(eventsChannel)
      void supabase.removeChannel(escalationsChannel)
    }
  }, [queryClient, onUpdate])
}
