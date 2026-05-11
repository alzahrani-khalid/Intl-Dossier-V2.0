/**
 * Work Item Card Component
 * Individual card for a work item
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  FileCheck,
  ListChecks,
  Inbox,
  AlertTriangle,
  Calendar,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UnifiedWorkItem, WorkSource, TrackingType } from '@/types/unified-work.types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useDirection } from '@/hooks/useDirection'

interface WorkItemCardProps {
  item: UnifiedWorkItem
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const { t } = useTranslation('my-work')
  const { isRTL } = useDirection()
  const locale = isRTL ? ar : enUS

  // Source icon and color
  const sourceConfig: Record<WorkSource, { icon: LucideIcon; color: string; label: string }> = {
    commitment: {
      icon: FileCheck,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      label: t('source.commitment', 'Commitment'),
    },
    task: {
      icon: ListChecks,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      label: t('source.task', 'Task'),
    },
    intake: {
      icon: Inbox,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      label: t('source.intake', 'Intake'),
    },
  }

  // Tracking type badge
  const trackingTypeConfig: Record<TrackingType, { color: string; label: string }> = {
    delivery: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      label: t('trackingType.delivery', 'Delivery'),
    },
    follow_up: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      label: t('trackingType.followUp', 'Follow-up'),
    },
    sla: {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      label: t('trackingType.sla', 'SLA'),
    },
  }

  // Priority badge
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: {
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      label: t('priority.low', 'Low'),
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      label: t('priority.medium', 'Medium'),
    },
    high: {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      label: t('priority.high', 'High'),
    },
    critical: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      label: t('priority.critical', 'Critical'),
    },
    urgent: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      label: t('priority.urgent', 'Urgent'),
    },
  }

  // Format deadline
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null

    const date = new Date(deadline)
    const isPastDue = isPast(date)

    if (isToday(date)) {
      return { text: t('deadline.today', 'Today'), urgent: true }
    }
    if (isTomorrow(date)) {
      return { text: t('deadline.tomorrow', 'Tomorrow'), urgent: true }
    }
    if (isPastDue) {
      return {
        text: formatDistanceToNow(date, { addSuffix: true, locale }),
        urgent: true,
      }
    }

    return {
      text: format(date, 'MMM d', { locale }),
      urgent: false,
    }
  }

  const sourceInfo = sourceConfig[item.source]
  const trackingInfo = trackingTypeConfig[item.tracking_type]
  const priorityInfo = priorityConfig[item.priority] ?? priorityConfig.medium!
  const deadlineInfo = formatDeadline(item.deadline)
  const Icon = sourceInfo.icon

  // Build link URL based on source
  const getItemLink = () => {
    switch (item.source) {
      case 'commitment':
        return `/commitments?id=${item.id}`
      case 'task':
        return `/tasks/${item.id}`
      case 'intake':
        return `/intake/tickets/${item.id}`
      default:
        return '#'
    }
  }

  const itemLink = getItemLink()

  return (
    <Link to={itemLink} className="block">
      <Card
        className={cn(
          'transition-colors hover:bg-accent/50 cursor-pointer border-border/60',
          item.is_overdue && 'border-red-300 dark:border-red-800',
        )}
      >
        <CardContent className="px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Source Icon */}
            <div className={cn('p-1.5 rounded-md shrink-0', sourceInfo.color)}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Title row */}
              <span className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-1 text-start block">
                {item.title}
              </span>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[11px] leading-none px-1.5 py-0">
                  {sourceInfo.label}
                </Badge>

                <Badge
                  className={cn('text-[11px] leading-none px-1.5 py-0', trackingInfo.color)}
                  variant="secondary"
                >
                  {trackingInfo.label}
                </Badge>

                <Badge
                  className={cn('text-[11px] leading-none px-1.5 py-0', priorityInfo.color)}
                  variant="secondary"
                >
                  {priorityInfo.label}
                </Badge>

                {item.is_overdue && (
                  <Badge
                    variant="destructive"
                    className="text-[11px] leading-none px-1.5 py-0 gap-0.5"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {t('status.overdue', 'Overdue')}
                  </Badge>
                )}

                {deadlineInfo && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px] leading-none px-1.5 py-0 gap-0.5',
                      deadlineInfo.urgent &&
                        'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400',
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {deadlineInfo.text}
                  </Badge>
                )}

                {item.days_until_due !== null && !item.is_overdue && (
                  <span className="hidden sm:inline text-[11px] text-muted-foreground">
                    {item.days_until_due === 0
                      ? t('deadline.dueToday', 'Due today')
                      : item.days_until_due === 1
                        ? t('deadline.dueTomorrow', 'Due tomorrow')
                        : t('deadline.dueInDays', { count: item.days_until_due })}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <ChevronRight className={cn('h-4 w-4 text-muted-foreground shrink-0 icon-flip')} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
