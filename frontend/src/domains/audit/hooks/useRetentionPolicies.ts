/**
 * Retention Policies Hook
 * @module domains/audit/hooks/useRetentionPolicies
 *
 * TanStack Query hooks for data retention policy management.
 * API calls delegated to audit.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRetentionPolicies as getRetentionPoliciesApi,
  getRetentionPolicy,
  createRetentionPolicy as createRetentionPolicyApi,
  updateRetentionPolicy as updateRetentionPolicyApi,
  deleteRetentionPolicy as deleteRetentionPolicyApi,
  getLegalHolds as getLegalHoldsApi,
  getLegalHold,
  createLegalHold as createLegalHoldApi,
  updateLegalHold as updateLegalHoldApi,
  releaseLegalHold as releaseLegalHoldApi,
  deleteLegalHold as deleteLegalHoldApi,
  getRetentionStatistics,
  getPendingActions as getPendingActionsApi,
  getExpiringRecords as getExpiringRecordsApi,
  getExecutionLog,
  runRetentionProcessor as runRetentionProcessorApi,
  applyRetentionPolicy as applyRetentionPolicyApi,
  createManualHold as createManualHoldApi,
} from '../repositories/audit.repository'
import type {
  RetentionPolicy,
  LegalHold,
  RetentionStatistics,
  PendingRetentionAction,
  ExpiringEntity,
  RetentionExecutionLog,
} from '@/types/retention-policy.types'

/**
 * Unwrap the `{ data: [...] }` envelope every `/data-retention/*` list endpoint answers.
 *
 * Validate-or-throw, never coerce. A body carrying no array under `data` is a broken response, and
 * the honest render for it is the region's error state — coercing to `[]` would print "No policies"
 * over rows the server did send (RETENTION-CAST-01). The six list queryFns below all route through
 * this one guard, so the lie cannot come back one hook at a time.
 */
function unwrapListEnvelope<T>(body: unknown): T[] {
  const data = (body as { data?: unknown } | null | undefined)?.data
  if (!Array.isArray(data)) throw new Error('malformed retention envelope')
  return data as T[]
}

export const retentionKeys = {
  all: ['retention'] as const,
  policies: () => [...retentionKeys.all, 'policies'] as const,
  policyList: (params?: Record<string, unknown>) =>
    [...retentionKeys.policies(), 'list', params] as const,
  policy: (id: string) => [...retentionKeys.policies(), 'detail', id] as const,
  legalHolds: () => [...retentionKeys.all, 'legal-holds'] as const,
  legalHoldList: (params?: Record<string, unknown>) =>
    [...retentionKeys.legalHolds(), 'list', params] as const,
  legalHold: (id: string) => [...retentionKeys.legalHolds(), 'detail', id] as const,
  statistics: () => [...retentionKeys.all, 'statistics'] as const,
  pendingActions: (params?: Record<string, unknown>) =>
    [...retentionKeys.all, 'pending', params] as const,
  expiring: (params?: Record<string, unknown>) =>
    [...retentionKeys.all, 'expiring', params] as const,
  executionLog: () => [...retentionKeys.all, 'execution-log'] as const,
}

// ============================================================================
// Policy Hooks
// ============================================================================

export function useRetentionPolicies(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery<RetentionPolicy[]>({
    queryKey: retentionKeys.policyList(params),
    queryFn: async () =>
      unwrapListEnvelope<RetentionPolicy>(await getRetentionPoliciesApi(searchParams)),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRetentionPolicy(id: string | null) {
  return useQuery({
    queryKey: id ? retentionKeys.policy(id) : ['retention', 'disabled'],
    queryFn: () => (id ? getRetentionPolicy(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreateRetentionPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createRetentionPolicyApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.policies() })
    },
  })
}

export function useUpdateRetentionPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateRetentionPolicyApi(params.id, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.policies() })
    },
  })
}

export function useDeleteRetentionPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRetentionPolicyApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.policies() })
    },
  })
}

// ============================================================================
// Legal Hold Hooks
// ============================================================================

export function useLegalHolds(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery<LegalHold[]>({
    queryKey: retentionKeys.legalHoldList(params),
    queryFn: async () => unwrapListEnvelope<LegalHold>(await getLegalHoldsApi(searchParams)),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLegalHold(id: string | null) {
  return useQuery({
    queryKey: id ? retentionKeys.legalHold(id) : ['retention', 'legal-hold', 'disabled'],
    queryFn: () => (id ? getLegalHold(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreateLegalHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createLegalHoldApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.legalHolds() })
    },
  })
}

export function useUpdateLegalHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateLegalHoldApi(params.id, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.legalHolds() })
    },
  })
}

export function useReleaseLegalHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => releaseLegalHoldApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.legalHolds() })
    },
  })
}

export function useDeleteLegalHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLegalHoldApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.legalHolds() })
    },
  })
}

// ============================================================================
// Statistics & Execution Hooks
// ============================================================================

export function useRetentionStatistics() {
  return useQuery<RetentionStatistics[]>({
    queryKey: retentionKeys.statistics(),
    queryFn: async () => unwrapListEnvelope<RetentionStatistics>(await getRetentionStatistics()),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePendingActions(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery<PendingRetentionAction[]>({
    queryKey: retentionKeys.pendingActions(params),
    queryFn: async () =>
      unwrapListEnvelope<PendingRetentionAction>(await getPendingActionsApi(searchParams)),
    staleTime: 60 * 1000,
  })
}

export function useExpiringRecords(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery<ExpiringEntity[]>({
    queryKey: retentionKeys.expiring(params),
    queryFn: async () =>
      unwrapListEnvelope<ExpiringEntity>(await getExpiringRecordsApi(searchParams)),
    staleTime: 60 * 1000,
  })
}

export function useExecutionLog() {
  return useQuery<RetentionExecutionLog[]>({
    queryKey: retentionKeys.executionLog(),
    queryFn: async () => unwrapListEnvelope<RetentionExecutionLog>(await getExecutionLog()),
    staleTime: 30 * 1000,
  })
}

export function useRunRetentionProcessor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => runRetentionProcessorApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.all })
    },
  })
}

export function useApplyRetentionPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => applyRetentionPolicyApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.all })
    },
  })
}

export function useCreateManualHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createManualHoldApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: retentionKeys.legalHolds() })
    },
  })
}
