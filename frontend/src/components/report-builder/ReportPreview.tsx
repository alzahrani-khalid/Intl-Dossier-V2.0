/**
 * Report Preview Component
 *
 * Displays a preview of the report results with visualization.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { RefreshCw, AlertCircle, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ReportConfiguration,
  ReportPreviewResponse,
  ReportField,
} from '@/types/report-builder.types'

interface ReportPreviewProps {
  configuration: ReportConfiguration
  previewData: ReportPreviewResponse | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

export function ReportPreview({
  configuration,
  previewData,
  isLoading,
  error,
  onRefresh,
}: ReportPreviewProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const visibleColumns = useMemo(() => {
    return configuration.columns.filter((c) => c.visible)
  }, [configuration.columns])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!previewData?.data || previewData.data.length === 0) return []

    // For charts, we might need to aggregate or transform data
    return previewData.data.slice(0, 20) // Limit for chart performance
  }, [previewData])

  // Get field label
  const getFieldLabel = (fieldId: string) => {
    const column = configuration.columns.find((c) => c.fieldId === fieldId)
    if (column) {
      return isRTL ? column.labelAr || column.label : column.label
    }
    const [, field] = fieldId.split('.')
    return field
  }

  // Render table visualization
  const renderTable = () => {
    if (!previewData?.data || previewData.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Database className="h-12 w-12 mb-4" />
          <p>{t('preview.noData')}</p>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.id} className="whitespace-nowrap">
                  {isRTL ? column.labelAr || column.label : column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.data.map((row, index) => (
              <TableRow key={index}>
                {visibleColumns.map((column) => {
                  const [, field] = column.fieldId.split('.')
                  const value = row[field]
                  return (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {formatCellValue(value)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    )
  }

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? t('common:yes') : t('common:no')
    if (value instanceof Date) return value.toLocaleDateString()
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Render bar chart
  const renderBarChart = () => {
    const { xAxisFieldId, yAxisFieldId, showLegend, showGrid } = configuration.visualization
    if (!xAxisFieldId || !yAxisFieldId) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <p>{t('visualization.settings.xAxis')}</p>
        </div>
      )
    }

    const [, xField] = xAxisFieldId.split('.')
    const [, yField] = yAxisFieldId.split('.')

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xField} tick={{ fontSize: 12 }} reversed={isRTL} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          <Bar dataKey={yField} fill={CHART_COLORS[0]} name={getFieldLabel(yAxisFieldId)} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Render line chart
  const renderLineChart = () => {
    const { xAxisFieldId, yAxisFieldId, showLegend, showGrid } = configuration.visualization
    if (!xAxisFieldId || !yAxisFieldId) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <p>{t('visualization.settings.xAxis')}</p>
        </div>
      )
    }

    const [, xField] = xAxisFieldId.split('.')
    const [, yField] = yAxisFieldId.split('.')

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xField} tick={{ fontSize: 12 }} reversed={isRTL} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={yField}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            name={getFieldLabel(yAxisFieldId)}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Render area chart
  const renderAreaChart = () => {
    const { xAxisFieldId, yAxisFieldId, showLegend, showGrid } = configuration.visualization
    if (!xAxisFieldId || !yAxisFieldId) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <p>{t('visualization.settings.xAxis')}</p>
        </div>
      )
    }

    const [, xField] = xAxisFieldId.split('.')
    const [, yField] = yAxisFieldId.split('.')

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xField} tick={{ fontSize: 12 }} reversed={isRTL} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={yField}
            fill={CHART_COLORS[0]}
            fillOpacity={0.3}
            stroke={CHART_COLORS[0]}
            name={getFieldLabel(yAxisFieldId)}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Render pie chart
  const renderPieChart = () => {
    const { colorFieldId, yAxisFieldId, showLegend, showLabels } = configuration.visualization

    // Transform data for pie chart
    const pieData = useMemo(() => {
      if (!chartData.length) return []

      // Group by colorField and sum yAxisField
      const grouped: Record<string, number> = {}
      const colorField = colorFieldId ? colorFieldId.split('.')[1] : Object.keys(chartData[0])[0]
      const valueField = yAxisFieldId ? yAxisFieldId.split('.')[1] : Object.keys(chartData[0])[1]

      chartData.forEach((item) => {
        const key = String(item[colorField] || 'Unknown')
        const value = Number(item[valueField]) || 1
        grouped[key] = (grouped[key] || 0) + value
      })

      return Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
      }))
    }, [chartData, colorFieldId, yAxisFieldId])

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={
              showLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false
            }
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // Render visualization based on type
  const renderVisualization = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-destructive">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p>{t('preview.error')}</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      )
    }

    if (!previewData) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Database className="h-12 w-12 mb-4" />
          <p>{t('preview.noData')}</p>
        </div>
      )
    }

    switch (configuration.visualization.type) {
      case 'table':
        return renderTable()
      case 'bar_chart':
        return renderBarChart()
      case 'line_chart':
        return renderLineChart()
      case 'area_chart':
        return renderAreaChart()
      case 'pie_chart':
      case 'donut_chart':
        return renderPieChart()
      default:
        return renderTable()
    }
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              {configuration.visualization.type !== 'table'
                ? (isRTL
                    ? configuration.visualization.titleAr
                    : configuration.visualization.title) || t('preview.title')
                : t('preview.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('preview.description')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {previewData && (
              <div className="text-xs text-muted-foreground">
                <Badge variant="outline" className="me-2">
                  {t('preview.rowCount', { count: previewData.totalCount })}
                </Badge>
                <Badge variant="outline">
                  {t('preview.executionTime', { time: previewData.executionTimeMs })}
                </Badge>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 me-2', isLoading && 'animate-spin')} />
              {t('preview.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {renderVisualization()}

        {previewData && previewData.data.length < previewData.totalCount && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {t('preview.limitWarning', { limit: previewData.data.length })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
