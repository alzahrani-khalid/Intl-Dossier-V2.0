/**
 * Dashboard Widgets
 *
 * Export all widget components and utilities for the
 * customizable dashboard feature.
 */

// Widget Container
export { WidgetContainer } from './WidgetContainer'
export type { default as WidgetContainerType } from './WidgetContainer'

// Individual Widget Components
export { KpiWidget } from './KpiWidget'
export { ChartWidget } from './ChartWidget'
export { EventsWidget } from './EventsWidget'
export { TaskListWidget } from './TaskListWidget'
export { NotificationsWidget } from './NotificationsWidget'
export { QuickActionsWidget, DEFAULT_QUICK_ACTIONS } from './QuickActionsWidget'

// Widget Grid (will be added)
export { WidgetGrid } from './WidgetGrid'

// Widget Library (will be added)
export { WidgetLibrary } from './WidgetLibrary'

// Widget Settings Dialog (will be added)
export { WidgetSettingsDialog } from './WidgetSettingsDialog'

// Benchmark Preview (data-driven preview before customization)
export { BenchmarkPreview } from './BenchmarkPreview'
