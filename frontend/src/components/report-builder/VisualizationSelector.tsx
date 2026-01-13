/**
 * Visualization Selector Component
 *
 * Allows users to choose and configure how to visualize their report data.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table2,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  CircleDot,
  ScatterChart,
  Grid3X3,
  CreditCard,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  VisualizationType,
  ReportConfiguration,
  ReportField,
} from '@/types/report-builder.types'

interface VisualizationSelectorProps {
  visualization: ReportConfiguration['visualization']
  availableFields: ReportField[]
  onSetVisualization: (type: VisualizationType) => void
  onUpdateVisualization: (updates: Partial<ReportConfiguration['visualization']>) => void
}

const visualizationIcons: Record<VisualizationType, React.ComponentType<{ className?: string }>> = {
  table: Table2,
  bar_chart: BarChart3,
  line_chart: LineChart,
  pie_chart: PieChart,
  area_chart: AreaChart,
  donut_chart: CircleDot,
  scatter_plot: ScatterChart,
  heatmap: Grid3X3,
  card: CreditCard,
  kpi: Gauge,
}

const VISUALIZATION_TYPES: VisualizationType[] = [
  'table',
  'bar_chart',
  'line_chart',
  'pie_chart',
  'area_chart',
  'donut_chart',
  'scatter_plot',
  'heatmap',
  'card',
  'kpi',
]

// Which visualization types need axis configuration
const AXIS_VISUALIZATIONS: VisualizationType[] = [
  'bar_chart',
  'line_chart',
  'area_chart',
  'scatter_plot',
]

// Which visualization types support legend
const LEGEND_VISUALIZATIONS: VisualizationType[] = [
  'bar_chart',
  'line_chart',
  'pie_chart',
  'area_chart',
  'donut_chart',
  'scatter_plot',
]

export function VisualizationSelector({
  visualization,
  availableFields,
  onSetVisualization,
  onUpdateVisualization,
}: VisualizationSelectorProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const showAxisConfig = AXIS_VISUALIZATIONS.includes(visualization.type)
  const showLegendConfig = LEGEND_VISUALIZATIONS.includes(visualization.type)
  const showGridConfig =
    visualization.type !== 'table' && visualization.type !== 'card' && visualization.type !== 'kpi'

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{t('visualization.title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('visualization.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visualization Type Selection */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {VISUALIZATION_TYPES.map((type) => {
            const Icon = visualizationIcons[type]
            const isSelected = visualization.type === type

            return (
              <button
                key={type}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-all',
                  'hover:border-primary/50 hover:bg-accent/50',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background',
                )}
                onClick={() => onSetVisualization(type)}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 sm:h-6 sm:w-6',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] sm:text-xs text-center leading-tight',
                    isSelected ? 'text-primary font-medium' : 'text-muted-foreground',
                  )}
                >
                  {t(`visualization.types.${type}`)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Chart Configuration */}
        {visualization.type !== 'table' && (
          <div className="space-y-4 pt-4 border-t">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="chart-title">{t('visualization.settings.title')}</Label>
              <Input
                id="chart-title"
                value={isRTL ? visualization.titleAr || '' : visualization.title || ''}
                onChange={(e) =>
                  onUpdateVisualization(
                    isRTL ? { titleAr: e.target.value } : { title: e.target.value },
                  )
                }
                placeholder={t('visualization.settings.title')}
              />
            </div>

            {/* Axis Configuration */}
            {showAxisConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('visualization.settings.xAxis')}</Label>
                  <Select
                    value={visualization.xAxisFieldId || ''}
                    onValueChange={(value) => onUpdateVisualization({ xAxisFieldId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.title')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {isRTL ? field.nameAr : field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t('visualization.settings.yAxis')}</Label>
                  <Select
                    value={visualization.yAxisFieldId || ''}
                    onValueChange={(value) => onUpdateVisualization({ yAxisFieldId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.title')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields
                        .filter((f) => f.type === 'number')
                        .map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {isRTL ? field.nameAr : field.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Color Field (for pie/donut charts) */}
            {(visualization.type === 'pie_chart' ||
              visualization.type === 'donut_chart' ||
              visualization.type === 'heatmap') && (
              <div className="grid gap-2">
                <Label>{t('visualization.settings.colorField')}</Label>
                <Select
                  value={visualization.colorFieldId || ''}
                  onValueChange={(value) => onUpdateVisualization({ colorFieldId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('fields.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {isRTL ? field.nameAr : field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Display Options */}
            <div className="flex flex-wrap gap-6">
              {showLegendConfig && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-legend"
                    checked={visualization.showLegend}
                    onCheckedChange={(checked) => onUpdateVisualization({ showLegend: checked })}
                  />
                  <Label htmlFor="show-legend" className="text-sm">
                    {t('visualization.settings.showLegend')}
                  </Label>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="show-labels"
                  checked={visualization.showLabels}
                  onCheckedChange={(checked) => onUpdateVisualization({ showLabels: checked })}
                />
                <Label htmlFor="show-labels" className="text-sm">
                  {t('visualization.settings.showLabels')}
                </Label>
              </div>

              {showGridConfig && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-grid"
                    checked={visualization.showGrid}
                    onCheckedChange={(checked) => onUpdateVisualization({ showGrid: checked })}
                  />
                  <Label htmlFor="show-grid" className="text-sm">
                    {t('visualization.settings.showGrid')}
                  </Label>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
