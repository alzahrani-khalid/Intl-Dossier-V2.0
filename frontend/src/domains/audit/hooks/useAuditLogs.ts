/**
 * Audit Logs Hook
 * @module domains/audit/hooks/useAuditLogs
 *
 * TanStack Query hooks for audit log viewing and management.
 * API calls delegated to audit.repository.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getAuditLogs as getAuditLogsApi,
  getAuditLogDetails,
  getAuditLogStats,
  exportAuditLogs as exportAuditLogsApi,
} from '../repositories/audit.repository'

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params?: Record<string, unknown>) => [...auditLogKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditLogKeys.all, 'detail', id] as const,
  stats: (params?: Record<string, unknown>) => [...auditLogKeys.all, 'stats', params] as const,
}

export function useAuditLogs(params?: {
  page?: number
  limit?: number
  action?: string
  entity_type?: string
  user_id?: string
  from?: string
  to?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.action) searchParams.set('action', params.action)
  if (params?.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params?.user_id) searchParams.set('user_id', params.user_id)
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)

  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogsApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useAuditLogDetail(logId: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: logId ? auditLogKeys.detail(logId) : ['audit-logs', 'disabled'],
    queryFn: () => (logId ? getAuditLogDetails(logId) : Promise.resolve(null)),
    enabled: Boolean(logId),
  })
}

export function useAuditLogStats(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: auditLogKeys.stats(params),
    queryFn: () => getAuditLogStats(searchParams),
    staleTime: 5 * 60 * 1000,
  })
}

export function useExportAuditLogs(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => exportAuditLogsApi(params),
  })
}

/* Stub hooks – removed during refactoring, still imported by components */

export function useAuditLogDistinctValues(field?: string): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...auditLogKeys.all, 'distinct-values', field],
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAuditLogStatistics(
  params?: Record<string, unknown>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...auditLogKeys.all, 'statistics', params],
    queryFn: () => Promise.resolve({}),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAuditLogExport(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ url: '', success: true }),
  })
}
