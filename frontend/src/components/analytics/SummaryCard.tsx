/**
 * Summary Card Component
 * Feature: analytics-dashboard
 *
 * Displays a metric with its value, change indicator, and optional trend
 */

import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  format?: 'number' | 'percentage' | 'score'
  className?: string
}

export function SummaryCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  format = 'number',
  className,
}: SummaryCardProps) {
  const { i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'score':
        return val.toFixed(0)
      default:
        return val.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')
    }
  }

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null
    if (change > 1) return <TrendingUp className="h-4 w-4" />
    if (change < -1) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-gray-500'
    if (change > 1) return 'text-emerald-600 dark:text-emerald-400'
    if (change < -1) return 'text-red-600 dark:text-red-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div
      className={cn('rounded-lg border bg-card p-4 sm:p-6', 'flex flex-col gap-2', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl sm:text-3xl font-bold">{formatValue(value)}</span>
      </div>

      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          {changeLabel && <span className="text-muted-foreground ms-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
