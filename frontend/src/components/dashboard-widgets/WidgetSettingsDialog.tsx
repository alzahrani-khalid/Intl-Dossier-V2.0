/**
 * WidgetSettingsDialog Component
 *
 * A dialog for configuring widget settings including size,
 * refresh interval, and widget-specific options.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  WidgetConfig,
  WidgetSize,
  RefreshInterval,
  KpiMetricType,
  ChartType,
  ChartDataSource,
} from '@/types/dashboard-widget.types'

interface WidgetSettingsDialogProps {
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
  onSave: (widget: WidgetConfig) => void
}

/**
 * Size options
 */
const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: 'small', label: 'settings.sizes.small' },
  { value: 'medium', label: 'settings.sizes.medium' },
  { value: 'large', label: 'settings.sizes.large' },
  { value: 'full', label: 'settings.sizes.full' },
]

/**
 * Refresh interval options
 */
const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 0, label: 'settings.intervals.never' },
  { value: 30000, label: 'settings.intervals.30s' },
  { value: 60000, label: 'settings.intervals.1m' },
  { value: 300000, label: 'settings.intervals.5m' },
  { value: 600000, label: 'settings.intervals.10m' },
  { value: 1800000, label: 'settings.intervals.30m' },
]

/**
 * KPI metric options
 */
const KPI_METRICS: KpiMetricType[] = [
  'active-dossiers',
  'pending-tasks',
  'overdue-items',
  'completed-this-week',
  'response-rate',
  'engagement-count',
  'intake-volume',
  'sla-compliance',
]

/**
 * Chart type options
 */
const CHART_TYPES: ChartType[] = ['line', 'bar', 'pie', 'donut', 'area', 'sparkline']

/**
 * Chart data source options
 */
const CHART_SOURCES: ChartDataSource[] = [
  'work-items-by-status',
  'work-items-by-source',
  'completion-trend',
  'intake-volume-trend',
  'engagement-distribution',
  'priority-breakdown',
  'team-workload',
]

/**
 * General settings tab content
 */
function GeneralSettings({
  widget,
  onChange,
  t,
}: {
  widget: WidgetConfig
  onChange: (updates: Partial<WidgetConfig>) => void
  t: (key: string) => string
}) {
  return (
    <div className="space-y-4">
      {/* Widget Title */}
      <div className="space-y-2">
        <Label htmlFor="widget-title">{t('settings.widgetTitle')}</Label>
        <Input
          id="widget-title"
          value={widget.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      {/* Widget Size */}
      <div className="space-y-2">
        <Label htmlFor="widget-size">{t('settings.widgetSize')}</Label>
        <Select
          value={widget.size}
          onValueChange={(value: WidgetSize) => onChange({ size: value })}
        >
          <SelectTrigger id="widget-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Refresh Interval */}
      <div className="space-y-2">
        <Label htmlFor="refresh-interval">{t('settings.refreshInterval')}</Label>
        <Select
          value={String(widget.refreshInterval)}
          onValueChange={(value) => onChange({ refreshInterval: Number(value) as RefreshInterval })}
        >
          <SelectTrigger id="refresh-interval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFRESH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {t(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * KPI-specific settings
 */
function KpiSettings({
  settings,
  onChange,
  t,
}: {
  settings: WidgetConfig['settings']
  onChange: (updates: Record<string, unknown>) => void
  t: (key: string) => string
}) {
  const kpiSettings = settings as {
    metric: KpiMetricType
    showTrend: boolean
    showSparkline: boolean
    targetValue?: number
    comparisonPeriod: string
  }

  return (
    <div className="space-y-4">
      {/* Metric Selection */}
      <div className="space-y-2">
        <Label>{t('settings.kpi.metric')}</Label>
        <Select
          value={kpiSettings.metric}
          onValueChange={(value: KpiMetricType) => onChange({ metric: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KPI_METRICS.map((metric) => (
              <SelectItem key={metric} value={metric}>
                {t(`metrics.${metric}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show Trend */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-trend">{t('settings.kpi.showTrend')}</Label>
        <Switch
          id="show-trend"
          checked={kpiSettings.showTrend}
          onCheckedChange={(checked) => onChange({ showTrend: checked })}
        />
      </div>

      {/* Show Sparkline */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-sparkline">{t('settings.kpi.showSparkline')}</Label>
        <Switch
          id="show-sparkline"
          checked={kpiSettings.showSparkline}
          onCheckedChange={(checked) => onChange({ showSparkline: checked })}
        />
      </div>

      {/* Comparison Period */}
      <div className="space-y-2">
        <Label>{t('settings.kpi.comparisonPeriod')}</Label>
        <Select
          value={kpiSettings.comparisonPeriod}
          onValueChange={(value) => onChange({ comparisonPeriod: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{t('periods.day')}</SelectItem>
            <SelectItem value="week">{t('periods.week')}</SelectItem>
            <SelectItem value="month">{t('periods.month')}</SelectItem>
            <SelectItem value="quarter">{t('periods.quarter')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Chart-specific settings
 */
function ChartSettings({
  settings,
  onChange,
  t,
}: {
  settings: WidgetConfig['settings']
  onChange: (updates: Record<string, unknown>) => void
  t: (key: string) => string
}) {
  const chartSettings = settings as {
    chartType: ChartType
    dataSource: ChartDataSource
    showLegend: boolean
    showGrid: boolean
    dateRange: string
  }

  return (
    <div className="space-y-4">
      {/* Chart Type */}
      <div className="space-y-2">
        <Label>{t('settings.chart.chartType')}</Label>
        <Select
          value={chartSettings.chartType}
          onValueChange={(value: ChartType) => onChange({ chartType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`chartTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Source */}
      <div className="space-y-2">
        <Label>{t('settings.chart.dataSource')}</Label>
        <Select
          value={chartSettings.dataSource}
          onValueChange={(value: ChartDataSource) => onChange({ dataSource: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {t(`dataSources.${source}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show Legend */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-legend">{t('settings.chart.showLegend')}</Label>
        <Switch
          id="show-legend"
          checked={chartSettings.showLegend}
          onCheckedChange={(checked) => onChange({ showLegend: checked })}
        />
      </div>

      {/* Show Grid */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-grid">{t('settings.chart.showGrid')}</Label>
        <Switch
          id="show-grid"
          checked={chartSettings.showGrid}
          onCheckedChange={(checked) => onChange({ showGrid: checked })}
        />
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>{t('settings.chart.dateRange')}</Label>
        <Select
          value={chartSettings.dateRange}
          onValueChange={(value) => onChange({ dateRange: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('periods.week')}</SelectItem>
            <SelectItem value="month">{t('periods.month')}</SelectItem>
            <SelectItem value="quarter">{t('periods.quarter')}</SelectItem>
            <SelectItem value="year">{t('periods.year')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Events-specific settings
 */
function EventsSettings({
  settings,
  onChange,
  t,
}: {
  settings: WidgetConfig['settings']
  onChange: (updates: Record<string, unknown>) => void
  t: (key: string) => string
}) {
  const eventsSettings = settings as {
    maxItems: number
    showPastEvents: boolean
    eventTypes: string[]
    dateRange: string
  }

  return (
    <div className="space-y-4">
      {/* Max Items */}
      <div className="space-y-2">
        <Label htmlFor="max-items">{t('settings.events.maxItems')}</Label>
        <Input
          id="max-items"
          type="number"
          min={1}
          max={20}
          value={eventsSettings.maxItems}
          onChange={(e) => onChange({ maxItems: Number(e.target.value) })}
        />
      </div>

      {/* Show Past Events */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-past">{t('settings.events.showPastEvents')}</Label>
        <Switch
          id="show-past"
          checked={eventsSettings.showPastEvents}
          onCheckedChange={(checked) => onChange({ showPastEvents: checked })}
        />
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>{t('settings.events.dateRange')}</Label>
        <Select
          value={eventsSettings.dateRange}
          onValueChange={(value) => onChange({ dateRange: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t('periods.today')}</SelectItem>
            <SelectItem value="week">{t('periods.week')}</SelectItem>
            <SelectItem value="month">{t('periods.month')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Task list-specific settings
 */
function TaskListSettings({
  settings,
  onChange,
  t,
}: {
  settings: WidgetConfig['settings']
  onChange: (updates: Record<string, unknown>) => void
  t: (key: string) => string
}) {
  const taskSettings = settings as {
    maxItems: number
    showCompleted: boolean
    groupBy: string
    sortBy: string
    filterSource: string
  }

  return (
    <div className="space-y-4">
      {/* Max Items */}
      <div className="space-y-2">
        <Label htmlFor="max-items">{t('settings.tasks.maxItems')}</Label>
        <Input
          id="max-items"
          type="number"
          min={1}
          max={20}
          value={taskSettings.maxItems}
          onChange={(e) => onChange({ maxItems: Number(e.target.value) })}
        />
      </div>

      {/* Show Completed */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-completed">{t('settings.tasks.showCompleted')}</Label>
        <Switch
          id="show-completed"
          checked={taskSettings.showCompleted}
          onCheckedChange={(checked) => onChange({ showCompleted: checked })}
        />
      </div>

      {/* Group By */}
      <div className="space-y-2">
        <Label>{t('settings.tasks.groupBy')}</Label>
        <Select
          value={taskSettings.groupBy}
          onValueChange={(value) => onChange({ groupBy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('groupBy.none')}</SelectItem>
            <SelectItem value="source">{t('groupBy.source')}</SelectItem>
            <SelectItem value="priority">{t('groupBy.priority')}</SelectItem>
            <SelectItem value="status">{t('groupBy.status')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label>{t('settings.tasks.sortBy')}</Label>
        <Select value={taskSettings.sortBy} onValueChange={(value) => onChange({ sortBy: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">{t('sortBy.deadline')}</SelectItem>
            <SelectItem value="priority">{t('sortBy.priority')}</SelectItem>
            <SelectItem value="created_at">{t('sortBy.created_at')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Source */}
      <div className="space-y-2">
        <Label>{t('settings.tasks.filterSource')}</Label>
        <Select
          value={taskSettings.filterSource || 'all'}
          onValueChange={(value) => onChange({ filterSource: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('sources.all')}</SelectItem>
            <SelectItem value="commitment">{t('sources.commitment')}</SelectItem>
            <SelectItem value="task">{t('sources.task')}</SelectItem>
            <SelectItem value="intake">{t('sources.intake')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function WidgetSettingsDialog({
  widget,
  isOpen,
  onClose,
  onSave,
}: WidgetSettingsDialogProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const [editedWidget, setEditedWidget] = useState<WidgetConfig | null>(null)

  // Initialize edited widget when dialog opens
  useEffect(() => {
    if (widget) {
      setEditedWidget({ ...widget })
    }
  }, [widget])

  if (!editedWidget) return null

  const handleGeneralChange = (updates: Partial<WidgetConfig>) => {
    setEditedWidget((prev) => {
      if (!prev) return prev
      return { ...prev, ...updates } as WidgetConfig
    })
  }

  const handleSettingsChange = (updates: Record<string, unknown>) => {
    setEditedWidget((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        settings: { ...prev.settings, ...updates },
      } as WidgetConfig
    })
  }

  const handleSave = () => {
    if (editedWidget) {
      onSave(editedWidget)
      onClose()
    }
  }

  // Render widget-specific settings
  const renderWidgetSettings = () => {
    switch (editedWidget.type) {
      case 'kpi-card':
        return (
          <KpiSettings settings={editedWidget.settings} onChange={handleSettingsChange} t={t} />
        )
      case 'chart':
        return (
          <ChartSettings settings={editedWidget.settings} onChange={handleSettingsChange} t={t} />
        )
      case 'upcoming-events':
        return (
          <EventsSettings settings={editedWidget.settings} onChange={handleSettingsChange} t={t} />
        )
      case 'task-list':
        return (
          <TaskListSettings
            settings={editedWidget.settings}
            onChange={handleSettingsChange}
            t={t}
          />
        )
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {t('settings.general')} {t('settings.title')}
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>
            {t('widgetTypes.' + editedWidget.type + '.name', editedWidget.type)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="widget">{t('settings.data')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralSettings widget={editedWidget} onChange={handleGeneralChange} t={t} />
          </TabsContent>

          <TabsContent value="widget" className="mt-4">
            {renderWidgetSettings()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave}>{t('saveLayout')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WidgetSettingsDialog
