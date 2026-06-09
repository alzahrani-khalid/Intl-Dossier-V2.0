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

// Param names mirror the audit-logs-viewer edge contract exactly — the
// previous page/action/entity_type/from/to names were silently ignored
// and offset never moved, so pagination/filters were no-ops.
export function useAuditLogs(params?: {
  limit?: number
  offset?: number
  operation?: string
  table_name?: string
  user_id?: string
  user_email?: string
  date_from?: string
  date_to?: string
  ip_address?: string
  search?: string
  row_id?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  enabled?: boolean
}) {
  const searchParams = new URLSearchParams()
  const { enabled: _enabled, ...queryParams } = params ?? {}
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogsApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useAuditLogDetail(logId: string | null) {
  return useQuery({
    queryKey: logId ? auditLogKeys.detail(logId) : ['audit-logs', 'disabled'],
    queryFn: () => (logId ? getAuditLogDetails(logId) : Promise.resolve(null)),
    enabled: Boolean(logId),
  })
}

/* Stub hooks kept for components not yet wired */

export function useAuditLogDistinctValues(field?: string) {
  return useQuery({
    queryKey: [...auditLogKeys.all, 'distinct-values', field],
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Statistics for the audit viewer panel. Calls the edge /statistics route
 * (the component's expected { by_operation, by_table, total_events, period }
 * shape matches the edge response data exactly — it was previously a stub
 * resolving {}).
 */
export function useAuditLogStatistics(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams()
  if (params?.dateFrom !== undefined) searchParams.set('date_from', String(params.dateFrom))
  if (params?.dateTo !== undefined) searchParams.set('date_to', String(params.dateTo))

  return useQuery({
    queryKey: [...auditLogKeys.all, 'statistics', params],
    queryFn: async () => {
      const response = (await getAuditLogStats(searchParams)) as { data?: unknown } | undefined
      return response?.data ?? {}
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Export audit logs as a downloaded file. Streams the edge GET /export
 * response as a Blob and triggers a browser download (the previous stub
 * resolved a fake success without any network call).
 */
export function useAuditLogExport() {
  return useMutation({
    mutationFn: async ({
      format,
      filters,
    }: {
      format: 'csv' | 'json'
      filters?: Record<string, unknown>
    }) => {
      const searchParams = new URLSearchParams()
      searchParams.set('format', format)
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value))
        }
      })

      const blob = await exportAuditLogsApi(searchParams)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`
      anchor.click()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}
