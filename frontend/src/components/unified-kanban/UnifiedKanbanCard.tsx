/**
 * UnifiedKanbanCard - Clean card content for work items
 * Feature: 034-unified-kanban (redesigned)
 *
 * Layout:
 * [Source badge (outline)] [Priority badge (outline with dot)]
 * [Title - font-semibold, 2 lines]
 * <Separator />
 * [Calendar icon + deadline text]  [Avatar]
 */

import { useTranslation } from 'react-i18next'
import { Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { WorkItem } from '@/types/work-item.types'
import { getSourceBadgeColors, getPriorityColor } from './utils/column-definitions'

interface CardContentProps {
  item: WorkItem
}

/**
 * Card content component — clean design with outline badges and separator
 */
export function UnifiedKanbanCardContent({ item }: CardContentProps) {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'

  const sourceClasses = getSourceBadgeColors(item.source)
  const priorityDotColor = getPriorityColor(item.priority)

  // Format deadline display
  const getDeadlineDisplay = () => {
    if (!item.deadline) return null

    if (item.is_overdue) {
      return {
        text: t('card.overdue'),
        className: 'text-red-600 dark:text-red-400 font-medium',
      }
    }

    if (item.days_until_due === 0) {
      return {
        text: t('card.dueToday'),
        className: 'text-amber-600 dark:text-amber-400 font-medium',
      }
    }

    if (item.days_until_due === 1) {
      return {
        text: t('card.dueTomorrow'),
        className: 'text-amber-500 dark:text-amber-400',
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
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Row 1: Source + Priority badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant="outline" className={cn('text-xs font-normal', sourceClasses)}>
          {t(`sources.${item.source}`)}
        </Badge>

        <Badge variant="outline" className="text-xs font-normal gap-1.5">
          <span className={cn('size-1.5 rounded-full shrink-0', priorityDotColor)} />
          {t(`priority.${item.priority}`)}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold line-clamp-2 text-start mb-3">
        {isRTL && item.title_ar ? item.title_ar : item.title}
      </h4>

      <Separator className="mb-3" />

      {/* Footer: Deadline and Assignee */}
      <div className="flex items-center justify-between gap-2">
        {/* Deadline */}
        {deadlineDisplay ? (
          <div className={cn('flex items-center gap-1 text-xs', deadlineDisplay.className)}>
            <Calendar className="size-3 shrink-0" />
            <span>{deadlineDisplay.text}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3 opacity-50 shrink-0" />
            <span>{t('card.noDueDate')}</span>
          </div>
        )}

        {/* Assignee */}
        {item.assignee ? (
          <Avatar className="size-6 shrink-0">
            <AvatarImage src={item.assignee.avatar_url || undefined} alt={item.assignee.name} />
            <AvatarFallback className="text-xs">{getInitials(item.assignee.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3.5 shrink-0" />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Skeleton for loading state
 */
export function UnifiedKanbanCardSkeleton() {
  return (
    <div className="rounded-lg bg-card p-3 animate-pulse">
      <div className="flex gap-2 mb-2">
        <div className="h-5 w-14 bg-muted rounded" />
        <div className="h-5 w-16 bg-muted rounded ms-auto" />
      </div>
      <div className="h-4 w-full bg-muted rounded mb-1" />
      <div className="h-4 w-3/4 bg-muted rounded mb-3" />
      <div className="h-px bg-muted mb-3" />
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="size-6 bg-muted rounded-full" />
      </div>
    </div>
  )
}
