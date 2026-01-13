/**
 * Custom Report Builder Hook
 *
 * Provides state management and API integration for the report builder feature.
 * Includes support for:
 * - Report configuration management
 * - CRUD operations for saved reports
 * - Report preview and execution
 * - Schedule management
 * - Sharing functionality
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  ReportConfiguration,
  SavedReport,
  ReportSchedule,
  ReportPreviewResponse,
  ReportEntityType,
  ReportField,
  ReportColumn,
  ReportFilter,
  ReportGrouping,
  ReportAggregation,
  ReportSort,
  FilterGroup,
  VisualizationType,
  ReportAccessLevel,
  ListReportsParams,
  ListReportsResponse,
  CreateReportRequest,
  UpdateReportRequest,
  CreateScheduleRequest,
  ENTITY_FIELDS,
  createEmptyReportConfiguration,
  createEmptyFilterGroup,
} from '@/types/report-builder.types'

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// API Helper Functions
// ============================================================================

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message?.en || 'Request failed')
  }

  return response.json()
}

// ============================================================================
// Query Keys
// ============================================================================

export const reportBuilderKeys = {
  all: ['reports'] as const,
  lists: () => [...reportBuilderKeys.all, 'list'] as const,
  list: (params: ListReportsParams) => [...reportBuilderKeys.lists(), params] as const,
  details: () => [...reportBuilderKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportBuilderKeys.details(), id] as const,
  schedules: (reportId: string) => [...reportBuilderKeys.all, 'schedules', reportId] as const,
  schedule: (reportId: string, scheduleId: string) =>
    [...reportBuilderKeys.schedules(reportId), scheduleId] as const,
  preview: () => [...reportBuilderKeys.all, 'preview'] as const,
}

// ============================================================================
// Report List Hook
// ============================================================================

export function useReports(params: ListReportsParams = {}) {
  return useQuery({
    queryKey: reportBuilderKeys.list(params),
    queryFn: async (): Promise<ListReportsResponse> => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.search) searchParams.set('search', params.search)
      if (params.accessLevel) searchParams.set('accessLevel', params.accessLevel)
      if (params.tags?.length) searchParams.set('tags', params.tags.join(','))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

      return apiRequest(`/custom-reports?${searchParams.toString()}`)
    },
    staleTime: 30_000,
  })
}

// ============================================================================
// Single Report Hook
// ============================================================================

export function useReport(reportId: string | undefined) {
  return useQuery({
    queryKey: reportBuilderKeys.detail(reportId!),
    queryFn: async (): Promise<SavedReport> => {
      return apiRequest(`/custom-reports/${reportId}`)
    },
    enabled: !!reportId,
    staleTime: 60_000,
  })
}

// ============================================================================
// Report Mutations
// ============================================================================

export function useCreateReport() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async (data: CreateReportRequest): Promise<SavedReport> => {
      return apiRequest('/custom-reports', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.lists() })
      queryClient.setQueryData(reportBuilderKeys.detail(data.id), data)
      toast.success(t('save.success'))
    },
    onError: (error) => {
      toast.error(t('save.error'))
      console.error('Create report error:', error)
    },
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async (data: UpdateReportRequest): Promise<SavedReport> => {
      return apiRequest(`/custom-reports/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.lists() })
      queryClient.setQueryData(reportBuilderKeys.detail(data.id), data)
      toast.success(t('save.success'))
    },
    onError: (error) => {
      toast.error(t('save.error'))
      console.error('Update report error:', error)
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async (reportId: string): Promise<void> => {
      await apiRequest(`/custom-reports/${reportId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.lists() })
      queryClient.removeQueries({ queryKey: reportBuilderKeys.detail(reportId) })
      toast.success(t('savedReports.confirmDelete.title'))
    },
    onError: (error) => {
      toast.error(t('errors.saveFailed'))
      console.error('Delete report error:', error)
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reportId,
      isFavorite,
    }: {
      reportId: string
      isFavorite: boolean
    }): Promise<SavedReport> => {
      return apiRequest(`/custom-reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite }),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.lists() })
      queryClient.setQueryData(reportBuilderKeys.detail(data.id), data)
    },
  })
}

// ============================================================================
// Report Preview Hook
// ============================================================================

export function useReportPreview() {
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async ({
      configuration,
      limit = 100,
    }: {
      configuration: ReportConfiguration
      limit?: number
    }): Promise<ReportPreviewResponse> => {
      return apiRequest('/custom-reports/preview', {
        method: 'POST',
        body: JSON.stringify({ configuration, limit }),
      })
    },
    onError: (error) => {
      toast.error(t('preview.error'))
      console.error('Preview error:', error)
    },
  })
}

// ============================================================================
// Report Execution Hook
// ============================================================================

export function useExecuteReport() {
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest(`/custom-reports/${reportId}/execute`, {
        method: 'POST',
      })
    },
    onError: (error) => {
      toast.error(t('errors.executeFailed'))
      console.error('Execute error:', error)
    },
  })
}

// ============================================================================
// Schedule Hooks
// ============================================================================

export function useReportSchedules(reportId: string | undefined) {
  return useQuery({
    queryKey: reportBuilderKeys.schedules(reportId!),
    queryFn: async (): Promise<ReportSchedule[]> => {
      return apiRequest(`/custom-reports/${reportId}/schedules`)
    },
    enabled: !!reportId,
    staleTime: 60_000,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('report-builder')

  return useMutation({
    mutationFn: async (data: CreateScheduleRequest): Promise<ReportSchedule> => {
      return apiRequest(`/custom-reports/${data.reportId}/schedules`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.schedules(data.reportId) })
      toast.success(t('schedule.success'))
    },
    onError: (error) => {
      toast.error(t('schedule.error'))
      console.error('Create schedule error:', error)
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reportId,
      scheduleId,
      ...data
    }: {
      reportId: string
      scheduleId: string
    } & Partial<CreateScheduleRequest>): Promise<ReportSchedule> => {
      return apiRequest(`/custom-reports/${reportId}/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.schedules(data.reportId) })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reportId,
      scheduleId,
    }: {
      reportId: string
      scheduleId: string
    }): Promise<void> => {
      await apiRequest(`/custom-reports/${reportId}/schedules/${scheduleId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: reportBuilderKeys.schedules(reportId) })
    },
  })
}

// ============================================================================
// Report Builder State Hook
// ============================================================================

export interface ReportBuilderState {
  configuration: ReportConfiguration
  selectedEntities: ReportEntityType[]
  isDirty: boolean
  savedReportId: string | null
}

export function useReportBuilderState(initialReportId?: string) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  // Load existing report if ID provided
  const { data: savedReport } = useReport(initialReportId)

  // Initialize state
  const [state, setState] = useState<ReportBuilderState>(() => ({
    configuration: savedReport?.configuration || createEmptyReportConfiguration(),
    selectedEntities: savedReport?.configuration?.entities || [],
    isDirty: false,
    savedReportId: initialReportId || null,
  }))

  // Update state when saved report loads
  useMemo(() => {
    if (savedReport && !state.isDirty) {
      setState((prev) => ({
        ...prev,
        configuration: savedReport.configuration,
        selectedEntities: savedReport.configuration.entities,
        savedReportId: savedReport.id,
      }))
    }
  }, [savedReport])

  // Entity selection
  const toggleEntity = useCallback((entity: ReportEntityType) => {
    setState((prev) => {
      const isSelected = prev.selectedEntities.includes(entity)
      const newEntities = isSelected
        ? prev.selectedEntities.filter((e) => e !== entity)
        : [...prev.selectedEntities, entity]

      return {
        ...prev,
        selectedEntities: newEntities,
        configuration: {
          ...prev.configuration,
          entities: newEntities,
        },
        isDirty: true,
      }
    })
  }, [])

  // Get available fields based on selected entities
  const availableFields = useMemo(() => {
    const fields: ReportField[] = []
    for (const entity of state.selectedEntities) {
      const entityFields = ENTITY_FIELDS[entity] || []
      fields.push(...entityFields)
    }
    return fields
  }, [state.selectedEntities])

  // Column management
  const addColumn = useCallback((field: ReportField) => {
    setState((prev) => {
      const newColumn: ReportColumn = {
        id: crypto.randomUUID(),
        fieldId: field.id,
        label: field.name,
        labelAr: field.nameAr,
        visible: true,
        order: prev.configuration.columns.length,
      }

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          columns: [...prev.configuration.columns, newColumn],
        },
        isDirty: true,
      }
    })
  }, [])

  const removeColumn = useCallback((columnId: string) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        columns: prev.configuration.columns.filter((c) => c.id !== columnId),
      },
      isDirty: true,
    }))
  }, [])

  const updateColumn = useCallback((columnId: string, updates: Partial<ReportColumn>) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        columns: prev.configuration.columns.map((c) =>
          c.id === columnId ? { ...c, ...updates } : c,
        ),
      },
      isDirty: true,
    }))
  }, [])

  const reorderColumns = useCallback((sourceIndex: number, destinationIndex: number) => {
    setState((prev) => {
      const columns = [...prev.configuration.columns]
      const [removed] = columns.splice(sourceIndex, 1)
      columns.splice(destinationIndex, 0, removed)

      // Update order property
      const reorderedColumns = columns.map((col, index) => ({
        ...col,
        order: index,
      }))

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          columns: reorderedColumns,
        },
        isDirty: true,
      }
    })
  }, [])

  // Filter management
  const addFilter = useCallback((filter: Omit<ReportFilter, 'id'>) => {
    setState((prev) => {
      const newFilter: ReportFilter = {
        ...filter,
        id: crypto.randomUUID(),
      }

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          filters: {
            ...prev.configuration.filters,
            filters: [...prev.configuration.filters.filters, newFilter],
          },
        },
        isDirty: true,
      }
    })
  }, [])

  const removeFilter = useCallback((filterId: string) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        filters: {
          ...prev.configuration.filters,
          filters: prev.configuration.filters.filters.filter((f) => f.id !== filterId),
        },
      },
      isDirty: true,
    }))
  }, [])

  const updateFilter = useCallback((filterId: string, updates: Partial<ReportFilter>) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        filters: {
          ...prev.configuration.filters,
          filters: prev.configuration.filters.filters.map((f) =>
            f.id === filterId ? { ...f, ...updates } : f,
          ),
        },
      },
      isDirty: true,
    }))
  }, [])

  const setFilterLogic = useCallback((logic: 'and' | 'or') => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        filters: {
          ...prev.configuration.filters,
          logic,
        },
      },
      isDirty: true,
    }))
  }, [])

  // Grouping management
  const addGrouping = useCallback((field: ReportField) => {
    setState((prev) => {
      // Check if already grouped by this field
      if (prev.configuration.groupings.some((g) => g.fieldId === field.id)) {
        return prev
      }

      const newGrouping: ReportGrouping = {
        id: crypto.randomUUID(),
        fieldId: field.id,
        label: field.name,
        labelAr: field.nameAr,
      }

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          groupings: [...prev.configuration.groupings, newGrouping],
        },
        isDirty: true,
      }
    })
  }, [])

  const removeGrouping = useCallback((groupingId: string) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        groupings: prev.configuration.groupings.filter((g) => g.id !== groupingId),
      },
      isDirty: true,
    }))
  }, [])

  // Aggregation management
  const addAggregation = useCallback((aggregation: Omit<ReportAggregation, 'id'>) => {
    setState((prev) => {
      const newAgg: ReportAggregation = {
        ...aggregation,
        id: crypto.randomUUID(),
      }

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          aggregations: [...prev.configuration.aggregations, newAgg],
        },
        isDirty: true,
      }
    })
  }, [])

  const removeAggregation = useCallback((aggId: string) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        aggregations: prev.configuration.aggregations.filter((a) => a.id !== aggId),
      },
      isDirty: true,
    }))
  }, [])

  // Sorting management
  const addSort = useCallback((fieldId: string, direction: 'asc' | 'desc' = 'asc') => {
    setState((prev) => {
      const newSort: ReportSort = {
        id: crypto.randomUUID(),
        fieldId,
        direction,
      }

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          sorting: [...prev.configuration.sorting, newSort],
        },
        isDirty: true,
      }
    })
  }, [])

  const removeSort = useCallback((sortId: string) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        sorting: prev.configuration.sorting.filter((s) => s.id !== sortId),
      },
      isDirty: true,
    }))
  }, [])

  const updateSort = useCallback((sortId: string, direction: 'asc' | 'desc') => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        sorting: prev.configuration.sorting.map((s) => (s.id === sortId ? { ...s, direction } : s)),
      },
      isDirty: true,
    }))
  }, [])

  // Visualization management
  const setVisualization = useCallback((type: VisualizationType) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        visualization: {
          ...prev.configuration.visualization,
          type,
        },
      },
      isDirty: true,
    }))
  }, [])

  const updateVisualization = useCallback(
    (updates: Partial<ReportConfiguration['visualization']>) => {
      setState((prev) => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          visualization: {
            ...prev.configuration.visualization,
            ...updates,
          },
        },
        isDirty: true,
      }))
    },
    [],
  )

  // Reset configuration
  const resetConfiguration = useCallback(() => {
    setState({
      configuration: createEmptyReportConfiguration(),
      selectedEntities: [],
      isDirty: false,
      savedReportId: null,
    })
  }, [])

  // Load configuration from saved report
  const loadConfiguration = useCallback((report: SavedReport) => {
    setState({
      configuration: report.configuration,
      selectedEntities: report.configuration.entities,
      isDirty: false,
      savedReportId: report.id,
    })
  }, [])

  // Set limit
  const setLimit = useCallback((limit: number | undefined) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        limit,
      },
      isDirty: true,
    }))
  }, [])

  // Mark as saved
  const markAsSaved = useCallback((reportId: string) => {
    setState((prev) => ({
      ...prev,
      isDirty: false,
      savedReportId: reportId,
    }))
  }, [])

  return {
    // State
    configuration: state.configuration,
    selectedEntities: state.selectedEntities,
    availableFields,
    isDirty: state.isDirty,
    savedReportId: state.savedReportId,
    isRTL,

    // Entity management
    toggleEntity,

    // Column management
    addColumn,
    removeColumn,
    updateColumn,
    reorderColumns,

    // Filter management
    addFilter,
    removeFilter,
    updateFilter,
    setFilterLogic,

    // Grouping management
    addGrouping,
    removeGrouping,

    // Aggregation management
    addAggregation,
    removeAggregation,

    // Sorting management
    addSort,
    removeSort,
    updateSort,

    // Visualization management
    setVisualization,
    updateVisualization,

    // Other
    setLimit,
    resetConfiguration,
    loadConfiguration,
    markAsSaved,
  }
}

// ============================================================================
// Export all hooks
// ============================================================================

export {
  type ReportConfiguration,
  type SavedReport,
  type ReportSchedule,
  type ReportPreviewResponse,
  type ReportEntityType,
  type ReportField,
  type ReportColumn,
  type ReportFilter,
  type ReportGrouping,
  type ReportAggregation,
  type ReportSort,
  type VisualizationType,
  type ReportAccessLevel,
}
