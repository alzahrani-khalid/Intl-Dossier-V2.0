/**
 * DeliverableCard Component
 * Feature: commitment-deliverables
 *
 * Displays a single deliverable with status, progress, and milestone tracking.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { format, differenceInDays, isPast } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  MoreVertical,
} from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

import {
  type DeliverableWithRelations,
  type DeliverableStatus,
  DELIVERABLE_STATUS_COLORS,
  DELIVERABLE_PRIORITY_COLORS,
  getHealthScoreColor,
} from '@/types/deliverable.types'

interface DeliverableCardProps {
  deliverable: DeliverableWithRelations
  onStatusChange?: (id: string, status: DeliverableStatus) => void
  onEdit?: (deliverable: DeliverableWithRelations) => void
  onDelete?: (id: string) => void
  onViewDetails?: (id: string) => void
  selectable?: boolean
  selected?: boolean
  onSelectionChange?: (id: string, selected: boolean) => void
  compact?: boolean
}

export function DeliverableCard({
  deliverable,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
  selectable = false,
  selected = false,
  onSelectionChange,
  compact = false,
}: DeliverableCardProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const [expanded, setExpanded] = useState(false)

  // Determine title based on language
  const title = isRTL ? deliverable.title_ar : deliverable.title_en
  const description = isRTL ? deliverable.description_ar : deliverable.description_en

  // Calculate days until due
  const dueDate = new Date(deliverable.due_date)
  const daysUntilDue = differenceInDays(dueDate, new Date())
  const isOverdue =
    isPast(dueDate) && deliverable.status !== 'completed' && deliverable.status !== 'cancelled'

  // Get status colors
  const statusColors =
    DELIVERABLE_STATUS_COLORS[deliverable.status] || DELIVERABLE_STATUS_COLORS.pending
  const priorityColors =
    DELIVERABLE_PRIORITY_COLORS[deliverable.priority] || DELIVERABLE_PRIORITY_COLORS.medium
  const healthColors = getHealthScoreColor(deliverable.health_score)

  // Get responsible party name
  const responsibleName =
    deliverable.responsible_party_type === 'internal'
      ? deliverable.responsible_user?.full_name || t('unassigned')
      : deliverable.responsible_contact_name || t('unassigned')

  // Count milestones
  const totalMilestones = deliverable.milestones?.length || 0
  const completedMilestones =
    deliverable.milestones?.filter((m) => m.status === 'completed').length || 0

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
        isOverdue && 'border-red-300 dark:border-red-800',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className={cn('pb-2', compact && 'py-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {selectable && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelectionChange?.(deliverable.id, !!checked)}
                className="mt-1 min-h-5 min-w-5"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle
                className={cn('text-base sm:text-lg font-semibold truncate', compact && 'text-sm')}
              >
                {title}
              </CardTitle>
              {!compact && description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={cn(priorityColors.bg, priorityColors.text, 'text-xs')}
            >
              {t(`priority.${deliverable.priority}`)}
            </Badge>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 min-h-8 min-w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('actions.menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(deliverable.id)}>
                    {t('actions.viewDetails')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(deliverable)}>
                    {t('actions.edit')}
                  </DropdownMenuItem>
                )}
                {onStatusChange && deliverable.status !== 'completed' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onStatusChange(deliverable.id, 'in_progress')}>
                      {t('actions.markInProgress')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(deliverable.id, 'completed')}>
                      {t('actions.markCompleted')}
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(deliverable.id)}
                      className="text-destructive"
                    >
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', compact && 'pb-3')}>
        {/* Status and Progress Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
          <Badge
            variant="outline"
            className={cn(statusColors.bg, statusColors.text, statusColors.border)}
          >
            {deliverable.status === 'completed' && <CheckCircle2 className="h-3 w-3 me-1" />}
            {deliverable.status === 'delayed' && <AlertTriangle className="h-3 w-3 me-1" />}
            {t(`status.${deliverable.status}`)}
          </Badge>

          <div className="flex-1 w-full sm:w-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{t('progress')}</span>
              <span>{deliverable.progress}%</span>
            </div>
            <Progress value={deliverable.progress} className="h-2" />
          </div>

          {/* Health Score */}
          {deliverable.health_score !== null && (
            <div
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                healthColors.bg,
                healthColors.text,
              )}
            >
              {t('healthScore')}: {deliverable.health_score}
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {/* Due Date */}
          <div
            className={cn('flex items-center gap-1', isOverdue && 'text-red-600 dark:text-red-400')}
          >
            <Calendar className="h-4 w-4" />
            <span>{format(dueDate, 'PP', { locale: dateLocale })}</span>
            {isOverdue && (
              <span className="text-xs">
                ({t('daysOverdue', { days: Math.abs(daysUntilDue) })})
              </span>
            )}
            {!isOverdue && daysUntilDue <= 7 && daysUntilDue >= 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                ({t('daysLeft', { days: daysUntilDue })})
              </span>
            )}
          </div>

          {/* Responsible Party */}
          <div className="flex items-center gap-1">
            {deliverable.responsible_party_type === 'internal' ? (
              <User className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span>{responsibleName}</span>
          </div>

          {/* Milestones Count */}
          {totalMilestones > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {t('milestones.count', { completed: completedMilestones, total: totalMilestones })}
              </span>
            </div>
          )}

          {/* Documents Count */}
          {deliverable.documents && deliverable.documents.length > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{deliverable.documents.length}</span>
            </div>
          )}
        </div>

        {/* Expandable Milestones Section */}
        {!compact && totalMilestones > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between h-8 px-2"
            >
              <span className="text-sm font-medium">
                {t('milestones.title')} ({completedMilestones}/{totalMilestones})
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {deliverable.milestones?.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md text-sm',
                      milestone.status === 'completed' && 'bg-green-50 dark:bg-green-900/20',
                      milestone.status === 'in_progress' && 'bg-blue-50 dark:bg-blue-900/20',
                      milestone.status === 'pending' && 'bg-gray-50 dark:bg-gray-900/20',
                      milestone.status === 'skipped' && 'bg-gray-50 dark:bg-gray-900/20 opacity-60',
                    )}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {isRTL ? milestone.title_ar : milestone.title_en}
                    </span>
                    {milestone.weight > 0 && (
                      <span className="text-xs text-muted-foreground">{milestone.weight}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DeliverableCard
