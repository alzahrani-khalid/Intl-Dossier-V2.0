/**
 * useWidgetDashboard Hook
 *
 * Manages the state and persistence of the customizable dashboard.
 * Handles widget configuration, layout, and data fetching.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
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
// Real Data Fetching Functions
// ============================================================================

async function fetchKpiData(metric: string): Promise<KpiData> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  try {
    let value = 0
    let previousValue = 0

    switch (metric) {
      case 'active-dossiers': {
        const [current, previous] = await Promise.all([
          supabase
            .from('dossiers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase
            .from('dossiers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .lt('created_at', weekAgo.toISOString()),
        ])
        value = current.count || 0
        previousValue = previous.count || value
        break
      }
      case 'pending-tasks': {
        const [current, previous] = await Promise.all([
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .lt('created_at', weekAgo.toISOString()),
        ])
        value = current.count || 0
        previousValue = previous.count || value
        break
      }
      case 'overdue-items': {
        const { count } = await supabase
          .from('work_items')
          .select('id', { count: 'exact', head: true })
          .lt('deadline', now.toISOString())
          .neq('status', 'completed')
        value = count || 0
        previousValue = value // No historical comparison for overdue
        break
      }
      case 'completed-this-week': {
        const [current, previous] = await Promise.all([
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('updated_at', weekAgo.toISOString()),
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('updated_at', twoWeeksAgo.toISOString())
            .lt('updated_at', weekAgo.toISOString()),
        ])
        value = current.count || 0
        previousValue = previous.count || value
        break
      }
      case 'engagement-count': {
        const { count } = await supabase
          .from('dossiers')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'engagement')
          .eq('status', 'active')
        value = count || 0
        previousValue = value
        break
      }
      case 'intake-volume': {
        const [current, previous] = await Promise.all([
          supabase
            .from('intake_tickets')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', weekAgo.toISOString()),
          supabase
            .from('intake_tickets')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', twoWeeksAgo.toISOString())
            .lt('created_at', weekAgo.toISOString()),
        ])
        value = current.count || 0
        previousValue = previous.count || value
        break
      }
      default:
        value = 0
        previousValue = 0
    }

    const trendPercentage = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0

    return {
      value,
      previousValue,
      trend: trendPercentage > 1 ? 'up' : trendPercentage < -1 ? 'down' : 'neutral',
      trendPercentage: Math.abs(trendPercentage),
      sparklineData: [], // Could add historical data if needed
    }
  } catch (error) {
    console.error('Failed to fetch KPI data:', error)
    return {
      value: 0,
      previousValue: 0,
      trend: 'neutral',
      trendPercentage: 0,
      sparklineData: [],
    }
  }
}

async function fetchChartData(dataSource: string): Promise<ChartData> {
  try {
    switch (dataSource) {
      case 'work-items-by-status': {
        const { data } = await supabase.from('work_items').select('status')

        const statusCounts: Record<string, number> = {
          pending: 0,
          in_progress: 0,
          review: 0,
          completed: 0,
        }

        for (const item of data ?? []) {
          if (item.status in statusCounts) {
            statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1
          }
        }

        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)

        return {
          labels: ['Pending', 'In Progress', 'Review', 'Completed'],
          datasets: [
            {
              label: 'Work Items',
              data: [
                statusCounts.pending ?? 0,
                statusCounts.in_progress ?? 0,
                statusCounts.review ?? 0,
                statusCounts.completed ?? 0,
              ],
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
            },
          ],
          total,
        }
      }
      case 'work-items-by-source': {
        const { data } = await supabase.from('work_items').select('source')

        const sourceCounts: Record<string, number> = {
          task: 0,
          commitment: 0,
          intake: 0,
        }

        for (const item of data ?? []) {
          if (item.source in sourceCounts) {
            sourceCounts[item.source] = (sourceCounts[item.source] ?? 0) + 1
          }
        }

        const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0)

        return {
          labels: ['Tasks', 'Commitments', 'Intake'],
          datasets: [
            {
              label: 'Work Items',
              data: [
                sourceCounts.task ?? 0,
                sourceCounts.commitment ?? 0,
                sourceCounts.intake ?? 0,
              ],
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
            },
          ],
          total,
        }
      }
      case 'completion-trend': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const { data } = await supabase
          .from('work_items')
          .select('updated_at')
          .eq('status', 'completed')
          .gte('updated_at', weekAgo.toISOString())

        const dayCounts = [0, 0, 0, 0, 0, 0, 0]

        for (const item of data || []) {
          const day = new Date(item.updated_at).getDay()
          dayCounts[day]!++
        }

        // Reorder to start from Monday
        const reorderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const reorderedCounts: number[] = [
          dayCounts[1]!,
          dayCounts[2]!,
          dayCounts[3]!,
          dayCounts[4]!,
          dayCounts[5]!,
          dayCounts[6]!,
          dayCounts[0]!,
        ]

        return {
          labels: reorderedDays,
          datasets: [
            {
              label: 'Completed',
              data: reorderedCounts,
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              borderColor: '#10b981',
            },
          ],
        }
      }
      case 'intake-volume-trend': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const { data } = await supabase
          .from('intake_tickets')
          .select('created_at')
          .gte('created_at', weekAgo.toISOString())

        const dayMap: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          dayMap[d.toISOString().slice(0, 10)] = 0
        }

        for (const item of data || []) {
          const day = new Date(item.created_at).toISOString().slice(0, 10)
          if (day in dayMap) {
            dayMap[day]!++
          }
        }

        return {
          labels: Object.keys(dayMap),
          datasets: [
            {
              label: 'Intake Tickets',
              data: Object.values(dayMap),
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              borderColor: '#8b5cf6',
            },
          ],
        }
      }
      case 'engagement-distribution': {
        const { data } = await supabase.from('dossiers').select('type').eq('status', 'active')

        const typeCounts: Record<string, number> = {}
        for (const item of data || []) {
          typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
        }

        const labels = Object.keys(typeCounts)
        const values = Object.values(typeCounts)
        const colors = [
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#3b82f6',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#10b981',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#f59e0b',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#ef4444',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#8b5cf6',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#ec4899',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#06b6d4',
          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
          '#84cc16',
        ]

        return {
          labels,
          datasets: [
            {
              label: 'Dossiers',
              data: values,
              backgroundColor: colors.slice(0, labels.length),
            },
          ],
          total: values.reduce((a, b) => a + b, 0),
        }
      }
      case 'priority-breakdown': {
        const { data } = await supabase
          .from('work_items')
          .select('priority')
          .neq('status', 'completed')

        const priorityCounts: Record<string, number> = {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        }

        for (const item of data || []) {
          if (item.priority in priorityCounts) {
            priorityCounts[item.priority]!++
          }
        }

        const total = Object.values(priorityCounts).reduce((a, b) => a + b, 0)

        return {
          labels: ['Low', 'Medium', 'High', 'Urgent'],
          datasets: [
            {
              label: 'Work Items',
              data: [
                priorityCounts.low!,
                priorityCounts.medium!,
                priorityCounts.high!,
                priorityCounts.urgent!,
              ],
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#dc2626'],
            },
          ],
          total,
        }
      }
      case 'team-workload': {
        const { data } = await supabase
          .from('work_items')
          .select('assignee_id, profiles!inner(display_name)')
          .neq('status', 'completed')

        const assigneeCounts: Record<string, { name: string; count: number }> = {}

        for (const item of data || []) {
          const id = item.assignee_id as string
          const profile = item.profiles as unknown as { display_name: string }
          if (id && profile?.display_name) {
            if (!assigneeCounts[id]) {
              assigneeCounts[id] = { name: profile.display_name, count: 0 }
            }
            assigneeCounts[id]!.count++
          }
        }

        const sorted = Object.values(assigneeCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        return {
          labels: sorted.map((a) => a.name),
          datasets: [
            {
              label: 'Open Items',
              data: sorted.map((a) => a.count),
              // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useWidgetDashboard
              backgroundColor: '#3b82f6',
            },
          ],
        }
      }
      default:
        return {
          labels: [],
          datasets: [],
        }
    }
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
    return { labels: [], datasets: [] }
  }
}

async function fetchEvents(maxItems = 5): Promise<EventData[]> {
  try {
    const now = new Date()
    const { data } = await supabase
      .from('calendar_entries')
      .select('id, title_en, title_ar, entry_type, start_datetime, description_en, description_ar')
      .gte('start_datetime', now.toISOString())
      .order('start_datetime', { ascending: true })
      .limit(maxItems)

    return (data || []).map((entry) => ({
      id: entry.id,
      title: entry.title_en || entry.title_ar || 'Untitled',
      type: entry.entry_type || 'other',
      startDate: entry.start_datetime,
      description: entry.description_en || entry.description_ar,
    }))
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return []
  }
}

async function fetchTasks(maxItems = 10, showCompleted = false) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('work_items')
      .select('id, title, source, priority, status, deadline')
      .eq('assignee_id', user.id)
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(maxItems)

    if (!showCompleted) {
      query = query.neq('status', 'completed')
    }

    const { data } = await query

    const now = new Date()
    return (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source || 'task',
      priority: item.priority || 'medium',
      status: item.status || 'pending',
      deadline: item.deadline,
      isOverdue: item.deadline
        ? new Date(item.deadline) < now && item.status !== 'completed'
        : false,
    }))
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return []
  }
}

async function fetchNotifications(): Promise<NotificationData[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, category, read, created_at, action_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category || 'general',
      isRead: n.read || false,
      createdAt: n.created_at,
      actionUrl: n.action_url,
    }))
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }
}

async function fetchActivityFeed(maxItems = 15) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(maxItems)

    return (data || []).map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      createdAt: entry.created_at,
      metadata: entry.metadata,
    }))
  } catch (error) {
    console.error('Failed to fetch activity feed:', error)
    return []
  }
}

async function fetchStatsSummary() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [activeDossiers, openWorkItems, completedThisMonth, overdueItems] = await Promise.all([
      supabase.from('dossiers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('work_items')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'completed'),
      supabase
        .from('work_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', monthStart.toISOString()),
      supabase
        .from('work_items')
        .select('id', { count: 'exact', head: true })
        .lt('deadline', now.toISOString())
        .neq('status', 'completed'),
    ])

    return {
      activeDossiers: activeDossiers.count || 0,
      openWorkItems: openWorkItems.count || 0,
      completedThisMonth: completedThisMonth.count || 0,
      overdueItems: overdueItems.count || 0,
    }
  } catch (error) {
    console.error('Failed to fetch stats summary:', error)
    return {
      activeDossiers: 0,
      openWorkItems: 0,
      completedThisMonth: 0,
      overdueItems: 0,
    }
  }
}

// ============================================================================
// Widget Data Fetching Function (for use with useQueries)
// ============================================================================

function fetchWidgetData(widget: WidgetConfig) {
  return async () => {
    // Fetch real data based on widget type
    switch (widget.type) {
      case 'kpi-card': {
        const settings = widget.settings as { metric: string }
        return fetchKpiData(settings.metric)
      }
      case 'chart': {
        const settings = widget.settings as { dataSource: string }
        return fetchChartData(settings.dataSource)
      }
      case 'upcoming-events': {
        const settings = widget.settings as { maxItems?: number }
        return fetchEvents(settings.maxItems || 5)
      }
      case 'task-list': {
        const settings = widget.settings as { maxItems?: number; showCompleted?: boolean }
        return fetchTasks(settings.maxItems || 10, settings.showCompleted || false)
      }
      case 'notifications':
        return fetchNotifications()
      case 'activity-feed': {
        const settings = widget.settings as { maxItems?: number }
        return fetchActivityFeed(settings.maxItems || 15)
      }
      case 'stats-summary':
        return fetchStatsSummary()
      case 'quick-actions':
        return null // Quick actions don't need data
      default:
        return null
    }
  }
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
  // Widget Data - Using useQueries for dynamic number of queries
  // ============================================================================

  // Create query options for all widgets
  const widgetQueries = useQueries({
    queries: widgets.map((widget) => ({
      queryKey: widgetDashboardKeys.widgetData(widget.id as string),
      queryFn: fetchWidgetData(widget),
      refetchInterval: widget.refreshInterval || false,
      staleTime: STALE_TIME.LIVE,
    })),
  })

  // Aggregate widget data into a single object
  const widgetData = useMemo(() => {
    return widgets.reduce(
      (acc, widget, index) => {
        acc[widget.id as string] = widgetQueries[index]?.data
        return acc
      },
      {} as Record<string, unknown>,
    )
  }, [widgets, widgetQueries])

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
