/**
 * PendingActionsWidget Component
 *
 * Displays pending actions for the current user with priority indicators.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  ClipboardList,
  Users,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  PendingActionsWidgetProps,
  PendingAction,
  EntityType,
} from '@/types/role-dashboard.types'

/**
 * Get icon for entity type
 */
function getEntityIcon(entityType: EntityType) {
  const icons: Record<EntityType, typeof FileText> = {
    dossier: FileText,
    engagement: Users,
    commitment: ClipboardList,
    task: CheckCircle2,
    intake: ClipboardList,
    document: FileText,
    mou: FileText,
    brief: FileText,
    position: Users,
    forum: Users,
    working_group: Users,
    calendar_event: Calendar,
  }
  return icons[entityType] || FileText
}

/**
 * Get priority color classes
 */
function getPriorityClasses(priority: PendingAction['priority']) {
  const classes: Record<typeof priority, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  return classes[priority]
}

/**
 * Single action item component
 */
function ActionItem({
  action,
  isRTL,
  onClick,
}: {
  action: PendingAction
  isRTL: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation('role-dashboard')
  const Icon = getEntityIcon(action.entityType)

  const formattedDate = action.dueDate
    ? new Date(action.dueDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Link
      to={action.route}
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        action.isOverdue
          ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
          : 'border-border bg-card',
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-md',
          action.isOverdue
            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {t(action.titleKey, action.description)}
          </p>
          <Badge
            variant="secondary"
            className={cn('flex-shrink-0 text-[10px]', getPriorityClasses(action.priority))}
          >
            {t(`priority.${action.priority}`)}
          </Badge>
        </div>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{action.description}</p>

        {formattedDate && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {action.isOverdue ? (
              <AlertCircle className="h-3 w-3 text-red-500" />
            ) : (
              <Clock className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={action.isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}
            >
              {action.isOverdue ? t('overdue') : t('dueOn')} {formattedDate}
            </span>
          </div>
        )}
      </div>

      <ChevronRight
        className={cn('h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5', isRTL && 'rotate-180')}
      />
    </Link>
  )
}

export function PendingActionsWidget({
  actions,
  maxItems = 5,
  showViewAll = true,
  onActionClick,
  onViewAll,
  className,
}: PendingActionsWidgetProps) {
  const { t, i18n } = useTranslation('role-dashboard')
  const isRTL = i18n.language === 'ar'

  const visibleActions = actions.slice(0, maxItems)
  const overdueCount = actions.filter((a) => a.isOverdue).length
  const hasMore = actions.length > maxItems

  if (actions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{t('pendingActions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
            <p className="text-sm font-medium text-foreground">{t('pendingActions.allClear')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pendingActions.noPendingActions')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg">{t('pendingActions.title')}</CardTitle>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {overdueCount} {t('pendingActions.overdue')}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {actions.length} {t('pendingActions.total')}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            isRTL={isRTL}
            onClick={() => onActionClick?.(action)}
          />
        ))}

        {showViewAll && hasMore && (
          <Button variant="ghost" className="w-full mt-2 text-xs" onClick={onViewAll}>
            {t('pendingActions.viewAll', { count: actions.length - maxItems })}
            <ChevronRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default PendingActionsWidget
