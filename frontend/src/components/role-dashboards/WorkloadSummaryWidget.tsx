/**
 * WorkloadSummaryWidget Component
 *
 * Displays a summary of the user's current workload with breakdowns.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Clock,
  Calendar,
  TrendingUp,
  Inbox,
  CheckSquare,
  FileText,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { WorkloadSummaryWidgetProps, WorkloadSummary } from '@/types/role-dashboard.types'

/**
 * Stat item component
 */
function StatItem({
  icon: Icon,
  label,
  value,
  variant = 'default',
  onClick,
}: {
  icon: typeof Clock
  label: string
  value: number
  variant?: 'default' | 'warning' | 'danger' | 'success'
  onClick?: () => void
}) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors w-full',
        onClick && 'hover:bg-muted/50 cursor-pointer',
        !onClick && 'cursor-default',
      )}
    >
      <div className={cn('p-2 rounded-md', variantClasses[variant])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 text-start">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </button>
  )
}

/**
 * Priority breakdown bar
 */
function PriorityBreakdown({ workload }: { workload: WorkloadSummary }) {
  const { t } = useTranslation('role-dashboard')
  const total = workload.totalPending || 1

  const segments = [
    { key: 'urgent', value: workload.byPriority.urgent, color: 'bg-red-500' },
    { key: 'high', value: workload.byPriority.high, color: 'bg-orange-500' },
    { key: 'medium', value: workload.byPriority.medium, color: 'bg-yellow-500' },
    { key: 'low', value: workload.byPriority.low, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('workload.byPriority')}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <div
              key={segment.key}
              className={cn('h-full transition-all', segment.color)}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${t(`priority.${segment.key}`)}: ${segment.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-[10px]">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', segment.color)} />
            <span className="text-muted-foreground">
              {t(`priority.${segment.key}`)}: {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Source breakdown
 */
function SourceBreakdown({
  workload,
  onCategoryClick,
}: {
  workload: WorkloadSummary
  onCategoryClick?: (category: string) => void
}) {
  const { t } = useTranslation('role-dashboard')

  const sources = [
    { key: 'tasks', value: workload.bySource.tasks, icon: CheckSquare, color: 'text-blue-500' },
    {
      key: 'commitments',
      value: workload.bySource.commitments,
      icon: FileText,
      color: 'text-purple-500',
    },
    { key: 'intake', value: workload.bySource.intake, icon: Inbox, color: 'text-green-500' },
    {
      key: 'reviews',
      value: workload.bySource.reviews,
      icon: ClipboardCheck,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">{t('workload.bySource')}</span>
      <div className="grid grid-cols-2 gap-2">
        {sources.map(({ key, value, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => onCategoryClick?.(key)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md border border-border transition-colors',
              onCategoryClick && 'hover:bg-muted/50 cursor-pointer',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className="text-xs text-muted-foreground">{t(`workload.sources.${key}`)}</span>
            <span className="ms-auto text-sm font-medium text-foreground">{value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function WorkloadSummaryWidget({
  workload,
  showBreakdown = true,
  onCategoryClick,
  className,
}: WorkloadSummaryWidgetProps) {
  const { t, i18n } = useTranslation('role-dashboard')
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('workload.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatItem
            icon={AlertTriangle}
            label={t('workload.overdue')}
            value={workload.overdueCount}
            variant={workload.overdueCount > 0 ? 'danger' : 'success'}
            onClick={() => onCategoryClick?.('overdue')}
          />
          <StatItem
            icon={Clock}
            label={t('workload.dueToday')}
            value={workload.dueTodayCount}
            variant={workload.dueTodayCount > 3 ? 'warning' : 'default'}
            onClick={() => onCategoryClick?.('today')}
          />
          <StatItem
            icon={Calendar}
            label={t('workload.dueThisWeek')}
            value={workload.dueThisWeekCount}
            onClick={() => onCategoryClick?.('week')}
          />
          <StatItem
            icon={Inbox}
            label={t('workload.totalPending')}
            value={workload.totalPending}
            onClick={() => onCategoryClick?.('all')}
          />
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('workload.capacityUsed')}</span>
            <span className="font-medium text-foreground">
              {Math.min(100, Math.round((workload.totalPending / 20) * 100))}%
            </span>
          </div>
          <Progress value={Math.min(100, (workload.totalPending / 20) * 100)} className="h-2" />
        </div>

        {/* Breakdowns */}
        {showBreakdown && (
          <>
            <div className="border-t border-border pt-4">
              <PriorityBreakdown workload={workload} />
            </div>
            <div className="border-t border-border pt-4">
              <SourceBreakdown workload={workload} onCategoryClick={onCategoryClick} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkloadSummaryWidget
