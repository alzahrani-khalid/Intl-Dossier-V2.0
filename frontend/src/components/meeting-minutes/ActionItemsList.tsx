/**
 * Action Items List
 * Feature: meeting-minutes-capture
 *
 * Displays and manages action items from meeting minutes.
 * Supports converting to commitments/tasks.
 * Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  PauseCircle,
  User,
  Calendar,
  Sparkles,
  Link2,
  MoreVertical,
  Trash2,
  Edit,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type {
  MeetingActionItem,
  ActionItemStatus,
  ActionItemPriority,
} from '@/types/meeting-minutes.types'
import { PRIORITY_COLORS, ACTION_ITEM_STATUS_COLORS } from '@/types/meeting-minutes.types'

interface ActionItemsListProps {
  items: MeetingActionItem[]
  minutesId: string
  dossierId?: string
  onAddItem?: () => void
  onEditItem?: (item: MeetingActionItem) => void
  onDeleteItem?: (item: MeetingActionItem) => void
  onUpdateStatus?: (item: MeetingActionItem, status: ActionItemStatus) => void
  onConvertToCommitment?: (item: MeetingActionItem) => void
  onConvertToTask?: (item: MeetingActionItem) => void
  isLoading?: boolean
  className?: string
}

const statusIcons: Record<ActionItemStatus, React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
  deferred: PauseCircle,
}

export function ActionItemsList({
  items,
  minutesId,
  dossierId,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  onConvertToCommitment,
  onConvertToTask,
  isLoading,
  className,
}: ActionItemsListProps) {
  const { t, i18n } = useTranslation('meeting-minutes')
  const isRTL = i18n.language === 'ar'

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatusIcon = (status: ActionItemStatus) => {
    const Icon = statusIcons[status]
    return Icon
  }

  const getStatusColor = (status: ActionItemStatus) => {
    return ACTION_ITEM_STATUS_COLORS[status] || ACTION_ITEM_STATUS_COLORS.pending
  }

  const getPriorityColor = (priority: ActionItemPriority) => {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium
  }

  if (items.length === 0 && !onAddItem) {
    return (
      <div className={cn('text-center py-8', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="text-sm text-muted-foreground">{t('actionItems.noItems')}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          {t('actionItems.title')}
          {items.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">({items.length})</span>
          )}
        </h3>
        {onAddItem && (
          <Button variant="outline" size="sm" onClick={onAddItem} className="min-h-9">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
            {t('actionItems.addItem')}
          </Button>
        )}
      </div>

      {/* Action Items List */}
      <div className="space-y-2">
        {items.map((item) => {
          const StatusIcon = getStatusIcon(item.status)
          const statusColor = getStatusColor(item.status)
          const priorityColor = getPriorityColor(item.priority)
          const isExpanded = expandedItems.has(item.id)

          return (
            <div
              key={item.id}
              className={cn(
                'p-3 sm:p-4 rounded-lg border bg-card',
                'transition-all duration-200',
                item.status === 'completed' && 'opacity-60',
              )}
            >
              {/* Main Row */}
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <button
                  onClick={() => {
                    if (onUpdateStatus) {
                      const nextStatus =
                        item.status === 'pending'
                          ? 'in_progress'
                          : item.status === 'in_progress'
                            ? 'completed'
                            : 'pending'
                      onUpdateStatus(item, nextStatus as ActionItemStatus)
                    }
                  }}
                  className={cn(
                    'mt-0.5 p-1 rounded-full transition-colors',
                    'hover:bg-muted',
                    statusColor.text,
                  )}
                  title={t(`actionItems.status.${item.status}`)}
                >
                  <StatusIcon className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm sm:text-base font-medium text-foreground',
                          item.status === 'completed' && 'line-through',
                        )}
                      >
                        {isRTL ? item.title_ar || item.title_en : item.title_en}
                      </p>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* Priority */}
                        <Badge
                          variant="outline"
                          className={cn('text-xs', priorityColor.bg, priorityColor.text)}
                        >
                          {t(`actionItems.priorities.${item.priority}`)}
                        </Badge>

                        {/* Assignee */}
                        {(item.assignee_name_en || item.assignee_name_ar) && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {isRTL
                              ? item.assignee_name_ar || item.assignee_name_en
                              : item.assignee_name_en}
                          </span>
                        )}

                        {/* Due Date */}
                        {item.due_date && (
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs',
                              new Date(item.due_date) < new Date() &&
                                item.status !== 'completed' &&
                                'text-destructive',
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {format(new Date(item.due_date), 'MMM d')}
                          </span>
                        )}

                        {/* AI Extracted */}
                        {item.ai_extracted && (
                          <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                            <Sparkles className="h-3 w-3" />
                            {item.ai_confidence
                              ? t('actionItems.aiConfidence', {
                                  confidence: Math.round(item.ai_confidence * 100),
                                })
                              : t('actionItems.aiExtracted')}
                          </span>
                        )}

                        {/* Linked to Commitment */}
                        {item.linked_commitment_id && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <Link2 className="h-3 w-3" />
                            {t('actionItems.linkedCommitment')}
                          </span>
                        )}

                        {/* Linked to Task */}
                        {item.linked_task_id && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Link2 className="h-3 w-3" />
                            {t('actionItems.linkedTask')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                        {onEditItem && (
                          <DropdownMenuItem onClick={() => onEditItem(item)}>
                            <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('actions.edit')}
                          </DropdownMenuItem>
                        )}

                        {onConvertToCommitment &&
                          dossierId &&
                          !item.linked_commitment_id &&
                          !item.linked_task_id && (
                            <DropdownMenuItem onClick={() => onConvertToCommitment(item)}>
                              <ArrowRight className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                              {t('actionItems.convertToCommitment')}
                            </DropdownMenuItem>
                          )}

                        {onConvertToTask && !item.linked_commitment_id && !item.linked_task_id && (
                          <DropdownMenuItem onClick={() => onConvertToTask(item)}>
                            <ArrowRight className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('actionItems.convertToTask')}
                          </DropdownMenuItem>
                        )}

                        {onDeleteItem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteItem(item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                              {t('actions.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description (expandable) */}
                  {(item.description_en || item.description_ar) && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {isExpanded ? t('actions.view') : t('actions.view')}
                      </button>
                      {isExpanded && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {isRTL ? item.description_ar || item.description_en : item.description_en}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State with Add Button */}
      {items.length === 0 && onAddItem && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">{t('actionItems.noItems')}</p>
          <Button variant="outline" size="sm" onClick={onAddItem} className="min-h-9">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
            {t('actionItems.addItem')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ActionItemsList
