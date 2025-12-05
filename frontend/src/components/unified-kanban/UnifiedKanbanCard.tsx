/**
 * UnifiedKanbanCard - Card content for work items
 * Feature: 034-unified-kanban
 *
 * Displays a single work item with:
 * - Source badge (task/commitment/intake)
 * - Priority indicator
 * - Title and deadline
 * - Assignee avatar
 * - Overdue indicator
 */

import { useTranslation } from 'react-i18next'
import { Calendar, User, AlertCircle, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { WorkItem } from '@/types/work-item.types'
import { getSourceBadgeColors, getPriorityColor } from './utils/column-definitions'

interface CardContentProps {
  item: WorkItem
  showDragHandle?: boolean
}

/**
 * Card content component - used inside KanbanCard
 */
export function UnifiedKanbanCardContent({ item, showDragHandle = true }: CardContentProps) {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'

  const sourceBadge = getSourceBadgeColors(item.source)
  const priorityColor = getPriorityColor(item.priority)

  // Format deadline display
  const getDeadlineDisplay = () => {
    if (!item.deadline) return null

    if (item.is_overdue) {
      return {
        text: t('card.overdue'),
        className: 'text-red-600 font-medium',
      }
    }

    if (item.days_until_due === 0) {
      return {
        text: t('card.dueToday'),
        className: 'text-amber-600 font-medium',
      }
    }

    if (item.days_until_due === 1) {
      return {
        text: t('card.dueTomorrow'),
        className: 'text-amber-500',
      }
    }

    if (item.days_until_due !== null && item.days_until_due > 1) {
      return {
        text: t('card.dueIn', { count: item.days_until_due }),
        className: 'text-muted-foreground',
      }
    }

    return null
  }

  const deadlineDisplay = getDeadlineDisplay()

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Priority indicator bar */}
      <div
        className={cn(
          'absolute -top-3 sm:-top-4 h-1 w-full rounded-t-lg',
          priorityColor,
          'left-0 right-0',
        )}
        style={{ left: '-12px', right: '-12px', width: 'calc(100% + 24px)' }}
      />

      {/* Drag handle - visible on hover */}
      {showDragHandle && (
        <div
          className={cn(
            'absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground',
            isRTL ? 'start-0' : 'end-0',
          )}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {/* Source badge and overdue indicator */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className={cn('text-xs', sourceBadge.bg, sourceBadge.text)}>
            {t(`sources.${item.source}`)}
          </Badge>

          {item.is_overdue && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium line-clamp-2 text-start">
          {isRTL && item.title_ar ? item.title_ar : item.title}
        </h4>

        {/* Footer: Deadline and Assignee */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Deadline */}
          {deadlineDisplay ? (
            <div className={cn('flex items-center gap-1 text-xs', deadlineDisplay.className)}>
              <Calendar className="h-3 w-3" />
              <span>{deadlineDisplay.text}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 opacity-50" />
              <span>{t('card.noDueDate')}</span>
            </div>
          )}

          {/* Assignee */}
          {item.assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.assignee.avatar_url || undefined} alt={item.assignee.name} />
              <AvatarFallback className="text-xs">{getInitials(item.assignee.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for loading state
 */
export function UnifiedKanbanCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="flex justify-between pt-1">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-6 w-6 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * @deprecated Use UnifiedKanbanCardContent with KanbanCard from ui/kanban instead
 * Legacy card component for backwards compatibility
 */
export function UnifiedKanbanCard({
  item,
  isDragging = false,
  onClick,
}: {
  item: WorkItem
  isDragging?: boolean
  onClick?: (item: WorkItem) => void
}) {
  const { i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-3 shadow-sm transition-all',
        'hover:shadow-md hover:border-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'cursor-grab active:cursor-grabbing',
        'min-h-[88px]',
        isDragging ? 'opacity-50 shadow-lg scale-105' : '',
        item.is_overdue ? 'border-red-200 bg-red-50/50' : '',
      )}
      onClick={() => onClick?.(item)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <UnifiedKanbanCardContent item={item} />
    </div>
  )
}
