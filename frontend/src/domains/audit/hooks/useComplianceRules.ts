/**
 * Compliance Rules Hook
 * @module domains/audit/hooks/useComplianceRules
 *
 * TanStack Query hooks for compliance rule management.
 * API calls delegated to audit.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getComplianceRules as getComplianceRulesApi,
  getComplianceRule,
  createComplianceRule as createComplianceRuleApi,
  updateComplianceRule as updateComplianceRuleApi,
  deleteComplianceRule as deleteComplianceRuleApi,
  runComplianceCheck as runComplianceCheckApi,
} from '../repositories/audit.repository'

export const complianceKeys = {
  all: ['compliance'] as const,
  list: (params?: Record<string, unknown>) => [...complianceKeys.all, 'list', params] as const,
  detail: (id: string) => [...complianceKeys.all, 'detail', id] as const,
  check: (params?: Record<string, unknown>) => [...complianceKeys.all, 'check', params] as const,
}

export function useComplianceRules(params?: {
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: complianceKeys.list(),
    queryFn: () => getComplianceRulesApi(),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useComplianceRule(id: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: id ? complianceKeys.detail(id) : ['compliance', 'disabled'],
    queryFn: () => (id ? getComplianceRule(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  })
}

export function useCreateComplianceRule(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createComplianceRuleApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complianceKeys.all })
    },
  })
}

export function useUpdateComplianceRule(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateComplianceRuleApi(params.id, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complianceKeys.all })
    },
  })
}

export function useDeleteComplianceRule(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteComplianceRuleApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complianceKeys.all })
    },
  })
}

export function useRunComplianceCheck(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => runComplianceCheckApi(data),
  })
}
