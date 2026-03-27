/**
 * Report Builder Hook
 * @module domains/misc/hooks/useReportBuilder
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useReportStatus(
  reportId: string | null,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  },
): ReturnType<typeof useQuery> {
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

/* Stub hooks – removed during refactoring, still imported by components */

export function useReportBuilderState(
  params?: Record<string, unknown>,
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...reportKeys.all, 'builder-state', params],
    queryFn: () => Promise.resolve({ fields: [], filters: [], sorting: [] }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useReports(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...reportKeys.all, 'reports', params],
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateReport(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ id: '', success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useUpdateReport(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useDeleteReport(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_id: string) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useReportToggleFavorite(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_params: { reportId: string }) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useReportPreview(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...reportKeys.all, 'preview', params],
    queryFn: () => Promise.resolve(null),
    staleTime: 60 * 1000,
  })
}

export function useCreateSchedule(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ id: '', success: true }),
  })
}
