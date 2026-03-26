/**
 * Report Builder Hook
 * @module domains/misc/hooks/useReportBuilder
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getReportTemplates,
  generateReport as generateReportApi,
  getReportStatus,
  getReportHistory as getReportHistoryApi,
} from '../repositories/misc.repository'

export const reportKeys = {
  all: ['report-builder'] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
  status: (id: string) => [...reportKeys.all, 'status', id] as const,
  history: (params?: Record<string, unknown>) => [...reportKeys.all, 'history', params] as const,
}

export function useReportTemplates(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: () => getReportTemplates(),
    staleTime: 30 * 60 * 1000,
  })
}

export function useGenerateReport(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => generateReportApi(data),
  })
}

export function useReportStatus(reportId: string | null, options?: {
  enabled?: boolean
  refetchInterval?: number
}): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: reportId ? reportKeys.status(reportId) : ['report-builder', 'disabled'],
    queryFn: () => (reportId ? getReportStatus(reportId) : Promise.resolve(null)),
    enabled: options?.enabled !== false && Boolean(reportId),
    refetchInterval: options?.refetchInterval ?? 3000,
  })
}

export function useReportHistory(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: reportKeys.history(params),
    queryFn: () => getReportHistoryApi(searchParams),
    staleTime: 60 * 1000,
  })
}
