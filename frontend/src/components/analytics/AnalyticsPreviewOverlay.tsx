/**
 * Analytics Preview Overlay Component
 * Feature: analytics-preview
 *
 * Shows preview charts with placeholder data in empty analytics sections,
 * explaining what insights users will gain once data is available.
 * Includes 'See example with sample data' button that temporarily loads demo visualizations.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Eye,
  EyeOff,
  Lightbulb,
  X,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type PreviewChartType =
  | 'engagements'
  | 'relationships'
  | 'commitments'
  | 'workload'
  | 'overview'

interface AnalyticsPreviewOverlayProps {
  /** Type of chart being previewed */
  chartType: PreviewChartType
  /** Callback when user clicks to see sample data */
  onShowSampleData?: () => void
  /** Whether sample data is currently being shown */
  showingSampleData?: boolean
  /** Callback to hide sample data */
  onHideSampleData?: () => void
  /** Additional CSS classes */
  className?: string
}

interface ChartPreviewConfig {
  icon: typeof BarChart3
  insights: string[]
  color: string
  bgGradient: string
}

const chartConfigs: Record<PreviewChartType, ChartPreviewConfig> = {
  engagements: {
    icon: LineChart,
    insights: ['engagements.insight1', 'engagements.insight2', 'engagements.insight3'],
    color: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10',
  },
  relationships: {
    icon: PieChart,
    insights: ['relationships.insight1', 'relationships.insight2', 'relationships.insight3'],
    color: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10',
  },
  commitments: {
    icon: BarChart3,
    insights: ['commitments.insight1', 'commitments.insight2', 'commitments.insight3'],
    color: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10',
  },
  workload: {
    icon: TrendingUp,
    insights: ['workload.insight1', 'workload.insight2', 'workload.insight3'],
    color: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10',
  },
  overview: {
    icon: BarChart3,
    insights: ['overview.insight1', 'overview.insight2', 'overview.insight3'],
    color: 'text-gray-600 dark:text-gray-400',
    bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10',
  },
}

/**
 * Analytics Preview Overlay Component
 *
 * Displays a preview overlay when analytics data is empty,
 * explaining what insights users will gain and offering a demo view.
 */
export function AnalyticsPreviewOverlay({
  chartType,
  onShowSampleData,
  showingSampleData = false,
  onHideSampleData,
  className,
}: AnalyticsPreviewOverlayProps) {
  const { t, i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const config = chartConfigs[chartType]
  const Icon = config.icon

  if (showingSampleData) {
    return (
      <Alert
        className={cn(
          'border-dashed border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {t('preview.sampleDataActive')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onHideSampleData}
            className="h-8 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <EyeOff className="h-3.5 w-3.5" />
            {t('preview.hideSampleData')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card
      className={cn('relative overflow-hidden border-dashed border-2', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', config.bgGradient)} />

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-900/80 shadow-sm',
                'sm:h-12 sm:w-12',
              )}
            >
              <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', config.color)} />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                {t(`preview.${chartType}.title`)}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                {t(`preview.${chartType}.description`)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex gap-1">
            <Lightbulb className="h-3 w-3" />
            {t('preview.comingSoon')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Preview placeholder chart */}
        <div className="mb-4 sm:mb-6">
          <PreviewChartPlaceholder chartType={chartType} />
        </div>

        {/* Insights list */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5" />
            {t('preview.insightsYouWillGain')}
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {config.insights.map((insightKey, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                <span
                  className={cn(
                    'mt-1 h-1.5 w-1.5 rounded-full shrink-0',
                    config.color.replace('text-', 'bg-'),
                  )}
                />
                <span>{t(`preview.${insightKey}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action button */}
        {onShowSampleData && (
          <Button
            variant="outline"
            size="default"
            onClick={onShowSampleData}
            className="w-full sm:w-auto h-11 gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('preview.showSampleData')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Preview Chart Placeholder
 *
 * Shows a stylized placeholder visualization representing the chart type
 */
function PreviewChartPlaceholder({ chartType }: { chartType: PreviewChartType }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const config = chartConfigs[chartType]

  // Create placeholder bars/points for visual representation
  const renderPlaceholder = () => {
    switch (chartType) {
      case 'engagements':
        // Line chart placeholder
        return (
          <svg
            viewBox="0 0 200 80"
            className="w-full h-24 sm:h-32"
            style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
          >
            {/* Grid lines */}
            {[20, 40, 60].map((y) => (
              <line
                key={y}
                x1="20"
                y1={y}
                x2="190"
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 4"
              />
            ))}
            {/* Trend line */}
            <path
              d="M 20 60 Q 50 55, 70 45 T 110 40 T 150 30 T 190 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className={config.color.replace('text-', 'stroke-')}
              strokeOpacity="0.6"
            />
            {/* Data points */}
            {[
              [20, 60],
              [50, 52],
              [70, 45],
              [90, 42],
              [110, 40],
              [130, 35],
              [150, 30],
              [170, 28],
              [190, 25],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                className={config.color.replace('text-', 'fill-')}
                fillOpacity="0.6"
              />
            ))}
          </svg>
        )

      case 'relationships':
        // Donut chart placeholder
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#10B981"
              strokeWidth="12"
              strokeDasharray="55 165"
              strokeDashoffset="0"
              strokeOpacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#34D399"
              strokeWidth="12"
              strokeDasharray="70 150"
              strokeDashoffset="-55"
              strokeOpacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="12"
              strokeDasharray="45 175"
              strokeDashoffset="-125"
              strokeOpacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#F97316"
              strokeWidth="12"
              strokeDasharray="30 190"
              strokeDashoffset="-170"
              strokeOpacity="0.5"
            />
          </svg>
        )

      case 'commitments':
        // Stacked bar chart placeholder
        return (
          <div className="flex items-end justify-center gap-2 sm:gap-3 h-24 sm:h-32 px-4">
            {[
              { height: '60%', colors: ['bg-emerald-400/50', 'bg-amber-400/50', 'bg-red-400/50'] },
              { height: '75%', colors: ['bg-emerald-400/50', 'bg-amber-400/50', 'bg-gray-400/50'] },
              { height: '50%', colors: ['bg-emerald-400/50', 'bg-gray-400/50'] },
              {
                height: '85%',
                colors: ['bg-emerald-400/50', 'bg-amber-400/50', 'bg-red-400/50', 'bg-gray-400/50'],
              },
              { height: '65%', colors: ['bg-emerald-400/50', 'bg-amber-400/50'] },
            ].map((bar, i) => (
              <div
                key={i}
                className="flex-1 max-w-12 flex flex-col gap-0.5 rounded-t"
                style={{ height: bar.height }}
              >
                {bar.colors.map((color, j) => (
                  <div key={j} className={cn('flex-1 rounded-sm', color)} />
                ))}
              </div>
            ))}
          </div>
        )

      case 'workload':
        // Horizontal bar chart placeholder
        return (
          <div className="space-y-2 sm:space-y-3 px-4">
            {[90, 75, 60, 45, 30].map((width, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div
                  className="h-3 sm:h-4 rounded bg-purple-400/50"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        )

      case 'overview':
      default:
        // Mixed placeholder
        return (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 px-4">
            {/* Mini line chart */}
            <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 flex items-center justify-center">
              <svg viewBox="0 0 60 30" className="w-12 h-6">
                <path
                  d="M 5 20 Q 15 25, 25 15 T 45 12 T 55 8"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
              </svg>
            </div>
            {/* Mini donut */}
            <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-emerald-400/50 border-t-emerald-200/30" />
            </div>
            {/* Mini bars */}
            <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 flex items-end justify-center gap-1 pb-2">
              {[40, 60, 35, 80, 55].map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-t bg-amber-400/50"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            {/* Mini metric */}
            <div className="h-16 sm:h-20 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 flex flex-col items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-purple-600/50 dark:text-purple-400/50">
                85%
              </span>
              <span className="text-[10px] text-purple-500/50">Sample</span>
            </div>
          </div>
        )
    }
  }

  return renderPlaceholder()
}

export default AnalyticsPreviewOverlay
