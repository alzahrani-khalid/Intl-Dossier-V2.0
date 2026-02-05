/**
 * AgendaItemCard Component
 *
 * Displays a single agenda item with its details, status, and actions.
 * Supports hierarchical display with nested children.
 * Mobile-first responsive, RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  ForumAgendaItemWithStats,
  AgendaItemType,
  AgendaItemStatus,
  AgendaItemPriority,
} from '@/types/forum-extended.types'

interface AgendaItemCardProps {
  item: ForumAgendaItemWithStats
  isRTL: boolean
  onEdit?: (item: ForumAgendaItemWithStats) => void
  onDelete?: (item: ForumAgendaItemWithStats) => void
  level?: number
}

export function AgendaItemCard({ item, isRTL, onEdit, onDelete, level = 0 }: AgendaItemCardProps) {
  const { t, i18n } = useTranslation('forum-management')
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const [showActions, setShowActions] = useState(false)

  const hasChildren = item.children && item.children.length > 0
  const title = isRTL ? item.title_ar || item.title_en : item.title_en || item.title_ar
  const description = isRTL
    ? item.description_ar || item.description_en
    : item.description_en || item.description_ar

  // Status badge config
  const statusConfig = getStatusConfig(item.status, t)
  const priorityConfig = getPriorityConfig(item.priority, t)
  const typeConfig = getTypeConfig(item.item_type, t)

  // Format scheduled time
  const formatTime = (time: string | null | undefined) => {
    if (!time) return null
    try {
      return new Date(time).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return time
    }
  }

  const startTime = formatTime(item.scheduled_start_time)
  const endTime = formatTime(item.scheduled_end_time)
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card transition-all duration-200',
        level > 0 && 'ms-4 sm:ms-6 border-s-2 border-s-primary/20',
        'hover:border-primary/30 hover:shadow-sm',
      )}
      style={{ marginInlineStart: level > 0 ? `${level * 0.75}rem` : 0 }}
    >
      <div className="p-3 sm:p-4">
        {/* Header Row */}
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="shrink-0 p-1 hover:bg-muted rounded-md transition-colors mt-0.5"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight
                  className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')}
                />
              )}
            </button>
          )}

          {/* Item Number Badge */}
          <Badge variant="outline" className="shrink-0 font-mono text-xs">
            {item.item_number}
          </Badge>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h4 className="font-medium text-card-foreground text-start leading-tight">{title}</h4>

              {/* Status & Priority Badges */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <Badge variant={priorityConfig.variant} className="text-xs">
                  {priorityConfig.label}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.icon}
                  <span className="ms-1">{statusConfig.label}</span>
                </Badge>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 text-start">
                {description}
              </p>
            )}

            {/* Meta Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {/* Type */}
              <span className="flex items-center gap-1">
                {typeConfig.icon}
                {typeConfig.label}
              </span>

              {/* Time */}
              {timeRange && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRange}
                </span>
              )}

              {/* Duration */}
              {item.time_allocation_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('agendaItems.timeAllocation', '{{minutes}} min', {
                    minutes: item.time_allocation_minutes,
                  })}
                </span>
              )}

              {/* Documents */}
              {item.documents && item.documents.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {item.documents.length}
                </span>
              )}

              {/* Speakers */}
              {item.speakers && item.speakers.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {item.speakers.length}
                </span>
              )}

              {/* Assignments */}
              {item.assignments_count !== undefined && item.assignments_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.assignments_count}
                </span>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              onClick={() => setShowActions(!showActions)}
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {showActions && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                {/* Menu */}
                <div
                  className={cn(
                    'absolute z-20 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md',
                    isRTL ? 'start-0' : 'end-0',
                  )}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => {
                      onEdit?.(item)
                      setShowActions(false)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('agendaItems.edit', 'Edit')}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onDelete?.(item)
                      setShowActions(false)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('agendaItems.delete', 'Delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-t px-3 py-3 sm:px-4 sm:py-4 space-y-3 bg-muted/30">
          {item.children!.map((child) => (
            <AgendaItemCard
              key={child.id}
              item={child}
              isRTL={isRTL}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper functions for badge configurations
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

function getStatusConfig(status: AgendaItemStatus, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<
    AgendaItemStatus,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    pending: {
      label: t('agendaItemStatus.pending', 'Pending'),
      variant: 'outline',
      icon: <Clock className="h-3 w-3" />,
    },
    in_progress: {
      label: t('agendaItemStatus.in_progress', 'In Progress'),
      variant: 'secondary',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    completed: {
      label: t('agendaItemStatus.completed', 'Completed'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    deferred: {
      label: t('agendaItemStatus.deferred', 'Deferred'),
      variant: 'outline',
      icon: <Clock className="h-3 w-3" />,
    },
    withdrawn: {
      label: t('agendaItemStatus.withdrawn', 'Withdrawn'),
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    adopted: {
      label: t('agendaItemStatus.adopted', 'Adopted'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rejected: {
      label: t('agendaItemStatus.rejected', 'Rejected'),
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3" />,
    },
  }

  return configs[status] || configs.pending
}

function getPriorityConfig(
  priority: AgendaItemPriority,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const configs: Record<AgendaItemPriority, { label: string; variant: BadgeVariant }> = {
    low: { label: t('agendaItemPriority.low', 'Low'), variant: 'outline' },
    normal: { label: t('agendaItemPriority.normal', 'Normal'), variant: 'secondary' },
    high: { label: t('agendaItemPriority.high', 'High'), variant: 'default' },
    urgent: { label: t('agendaItemPriority.urgent', 'Urgent'), variant: 'destructive' },
  }

  return configs[priority] || configs.normal
}

function getTypeConfig(type: AgendaItemType, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<AgendaItemType, { label: string; icon: React.ReactNode }> = {
    discussion: {
      label: t('agendaItemTypes.discussion', 'Discussion'),
      icon: <MessageSquare className="h-3 w-3" />,
    },
    decision: {
      label: t('agendaItemTypes.decision', 'Decision'),
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    information: {
      label: t('agendaItemTypes.information', 'Information'),
      icon: <FileText className="h-3 w-3" />,
    },
    election: {
      label: t('agendaItemTypes.election', 'Election'),
      icon: <Users className="h-3 w-3" />,
    },
    procedural: {
      label: t('agendaItemTypes.procedural', 'Procedural'),
      icon: <Clock className="h-3 w-3" />,
    },
    report: {
      label: t('agendaItemTypes.report', 'Report'),
      icon: <FileText className="h-3 w-3" />,
    },
    adoption: {
      label: t('agendaItemTypes.adoption', 'Adoption'),
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  }

  return configs[type] || configs.discussion
}

export default AgendaItemCard
