/**
 * ChartWidget Component
 *
 * Displays various chart types (line, bar, pie, donut, area)
 * with responsive sizing and RTL support.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChartWidgetConfig, ChartData } from '@/types/dashboard-widget.types'

interface ChartWidgetProps {
  config: ChartWidgetConfig
  data: ChartData | null
  isLoading?: boolean
}

// Fallback colors if CSS variables not available
const FALLBACK_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
]

/**
 * Simple Bar Chart component
 */
function BarChart({
  data,
  showLegend,
  colors,
  isRTL,
}: {
  data: ChartData
  showLegend: boolean
  colors: string[]
  isRTL: boolean
}) {
  const { labels, datasets } = data
  const maxValue = Math.max(...datasets.flatMap((d) => d.data))

  return (
    <div className="h-full flex flex-col">
      {/* Chart Area */}
      <div className="flex-1 flex items-end gap-1 sm:gap-2">
        {labels.map((label, index) => (
          <div
            key={label}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ order: isRTL ? labels.length - index : index }}
          >
            {/* Bars for each dataset */}
            <div className="w-full flex justify-center gap-0.5">
              {datasets.map((dataset, datasetIndex) => (
                <div
                  key={dataset.label}
                  className="flex-1 max-w-8 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${((dataset.data[index] ?? 0) / maxValue) * 100}%`,
                    minHeight: (dataset.data[index] ?? 0) > 0 ? '4px' : '0',
                    backgroundColor:
                      typeof dataset.backgroundColor === 'string'
                        ? dataset.backgroundColor
                        : Array.isArray(dataset.backgroundColor)
                          ? dataset.backgroundColor[index]
                          : colors[datasetIndex % colors.length],
                  }}
                  title={`${dataset.label}: ${dataset.data[index]}`}
                />
              ))}
            </div>
            {/* Label */}
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center truncate w-full">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      {showLegend && datasets.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 pt-2 border-t">
          {datasets.map((dataset, index) => (
            <div key={dataset.label} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor:
                    typeof dataset.backgroundColor === 'string'
                      ? dataset.backgroundColor
                      : colors[index % colors.length],
                }}
              />
              <span className="text-xs text-muted-foreground">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Simple Pie/Donut Chart component
 */
function PieChart({
  data,
  showLegend,
  colors,
  isDonut = false,
}: {
  data: ChartData
  showLegend: boolean
  colors: string[]
  isDonut?: boolean
}) {
  const { labels, datasets } = data
  const values = datasets[0]?.data || []
  const total = values.reduce((sum, v) => sum + v, 0)

  // Calculate pie segments
  const segments = useMemo(() => {
    let cumulativeAngle = -90 // Start from top
    return values.map((value, index) => {
      const percentage = (value / total) * 100
      const angle = (value / total) * 360
      const startAngle = cumulativeAngle
      cumulativeAngle += angle

      // Calculate path for pie segment
      const startRad = (startAngle * Math.PI) / 180
      const endRad = ((startAngle + angle) * Math.PI) / 180
      const largeArc = angle > 180 ? 1 : 0

      const innerRadius = isDonut ? 35 : 0
      const outerRadius = 50

      // Outer arc
      const x1 = 50 + outerRadius * Math.cos(startRad)
      const y1 = 50 + outerRadius * Math.sin(startRad)
      const x2 = 50 + outerRadius * Math.cos(endRad)
      const y2 = 50 + outerRadius * Math.sin(endRad)

      // Inner arc (for donut)
      const x3 = 50 + innerRadius * Math.cos(endRad)
      const y3 = 50 + innerRadius * Math.sin(endRad)
      const x4 = 50 + innerRadius * Math.cos(startRad)
      const y4 = 50 + innerRadius * Math.sin(startRad)

      let path: string
      if (isDonut) {
        path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
      } else {
        path = `M 50 50 L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`
      }

      const dataset0 = datasets[0]
      return {
        path,
        color:
          typeof dataset0?.backgroundColor === 'string'
            ? dataset0.backgroundColor
            : Array.isArray(dataset0?.backgroundColor)
              ? (dataset0?.backgroundColor?.[index] ?? colors[index % colors.length])
              : colors[index % colors.length],
        label: labels[index],
        value,
        percentage,
      }
    })
  }, [values, total, labels, datasets, colors, isDonut])

  return (
    <div className="h-full flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
      {/* Pie SVG */}
      <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            >
              <title>
                {segment.label}: {segment.value} ({segment.percentage.toFixed(1)}%)
              </title>
            </path>
          ))}
          {/* Center text for donut */}
          {isDonut && (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-foreground"
            >
              {total}
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap sm:flex-col gap-1.5 sm:gap-2 justify-center">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {segment.label}
              </span>
              <span className="text-xs font-medium ms-auto">{segment.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Simple Line/Area Chart component
 */
function LineChart({
  data,
  showGrid,
  showLegend,
  colors,
  isArea = false,
  isRTL,
}: {
  data: ChartData
  showGrid: boolean
  showLegend: boolean
  colors: string[]
  isArea?: boolean
  isRTL: boolean
}) {
  const { labels, datasets } = data
  const allValues = datasets.flatMap((d) => d.data)
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue || 1

  const width = 100
  const height = 60
  const padding = { top: 4, right: 4, bottom: 4, left: 4 }

  const getPath = (values: number[]) => {
    const points = values.map((value, index) => {
      const x =
        padding.left + (index / (values.length - 1)) * (width - padding.left - padding.right)
      const y =
        height -
        padding.bottom -
        ((value - minValue) / range) * (height - padding.top - padding.bottom)
      return { x, y }
    })

    const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    const areaPath =
      lastPoint && firstPoint
        ? `${linePath} L ${lastPoint.x},${height - padding.bottom} L ${firstPoint.x},${height - padding.bottom} Z`
        : linePath

    return { linePath, areaPath }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chart Area */}
      <div className="flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          style={{ direction: 'ltr' }}
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="text-border" opacity="0.3">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + ratio * (height - padding.top - padding.bottom)
                return (
                  <line
                    key={ratio}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="2,2"
                  />
                )
              })}
            </g>
          )}

          {/* Data lines/areas */}
          {datasets.map((dataset, index) => {
            const { linePath, areaPath } = getPath(dataset.data)
            const color =
              dataset.borderColor ||
              (typeof dataset.backgroundColor === 'string'
                ? dataset.backgroundColor
                : colors[index % colors.length])

            return (
              <g key={dataset.label}>
                {isArea && <path d={areaPath} fill={color} opacity="0.2" />}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {dataset.data.map((value, pointIndex) => {
                  const x =
                    padding.left +
                    (pointIndex / (dataset.data.length - 1)) *
                      (width - padding.left - padding.right)
                  const y =
                    height -
                    padding.bottom -
                    ((value - minValue) / range) * (height - padding.top - padding.bottom)
                  return (
                    <circle
                      key={pointIndex}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={color}
                      className="hover:r-3 transition-all"
                    >
                      <title>
                        {labels[pointIndex]}: {value}
                      </title>
                    </circle>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-1 mt-1">
        {labels.length <= 7 ? (
          labels.map((label, index) => (
            <span
              key={index}
              className="text-[10px] text-muted-foreground"
              style={{ order: isRTL ? labels.length - index : index }}
            >
              {label}
            </span>
          ))
        ) : (
          <>
            <span className="text-[10px] text-muted-foreground">{labels[0]}</span>
            <span className="text-[10px] text-muted-foreground">{labels[labels.length - 1]}</span>
          </>
        )}
      </div>

      {/* Legend */}
      {showLegend && datasets.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 pt-2 border-t">
          {datasets.map((dataset, index) => (
            <div key={dataset.label} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor:
                    dataset.borderColor ||
                    (typeof dataset.backgroundColor === 'string'
                      ? dataset.backgroundColor
                      : colors[index % colors.length]),
                }}
              />
              <span className="text-xs text-muted-foreground">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChartWidget({ config, data, isLoading }: ChartWidgetProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const {
    settings: { chartType, showLegend, showGrid, colors: customColors },
  } = config

  const colors = customColors || FALLBACK_COLORS

  // Loading skeleton
  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="w-full h-full bg-muted rounded" />
      </div>
    )
  }

  // Empty state
  if (!data.datasets.length || !data.labels.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        <p>{t('emptyStates.noData')}</p>
      </div>
    )
  }

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChart data={data} showLegend={showLegend} colors={colors} isRTL={isRTL} />
      case 'pie':
        return <PieChart data={data} showLegend={showLegend} colors={colors} />
      case 'donut':
        return <PieChart data={data} showLegend={showLegend} colors={colors} isDonut />
      case 'area':
        return (
          <LineChart
            data={data}
            showGrid={showGrid}
            showLegend={showLegend}
            colors={colors}
            isArea
            isRTL={isRTL}
          />
        )
      case 'line':
      case 'sparkline':
      default:
        return (
          <LineChart
            data={data}
            showGrid={showGrid}
            showLegend={showLegend}
            colors={colors}
            isRTL={isRTL}
          />
        )
    }
  }

  return <div className="h-full">{renderChart()}</div>
}

export default ChartWidget
