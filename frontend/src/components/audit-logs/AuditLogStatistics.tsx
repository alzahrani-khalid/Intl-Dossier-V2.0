/**
 * Audit Log Statistics Component
 *
 * Displays statistics and analytics for audit logs:
 * - Total events count
 * - Events by operation type
 * - Events by table (top 5)
 *
 * Mobile-first and RTL-ready
 */

import { useTranslation } from 'react-i18next'
import { BarChart3, Plus, Edit3, Trash2, Database, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditLogStatistics } from '@/hooks/useAuditLogs'

// =============================================
// CONFIGURATION
// =============================================

const OPERATION_ICONS: Record<string, typeof Plus> = {
  INSERT: Plus,
  UPDATE: Edit3,
  DELETE: Trash2,
}

const OPERATION_COLORS: Record<string, string> = {
  INSERT: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  UPDATE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  DELETE: 'text-red-600 bg-red-100 dark:bg-red-900/30',
}

// =============================================
// PROPS
// =============================================

interface AuditLogStatisticsProps {
  dateFrom?: string
  dateTo?: string
  className?: string
}

// =============================================
// COMPONENT
// =============================================

export function AuditLogStatistics({ dateFrom, dateTo, className }: AuditLogStatisticsProps) {
  const { t, i18n } = useTranslation('audit-logs')
  const isRTL = i18n.language === 'ar'

  const { statistics, isLoading, error } = useAuditLogStatistics(dateFrom, dateTo)

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {t('statistics.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !statistics) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {t('statistics.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('statistics.no_data')}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get top 5 tables by event count
  const topTables = statistics.by_table
    ? [...statistics.by_table].sort((a, b) => b.count - a.count).slice(0, 5)
    : []

  // Calculate max for bar width
  const maxTableCount = topTables.length > 0 ? topTables[0].count : 1

  return (
    <Card className={cn('', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          {t('statistics.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('statistics.period')}:{' '}
          {new Date(statistics.period.from).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')} -{' '}
          {new Date(statistics.period.to).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Events */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-3xl font-bold text-primary">
            {statistics.total_events.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
          </div>
          <div className="text-sm text-muted-foreground">{t('statistics.total_events')}</div>
        </div>

        {/* By Operation */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t('statistics.by_operation')}</h4>
          <div className="grid grid-cols-3 gap-3">
            {statistics.by_operation.map((item) => {
              const Icon = OPERATION_ICONS[item.operation] || Database
              const colorClass = OPERATION_COLORS[item.operation] || 'text-gray-600 bg-gray-100'

              return (
                <div
                  key={item.operation}
                  className={cn('flex flex-col items-center p-3 rounded-lg', colorClass)}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <div className="text-lg font-bold">
                    {item.count.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </div>
                  <div className="text-xs">{t(`operations.${item.operation}`, item.operation)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Table */}
        {topTables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">{t('statistics.by_table')}</h4>
            <div className="space-y-2">
              {topTables.map((item, index) => (
                <div key={item.table} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="min-w-[100px] justify-center font-mono text-xs"
                  >
                    {t(`tables.${item.table}`, item.table)}
                  </Badge>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        index === 0 && 'bg-primary',
                        index === 1 && 'bg-primary/80',
                        index === 2 && 'bg-primary/60',
                        index === 3 && 'bg-primary/40',
                        index === 4 && 'bg-primary/20',
                      )}
                      style={{
                        width: `${(item.count / maxTableCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono min-w-[60px] text-end">
                    {item.count.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AuditLogStatistics
