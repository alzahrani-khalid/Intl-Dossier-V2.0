/**
 * useWidgetDashboard Hook
 *
 * Manages the state and persistence of the customizable dashboard.
 * Handles widget configuration, layout, and data fetching.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import type {
  WidgetConfig,
  WidgetType,
  KpiData,
  ChartData,
  EventData,
  NotificationData,
} from '@/types/dashboard-widget.types'
import { WIDGET_REGISTRY } from '@/components/dashboard-widgets/WidgetLibrary'

// ============================================================================
// Query Keys
// ============================================================================

export const widgetDashboardKeys = {
  all: ['widget-dashboard'] as const,
  layout: () => [...widgetDashboardKeys.all, 'layout'] as const,
  widgetData: (widgetId: string) => [...widgetDashboardKeys.all, 'data', widgetId] as const,
}

// ============================================================================
// Local Storage Keys
// ============================================================================

const STORAGE_KEY = 'dashboard-widget-layout'

// ============================================================================
// Default Widgets
// ============================================================================

const createDefaultWidgets = (t: (key: string) => string): WidgetConfig[] => [
  {
    id: uuidv4(),
    type: 'kpi-card',
    title: t('metrics.active-dossiers'),
    size: 'small',
    refreshInterval: 300000,
    isVisible: true,
    order: 0,
    settings: {
      metric: 'active-dossiers',
      showTrend: true,
      showSparkline: false,
      comparisonPeriod: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'kpi-card',
    title: t('metrics.pending-tasks'),
    size: 'small',
    refreshInterval: 300000,
    isVisible: true,
    order: 1,
    settings: {
      metric: 'pending-tasks',
      showTrend: true,
      showSparkline: false,
      comparisonPeriod: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'kpi-card',
    title: t('metrics.overdue-items'),
    size: 'small',
    refreshInterval: 300000,
    isVisible: true,
    order: 2,
    settings: {
      metric: 'overdue-items',
      showTrend: true,
      showSparkline: false,
      comparisonPeriod: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'kpi-card',
    title: t('metrics.completed-this-week'),
    size: 'small',
    refreshInterval: 300000,
    isVisible: true,
    order: 3,
    settings: {
      metric: 'completed-this-week',
      showTrend: true,
      showSparkline: false,
      comparisonPeriod: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'chart',
    title: t('dataSources.work-items-by-status'),
    size: 'medium',
    refreshInterval: 300000,
    isVisible: true,
    order: 4,
    settings: {
      chartType: 'bar',
      dataSource: 'work-items-by-status',
      showLegend: true,
      showGrid: true,
      dateRange: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'upcoming-events',
    title: t('widgetTypes.upcoming-events.name'),
    size: 'medium',
    refreshInterval: 300000,
    isVisible: true,
    order: 5,
    settings: {
      maxItems: 5,
      showPastEvents: false,
      eventTypes: ['all'],
      dateRange: 'week',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'task-list',
    title: t('widgetTypes.task-list.name'),
    size: 'medium',
    refreshInterval: 300000,
    isVisible: true,
    order: 6,
    settings: {
      maxItems: 10,
      showCompleted: false,
      groupBy: 'none',
      sortBy: 'deadline',
      filterSource: 'all',
    },
  } as WidgetConfig,
  {
    id: uuidv4(),
    type: 'quick-actions',
    title: t('widgetTypes.quick-actions.name'),
    size: 'medium',
    refreshInterval: 0,
    isVisible: true,
    order: 7,
    settings: {
      actions: [],
    },
  } as WidgetConfig,
]

// ============================================================================
// Mock Data Generation (Replace with API calls in production)
// ============================================================================

function generateMockKpiData(metric: string): KpiData {
  const baseValues: Record<string, number> = {
    'active-dossiers': 147,
    'pending-tasks': 23,
    'overdue-items': 5,
    'completed-this-week': 42,
    'response-rate': 94.5,
    'engagement-count': 18,
    'intake-volume': 156,
    'sla-compliance': 98.2,
  }

  const value = baseValues[metric] || Math.floor(Math.random() * 100)
  const previousValue = value + (Math.random() - 0.5) * value * 0.2
  const trendPercentage = ((value - previousValue) / previousValue) * 100

  return {
    value,
    previousValue,
    trend: trendPercentage > 1 ? 'up' : trendPercentage < -1 ? 'down' : 'neutral',
    trendPercentage: Math.abs(trendPercentage),
    sparklineData: Array.from({ length: 7 }, () => Math.floor(value * (0.8 + Math.random() * 0.4))),
  }
}

function generateMockChartData(dataSource: string): ChartData {
  switch (dataSource) {
    case 'work-items-by-status':
      return {
        labels: ['Pending', 'In Progress', 'Review', 'Completed'],
        datasets: [
          {
            label: 'Work Items',
            data: [23, 15, 8, 42],
            backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
          },
        ],
        total: 88,
      }
    case 'work-items-by-source':
      return {
        labels: ['Tasks', 'Commitments', 'Intake'],
        datasets: [
          {
            label: 'Work Items',
            data: [35, 28, 25],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
          },
        ],
        total: 88,
      }
    case 'completion-trend':
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Completed',
            data: [8, 12, 6, 15, 10, 4, 7],
            borderColor: '#10b981',
          },
        ],
      }
    default:
      return {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [
          {
            label: 'Data',
            data: [25, 35, 20, 20],
          },
        ],
      }
  }
}

function generateMockEvents(): EventData[] {
  const now = new Date()
  return [
    {
      id: '1',
      title: 'Team Meeting',
      type: 'meeting',
      startDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      description: 'Weekly sync with the team',
    },
    {
      id: '2',
      title: 'Report Deadline',
      type: 'deadline',
      startDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'Q4 report submission',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Follow-up: Saudi Embassy',
      type: 'follow-up',
      startDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'MOU Renewal - UAE',
      type: 'mou-renewal',
      startDate: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
    },
    {
      id: '5',
      title: 'Engagement Review',
      type: 'engagement',
      startDate: new Date(now.getTime() + 96 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

function generateMockTasks() {
  return [
    {
      id: '1',
      title: 'Review dossier updates',
      source: 'task' as const,
      priority: 'high' as const,
      status: 'pending' as const,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Prepare briefing document',
      source: 'commitment' as const,
      priority: 'urgent' as const,
      status: 'in_progress' as const,
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
    },
    {
      id: '3',
      title: 'Response to intake ticket #156',
      source: 'intake' as const,
      priority: 'medium' as const,
      status: 'pending' as const,
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isOverdue: true,
    },
    {
      id: '4',
      title: 'Update contact information',
      source: 'task' as const,
      priority: 'low' as const,
      status: 'pending' as const,
    },
    {
      id: '5',
      title: 'Follow up on meeting notes',
      source: 'commitment' as const,
      priority: 'medium' as const,
      status: 'completed' as const,
    },
  ]
}

function generateMockNotifications(): NotificationData[] {
  return [
    {
      id: '1',
      title: 'New Task Assigned',
      message: 'You have been assigned to review the Q4 report',
      category: 'task-assigned',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      actionUrl: '/my-work',
    },
    {
      id: '2',
      title: 'Deadline Approaching',
      message: 'Report submission due in 2 hours',
      category: 'deadline-approaching',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Status Updated',
      message: 'Dossier #147 status changed to Active',
      category: 'status-change',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'You were mentioned',
      message: 'Ahmed mentioned you in a comment',
      category: 'mention',
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

// ============================================================================
// Widget Data Fetching Hook
// ============================================================================

function useWidgetData(widget: WidgetConfig) {
  return useQuery({
    queryKey: widgetDashboardKeys.widgetData(widget.id as string),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Return mock data based on widget type
      switch (widget.type) {
        case 'kpi-card': {
          const settings = widget.settings as { metric: string }
          return generateMockKpiData(settings.metric)
        }
        case 'chart': {
          const settings = widget.settings as { dataSource: string }
          return generateMockChartData(settings.dataSource)
        }
        case 'upcoming-events':
          return generateMockEvents()
        case 'task-list':
          return generateMockTasks()
        case 'notifications':
          return generateMockNotifications()
        case 'quick-actions':
          return null // Quick actions don't need data
        default:
          return null
      }
    },
    refetchInterval: widget.refreshInterval || false,
    staleTime: 30000, // 30 seconds
  })
}

// ============================================================================
// Main Hook
// ============================================================================

interface UseWidgetDashboardOptions {
  autoSave?: boolean
}

export function useWidgetDashboard(options: UseWidgetDashboardOptions = {}) {
  const { autoSave = true } = options
  const { t } = useTranslation('dashboard-widgets')
  const queryClient = useQueryClient()

  // ============================================================================
  // State
  // ============================================================================

  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // Load from Local Storage
  // ============================================================================

  useEffect(() => {
    const loadLayout = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as WidgetConfig[]
          setWidgets(parsed)
        } else {
          // Use default widgets
          setWidgets(createDefaultWidgets(t))
        }
      } catch (error) {
        console.error('Failed to load dashboard layout:', error)
        setWidgets(createDefaultWidgets(t))
      }
      setIsInitialized(true)
    }

    loadLayout()
  }, [t])

  // ============================================================================
  // Save to Local Storage
  // ============================================================================

  useEffect(() => {
    if (autoSave && isInitialized && widgets.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
      } catch (error) {
        console.error('Failed to save dashboard layout:', error)
      }
    }
  }, [widgets, autoSave, isInitialized])

  // ============================================================================
  // Widget Data
  // ============================================================================

  // Fetch data for all widgets
  const widgetDataQueries = widgets.map((widget) => ({
    widget,
    ...useWidgetData(widget),
  }))

  // Aggregate widget data into a single object
  const widgetData = useMemo(() => {
    return widgetDataQueries.reduce(
      (acc, { widget, data }) => {
        acc[widget.id as string] = data
        return acc
      },
      {} as Record<string, unknown>,
    )
  }, [widgetDataQueries])

  // ============================================================================
  // Actions
  // ============================================================================

  const addWidget = useCallback(
    (type: WidgetType) => {
      const registry = WIDGET_REGISTRY[type]
      if (!registry) return

      const newWidget: WidgetConfig = {
        id: uuidv4(),
        type,
        title: t(`widgetTypes.${type}.name`),
        size: registry.defaultSize,
        refreshInterval: 300000,
        isVisible: true,
        order: widgets.length,
        settings: registry.defaultConfig?.settings || {},
      } as WidgetConfig

      setWidgets((prev) => [...prev, newWidget])
    },
    [widgets.length, t],
  )

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
  }, [])

  const updateWidget = useCallback((updatedWidget: WidgetConfig) => {
    setWidgets((prev) => prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w)))
  }, [])

  const reorderWidgets = useCallback((newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets)
  }, [])

  const resetLayout = useCallback(() => {
    setWidgets(createDefaultWidgets(t))
    localStorage.removeItem(STORAGE_KEY)
  }, [t])

  const refreshWidget = useCallback(
    (widgetId: string) => {
      queryClient.invalidateQueries({
        queryKey: widgetDashboardKeys.widgetData(widgetId),
      })
    },
    [queryClient],
  )

  const openSettings = useCallback((widget: WidgetConfig) => {
    setSelectedWidget(widget)
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setSelectedWidget(null)
    setIsSettingsOpen(false)
  }, [])

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev)
  }, [])

  // ============================================================================
  // Existing Widget Types
  // ============================================================================

  const existingWidgetTypes = useMemo(() => widgets.map((w) => w.type), [widgets])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    widgets,
    widgetData,
    isEditMode,
    selectedWidget,
    isLibraryOpen,
    isSettingsOpen,
    isInitialized,
    existingWidgetTypes,

    // Actions
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    resetLayout,
    refreshWidget,
    openSettings,
    closeSettings,
    toggleEditMode,
    setIsLibraryOpen,
  }
}

export default useWidgetDashboard
