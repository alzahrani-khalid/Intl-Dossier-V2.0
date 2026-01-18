/**
 * ActivityTimelineItem Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T028
 *
 * Displays a single activity in the dossier timeline.
 * Shows type icon, status badge, and navigates to detail on click.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  CheckSquare,
  FileCheck,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { TimelineActivity } from '@/hooks/useDossierActivityTimeline'

// ============================================================================
// Type Icons
// ============================================================================

const typeIcons = {
  task: CheckSquare,
  commitment: FileCheck,
  intake: ClipboardList,
} as const

// ============================================================================
// Status Colors
// ============================================================================

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

// ============================================================================
// Priority Colors
// ============================================================================

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
  critical: 'text-red-600',
}

// ============================================================================
// Props
// ============================================================================

export interface ActivityTimelineItemProps {
  /**
   * The activity to display.
   */
  activity: TimelineActivity
  /**
   * Whether this is the first item in the list.
   */
  isFirst?: boolean
  /**
   * Whether this is the last item in the list.
   */
  isLast?: boolean
  /**
   * Additional CSS classes.
   */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ActivityTimelineItem({
  activity,
  isFirst = false,
  isLast = false,
  className,
}: ActivityTimelineItemProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Get icon for type
  const TypeIcon = typeIcons[activity.work_item_type] || CheckSquare

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return t('timeline.minutesAgo', '{{count}} min ago', { count: diffMinutes })
    }
    if (diffHours < 24) {
      return t('timeline.hoursAgo', '{{count}}h ago', { count: diffHours })
    }
    if (diffDays < 7) {
      return t('timeline.daysAgo', '{{count}}d ago', { count: diffDays })
    }
    return formatDate(dateStr)
  }

  // Navigate to detail
  const handleClick = () => {
    switch (activity.work_item_type) {
      case 'task':
        navigate({ to: '/tasks/$id', params: { id: activity.work_item_id } })
        break
      case 'commitment':
        // Commitments open in a drawer via query param (id for deep-linking)
        navigate({
          to: '/commitments',
          search: { id: activity.work_item_id },
        })
        break
      case 'intake':
        navigate({ to: '/intake/tickets/$id', params: { id: activity.work_item_id } })
        break
    }
  }

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-colors hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      role="button"
      aria-label={`${t(`timeline.type.${activity.work_item_type}`, activity.work_item_type)}: ${activity.activity_title}`}
    >
      <div className="flex items-start gap-3">
        {/* Timeline Line & Icon */}
        <div className="relative flex flex-col items-center">
          {/* Vertical line above */}
          {!isFirst && (
            <div className={cn('absolute top-0 w-px h-3 -translate-y-full', 'bg-border')} />
          )}

          {/* Type Icon */}
          <div
            className={cn(
              'flex items-center justify-center size-10 rounded-full shrink-0',
              'bg-muted border-2',
              activity.is_overdue && 'border-red-500',
              !activity.is_overdue && 'border-transparent',
            )}
          >
            <TypeIcon
              className={cn(
                'size-5',
                activity.work_item_type === 'task' && 'text-blue-500',
                activity.work_item_type === 'commitment' && 'text-purple-500',
                activity.work_item_type === 'intake' && 'text-green-500',
              )}
            />
          </div>

          {/* Vertical line below */}
          {!isLast && (
            <div className={cn('absolute bottom-0 w-px h-full translate-y-full', 'bg-border')} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight truncate">
              {activity.activity_title || t('timeline.noTitle', 'Untitled')}
            </h4>
            <ChevronRight
              className={cn('size-4 shrink-0 text-muted-foreground', isRTL && 'rotate-180')}
            />
          </div>

          {/* Type and Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {t(`timeline.type.${activity.work_item_type}`, activity.work_item_type)}
            </Badge>
            <Badge
              variant="secondary"
              className={cn('text-xs', statusColors[activity.status] || '')}
            >
              {t(`timeline.status.${activity.status}`, activity.status)}
            </Badge>
            {activity.priority && activity.priority !== 'medium' && (
              <span className={cn('text-xs', priorityColors[activity.priority])}>
                {t(`timeline.priority.${activity.priority}`, activity.priority)}
              </span>
            )}
          </div>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {/* Overdue Warning */}
            {activity.is_overdue && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="size-3" />
                {t('timeline.overdue', 'Overdue')}
              </span>
            )}

            {/* Due Date */}
            {!activity.is_overdue && (activity.due_date || activity.sla_deadline) && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(activity.due_date || activity.sla_deadline)}
              </span>
            )}

            {/* Updated Time */}
            <span className="ms-auto">{formatRelativeTime(activity.updated_at)}</span>
          </div>

          {/* Inheritance Info */}
          {activity.inheritance_source !== 'direct' && (
            <p className="text-xs text-muted-foreground italic">
              {t('timeline.inheritedVia', 'via')}{' '}
              {t(
                `timeline.inheritanceSource.${activity.inheritance_source}`,
                activity.inheritance_source,
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ActivityTimelineItem
