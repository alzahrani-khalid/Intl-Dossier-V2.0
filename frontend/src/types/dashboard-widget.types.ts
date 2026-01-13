/**
 * Dashboard Widget Types
 *
 * Type definitions for the customizable dashboard widget system.
 * Supports drag-and-drop layout with various widget types.
 */

import type { UniqueIdentifier } from '@dnd-kit/core'

// ============================================================================
// Widget Type Definitions
// ============================================================================

/**
 * Available widget types for the dashboard
 */
export type WidgetType =
  | 'kpi-card' // Key Performance Indicator card
  | 'chart' // Various chart types (line, bar, pie, etc.)
  | 'upcoming-events' // Calendar/upcoming events list
  | 'task-list' // Task/work item list
  | 'notifications' // Notification feed
  | 'activity-feed' // Recent activity stream
  | 'quick-actions' // Quick action buttons
  | 'stats-summary' // Summary statistics panel

/**
 * Chart types supported by the chart widget
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'sparkline'

/**
 * KPI trend direction
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Widget size presets for grid layout
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full'

/**
 * Refresh interval options (in milliseconds)
 */
export type RefreshInterval = 0 | 30000 | 60000 | 300000 | 600000 | 1800000

// ============================================================================
// Widget Configuration Types
// ============================================================================

/**
 * Base widget configuration shared by all widget types
 */
export interface BaseWidgetConfig {
  id: UniqueIdentifier
  type: WidgetType
  title: string
  size: WidgetSize
  refreshInterval: RefreshInterval
  isVisible: boolean
  order: number
  customStyles?: WidgetCustomStyles
}

/**
 * Custom style overrides for widgets
 */
export interface WidgetCustomStyles {
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  accentColor?: string
}

/**
 * KPI Card widget configuration
 */
export interface KpiWidgetConfig extends BaseWidgetConfig {
  type: 'kpi-card'
  settings: {
    metric: KpiMetricType
    showTrend: boolean
    showSparkline: boolean
    targetValue?: number
    comparisonPeriod: 'day' | 'week' | 'month' | 'quarter'
  }
}

/**
 * Available KPI metric types
 */
export type KpiMetricType =
  | 'active-dossiers'
  | 'pending-tasks'
  | 'overdue-items'
  | 'completed-this-week'
  | 'response-rate'
  | 'engagement-count'
  | 'intake-volume'
  | 'sla-compliance'
  | 'custom'

/**
 * Chart widget configuration
 */
export interface ChartWidgetConfig extends BaseWidgetConfig {
  type: 'chart'
  settings: {
    chartType: ChartType
    dataSource: ChartDataSource
    showLegend: boolean
    showGrid: boolean
    dateRange: 'week' | 'month' | 'quarter' | 'year'
    colors?: string[]
  }
}

/**
 * Chart data source options
 */
export type ChartDataSource =
  | 'work-items-by-status'
  | 'work-items-by-source'
  | 'completion-trend'
  | 'intake-volume-trend'
  | 'engagement-distribution'
  | 'priority-breakdown'
  | 'team-workload'
  | 'custom'

/**
 * Upcoming events widget configuration
 */
export interface EventsWidgetConfig extends BaseWidgetConfig {
  type: 'upcoming-events'
  settings: {
    maxItems: number
    showPastEvents: boolean
    eventTypes: EventType[]
    dateRange: 'today' | 'week' | 'month'
  }
}

/**
 * Event types to display
 */
export type EventType = 'meeting' | 'deadline' | 'follow-up' | 'engagement' | 'mou-renewal' | 'all'

/**
 * Task list widget configuration
 */
export interface TaskListWidgetConfig extends BaseWidgetConfig {
  type: 'task-list'
  settings: {
    maxItems: number
    showCompleted: boolean
    groupBy: 'none' | 'source' | 'priority' | 'status'
    sortBy: 'deadline' | 'priority' | 'created_at'
    filterSource?: 'commitment' | 'task' | 'intake' | 'all'
  }
}

/**
 * Notifications widget configuration
 */
export interface NotificationsWidgetConfig extends BaseWidgetConfig {
  type: 'notifications'
  settings: {
    maxItems: number
    showRead: boolean
    categories: NotificationCategory[]
  }
}

/**
 * Notification categories
 */
export type NotificationCategory =
  | 'task-assigned'
  | 'deadline-approaching'
  | 'status-change'
  | 'mention'
  | 'system'
  | 'all'

/**
 * Activity feed widget configuration
 */
export interface ActivityFeedWidgetConfig extends BaseWidgetConfig {
  type: 'activity-feed'
  settings: {
    maxItems: number
    activityTypes: ActivityType[]
    showTimestamps: boolean
  }
}

/**
 * Activity types for the feed
 */
export type ActivityType =
  | 'created'
  | 'updated'
  | 'completed'
  | 'commented'
  | 'assigned'
  | 'status-change'
  | 'all'

/**
 * Quick actions widget configuration
 */
export interface QuickActionsWidgetConfig extends BaseWidgetConfig {
  type: 'quick-actions'
  settings: {
    actions: QuickAction[]
  }
}

/**
 * Quick action definition
 */
export interface QuickAction {
  id: string
  label: string
  labelAr: string
  icon: string
  action: QuickActionType
  route?: string
  color?: string
}

/**
 * Quick action types
 */
export type QuickActionType =
  | 'navigate'
  | 'create-dossier'
  | 'create-task'
  | 'create-intake'
  | 'open-search'
  | 'custom'

/**
 * Stats summary widget configuration
 */
export interface StatsSummaryWidgetConfig extends BaseWidgetConfig {
  type: 'stats-summary'
  settings: {
    metrics: KpiMetricType[]
    layout: 'grid' | 'list'
    showTrends: boolean
  }
}

/**
 * Union type of all widget configurations
 */
export type WidgetConfig =
  | KpiWidgetConfig
  | ChartWidgetConfig
  | EventsWidgetConfig
  | TaskListWidgetConfig
  | NotificationsWidgetConfig
  | ActivityFeedWidgetConfig
  | QuickActionsWidgetConfig
  | StatsSummaryWidgetConfig

// ============================================================================
// Dashboard Layout Types
// ============================================================================

/**
 * Grid position for a widget
 */
export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Widget with position information for grid layout
 */
export interface PositionedWidget {
  widget: WidgetConfig
  position: WidgetPosition
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: PositionedWidget[]
  columns: number
  rowHeight: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

/**
 * User dashboard preferences
 */
export interface DashboardPreferences {
  userId: string
  activeLayoutId: string
  layouts: DashboardLayout[]
  defaultWidgets: WidgetConfig[]
  theme: 'light' | 'dark' | 'system'
}

// ============================================================================
// Widget Data Types
// ============================================================================

/**
 * KPI data structure
 */
export interface KpiData {
  value: number
  previousValue: number
  trend: TrendDirection
  trendPercentage: number
  sparklineData?: number[]
  target?: number
  targetProgress?: number
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  metadata?: Record<string, unknown>
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
}

/**
 * Chart data structure
 */
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
  total?: number
}

/**
 * Chart dataset
 */
export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
}

/**
 * Event data for upcoming events widget
 */
export interface EventData {
  id: string
  title: string
  type: EventType
  startDate: string
  endDate?: string
  description?: string
  relatedEntityId?: string
  relatedEntityType?: string
  priority?: 'low' | 'medium' | 'high'
}

/**
 * Notification data
 */
export interface NotificationData {
  id: string
  title: string
  message: string
  category: NotificationCategory
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * Activity data for activity feed
 */
export interface ActivityData {
  id: string
  type: ActivityType
  actor: {
    id: string
    name: string
    avatar?: string
  }
  target: {
    id: string
    type: string
    title: string
  }
  timestamp: string
  details?: string
}

// ============================================================================
// Widget State Types
// ============================================================================

/**
 * Widget loading state
 */
export interface WidgetLoadingState {
  isLoading: boolean
  isError: boolean
  error?: Error
  lastUpdated?: string
}

/**
 * Widget with runtime state
 */
export interface WidgetWithState<T = unknown> {
  config: WidgetConfig
  data: T | null
  state: WidgetLoadingState
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

/**
 * Drag event data for widget reordering
 */
export interface WidgetDragData {
  widgetId: UniqueIdentifier
  type: WidgetType
  fromIndex: number
}

/**
 * Drop result for widget placement
 */
export interface WidgetDropResult {
  widgetId: UniqueIdentifier
  toIndex: number
  position?: WidgetPosition
}

// ============================================================================
// Widget Registry Types
// ============================================================================

/**
 * Widget registry entry for available widgets
 */
export interface WidgetRegistryEntry {
  type: WidgetType
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  icon: string
  defaultSize: WidgetSize
  minSize: WidgetSize
  maxSize: WidgetSize
  defaultConfig: Partial<WidgetConfig>
  supportedSizes: WidgetSize[]
}

/**
 * Widget registry for all available widgets
 */
export type WidgetRegistry = Record<WidgetType, WidgetRegistryEntry>

// ============================================================================
// Default Values and Constants
// ============================================================================

/**
 * Size to grid columns mapping
 */
export const SIZE_TO_COLUMNS: Record<WidgetSize, number> = {
  small: 1,
  medium: 2,
  large: 3,
  full: 4,
}

/**
 * Size to grid rows mapping
 */
export const SIZE_TO_ROWS: Record<WidgetSize, number> = {
  small: 1,
  medium: 1,
  large: 2,
  full: 2,
}

/**
 * Refresh interval labels
 */
export const REFRESH_INTERVAL_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 0, label: 'Never' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 1800000, label: '30 minutes' },
]

/**
 * Default dashboard layout
 */
export const DEFAULT_COLUMNS = 4
export const DEFAULT_ROW_HEIGHT = 150
export const WIDGET_GAP = 16
