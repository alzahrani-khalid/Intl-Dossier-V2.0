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

export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: () => getReportTemplates(),
    staleTime: 30 * 60 * 1000,
  })
}

export function useGenerateReport() {
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
) {
  return useQuery({
    queryKey: reportId ? reportKeys.status(reportId) : ['report-builder', 'disabled'],
    queryFn: () => (reportId ? getReportStatus(reportId) : Promise.resolve(null)),
    enabled: options?.enabled !== false && Boolean(reportId),
    refetchInterval: options?.refetchInterval ?? 3000,
  })
}

export function useReportHistory(params?: Record<string, unknown>) {
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

import { useState } from 'react'
import type {
  ReportColumn,
  ReportConfiguration,
  ReportEntityType,
  ReportField,
  ReportFilter,
  ReportAggregation,
  ReportPreviewResponse,
  SavedReport,
  VisualizationConfig,
  VisualizationType,
} from '@/types/report-builder.types'

export interface ReportBuilderState {
  configuration: ReportConfiguration
  selectedEntities: ReportEntityType[]
  availableFields: ReportField[]
  isDirty: boolean
  savedReportId: string | undefined
  toggleEntity: (entity: ReportEntityType) => void
  addColumn: (field: ReportField) => void
  removeColumn: (id: string) => void
  updateColumn: (id: string, updates: Partial<ReportColumn>) => void
  reorderColumns: (sourceIndex: number, destinationIndex: number) => void
  addFilter: (filter: Omit<ReportFilter, 'id'>) => void
  removeFilter: (id: string) => void
  updateFilter: (id: string, updates: Partial<ReportFilter>) => void
  setFilterLogic: (logic: 'and' | 'or') => void
  addGrouping: (field: ReportField) => void
  removeGrouping: (id: string) => void
  addAggregation: (aggregation: Omit<ReportAggregation, 'id'>) => void
  removeAggregation: (id: string) => void
  addSort: (fieldId: string, direction: 'asc' | 'desc') => void
  removeSort: (id: string) => void
  updateSort: (sortId: string, direction: 'asc' | 'desc') => void
  setVisualization: (type: VisualizationType) => void
  updateVisualization: (updates: Partial<VisualizationConfig>) => void
  resetConfiguration: () => void
  loadConfiguration: (report: SavedReport) => void
  markAsSaved: (id: string) => void
}

const EMPTY_CONFIGURATION: ReportConfiguration = {
  entities: [],
  columns: [],
  filters: [],
  filter_logic: 'and',
  groupings: [],
  aggregations: [],
  sort_order: [],
  visualization: { type: 'table', config: {} },
} as unknown as ReportConfiguration

export function useReportBuilderState(_params?: { initialReportId?: string }): ReportBuilderState {
  const [configuration] = useState<ReportConfiguration>(EMPTY_CONFIGURATION)
  return {
    configuration,
    selectedEntities: [],
    availableFields: [],
    isDirty: false,
    savedReportId: undefined,
    toggleEntity: () => {},
    addColumn: () => {},
    removeColumn: () => {},
    updateColumn: () => {},
    reorderColumns: () => {},
    addFilter: () => {},
    removeFilter: () => {},
    updateFilter: () => {},
    setFilterLogic: () => {},
    addGrouping: () => {},
    removeGrouping: () => {},
    addAggregation: () => {},
    removeAggregation: () => {},
    addSort: () => {},
    removeSort: () => {},
    updateSort: () => {},
    setVisualization: () => {},
    updateVisualization: () => {},
    resetConfiguration: () => {},
    loadConfiguration: () => {},
    markAsSaved: () => {},
  }
}

export interface ReportsListResult {
  data: SavedReport[]
}

export function useReports(_params?: Record<string, unknown>) {
  return useQuery<ReportsListResult>({
    queryKey: [...reportKeys.all, 'reports', _params],
    queryFn: () => Promise.resolve<ReportsListResult>({ data: [] }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ id: '' } as { id: string }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_id: string) => Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useReportToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_params: { reportId: string; isFavorite: boolean }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

export function useReportPreview(_params?: Record<string, unknown>) {
  return useMutation<
    ReportPreviewResponse,
    { message: string },
    { configuration: ReportConfiguration; limit: number }
  >({
    mutationFn: (_args) => Promise.resolve<ReportPreviewResponse>({} as ReportPreviewResponse),
  })
}

export function useCreateSchedule() {
  return useMutation({
    mutationFn: (_data: Record<string, unknown>) => Promise.resolve({ id: '' } as { id: string }),
  })
}
