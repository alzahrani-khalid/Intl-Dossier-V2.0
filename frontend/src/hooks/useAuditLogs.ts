/**
 * Audit Logs Hooks
 *
 * TanStack Query hooks for:
 * - Fetching audit logs with filters and pagination
 * - Getting single audit log details
 * - Fetching audit statistics
 * - Exporting audit logs
 * - Getting distinct filter values
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AuditLogEntry,
  AuditLogDetail,
  AuditLogRelated,
  AuditLogFilters,
  AuditLogPagination,
  AuditLogMetadata,
  AuditLogStatistics,
  ExportOptions,
  UseAuditLogsReturn,
  UseAuditLogDetailReturn,
  UseAuditLogStatisticsReturn,
  UseAuditLogExportReturn,
} from '@/types/audit-log.types'

// API Base URL
const getApiUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/functions/v1/audit-logs-viewer`
}

// =============================================
// AUDIT LOGS LIST HOOK
// =============================================

export function useAuditLogs(initialFilters?: AuditLogFilters): UseAuditLogsReturn {
  const [filters, setFiltersState] = useState<AuditLogFilters>(initialFilters || {})
  const [pagination, setPaginationState] = useState<AuditLogPagination>({
    limit: 50,
    offset: 0,
  })

  const queryKey = ['audit-logs', filters, pagination]

  const { data, isLoading, isFetching, error, refetch } = useQuery<
    { data: AuditLogEntry[]; metadata: AuditLogMetadata },
    Error
  >({
    queryKey,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Build query params
      const params = new URLSearchParams()

      params.set('limit', pagination.limit.toString())
      params.set('offset', pagination.offset.toString())

      if (filters.table_name) params.set('table_name', filters.table_name)
      if (filters.user_id) params.set('user_id', filters.user_id)
      if (filters.user_email) params.set('user_email', filters.user_email)
      if (filters.operation) params.set('operation', filters.operation)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.ip_address) params.set('ip_address', filters.ip_address)
      if (filters.search) params.set('search', filters.search)
      if (filters.row_id) params.set('row_id', filters.row_id)
      if (filters.sort_by) params.set('sort_by', filters.sort_by)
      if (filters.sort_order) params.set('sort_order', filters.sort_order)

      const response = await fetch(`${getApiUrl()}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch audit logs')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  })

  const setFilters = useCallback((newFilters: AuditLogFilters) => {
    setFiltersState(newFilters)
    // Reset pagination when filters change
    setPaginationState((prev) => ({ ...prev, offset: 0 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
    setPaginationState((prev) => ({ ...prev, offset: 0 }))
  }, [])

  const setPagination = useCallback((newPagination: AuditLogPagination) => {
    setPaginationState(newPagination)
  }, [])

  const nextPage = useCallback(() => {
    setPaginationState((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }))
  }, [])

  const prevPage = useCallback(() => {
    setPaginationState((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }, [])

  return {
    logs: data?.data || [],
    isLoading,
    isFetchingNextPage: isFetching && !isLoading,
    error: error || null,
    total: data?.metadata?.total || 0,
    hasMore: data?.metadata?.has_more || false,
    filters,
    pagination,
    setFilters,
    clearFilters,
    setPagination,
    nextPage,
    prevPage,
    refetch,
  }
}

// =============================================
// AUDIT LOG DETAIL HOOK
// =============================================

export function useAuditLogDetail(logId: string | null): UseAuditLogDetailReturn {
  const { data, isLoading, error } = useQuery<
    { data: { log: AuditLogDetail; related_logs: AuditLogRelated[] } },
    Error
  >({
    queryKey: ['audit-log', logId],
    queryFn: async () => {
      if (!logId) throw new Error('Log ID is required')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/${logId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch audit log')
      }

      return response.json()
    },
    enabled: !!logId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    log: data?.data?.log || null,
    relatedLogs: data?.data?.related_logs || [],
    isLoading,
    error: error || null,
  }
}

// =============================================
// AUDIT LOG STATISTICS HOOK
// =============================================

export function useAuditLogStatistics(
  dateFrom?: string,
  dateTo?: string,
): UseAuditLogStatisticsReturn {
  const { data, isLoading, error, refetch } = useQuery<{ data: AuditLogStatistics }, Error>({
    queryKey: ['audit-log-statistics', dateFrom, dateTo],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const response = await fetch(`${getApiUrl()}/statistics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch statistics')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    statistics: data?.data || null,
    isLoading,
    error: error || null,
    refetch,
  }
}

// =============================================
// AUDIT LOG EXPORT HOOK
// =============================================

export function useAuditLogExport(): UseAuditLogExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportLogs = useCallback(async (options: ExportOptions) => {
    setIsExporting(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      params.set('format', options.format)

      if (options.filters) {
        const { filters } = options
        if (filters.table_name) params.set('table_name', filters.table_name)
        if (filters.user_id) params.set('user_id', filters.user_id)
        if (filters.user_email) params.set('user_email', filters.user_email)
        if (filters.operation) params.set('operation', filters.operation)
        if (filters.date_from) params.set('date_from', filters.date_from)
        if (filters.date_to) params.set('date_to', filters.date_to)
        if (filters.ip_address) params.set('ip_address', filters.ip_address)
        if (filters.search) params.set('search', filters.search)
      }

      const response = await fetch(`${getApiUrl()}/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export audit logs')
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${options.format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'))
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportLogs,
    isExporting,
    error,
  }
}

// =============================================
// DISTINCT VALUES HOOK (for filter dropdowns)
// =============================================

export function useAuditLogDistinctValues(field: 'table_name' | 'operation' | 'user_role') {
  const { data, isLoading, error } = useQuery<{ data: string[] }, Error>({
    queryKey: ['audit-log-distinct', field],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/distinct/${field}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch distinct values')
      }

      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    values: data?.data || [],
    isLoading,
    error: error || null,
  }
}
