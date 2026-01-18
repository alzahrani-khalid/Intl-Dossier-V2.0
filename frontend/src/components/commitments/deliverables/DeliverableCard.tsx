/**
 * DeliverableCard Component
 *
 * Card display for a single commitment deliverable with:
 * - Status indicator and progress bar
 * - Quick actions (mark complete, edit, delete)
 * - Due date display with overdue indication
 *
 * Mobile-first responsive design with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Target,
  FileText,
  Users,
  ClipboardCheck,
  ArrowRight,
  Send,
  CheckCircle,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Pencil,
  Trash2,
  Play,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  DELIVERABLE_STATUS_COLORS,
  DELIVERABLE_TYPE_COLORS,
  getDeliverableDaysUntilDue,
  isDeliverableOverdue,
  type CommitmentDeliverable,
  type CommitmentDeliverableType,
  type CommitmentDeliverableStatus,
} from '@/types/commitment-deliverable.types'
import { useUpdateDeliverableStatus, useDeleteDeliverable } from '@/hooks/useCommitmentDeliverables'

// Icon mapping for deliverable types
const TYPE_ICONS: Record<CommitmentDeliverableType, typeof FileText> = {
  milestone: Target,
  document: FileText,
  meeting: Users,
  review: ClipboardCheck,
  follow_up: ArrowRight,
  report: Send,
  custom: CheckCircle,
}

interface DeliverableCardProps {
  deliverable: CommitmentDeliverable
  commitmentId: string
  onEdit: (deliverable: CommitmentDeliverable) => void
}

export function DeliverableCard({ deliverable, commitmentId, onEdit }: DeliverableCardProps) {
  const { t, i18n } = useTranslation('commitment-deliverables')
  const isRTL = i18n.language === 'ar'

  const updateStatusMutation = useUpdateDeliverableStatus()
  const deleteMutation = useDeleteDeliverable()

  const [isDeleting, setIsDeleting] = useState(false)

  const Icon = TYPE_ICONS[deliverable.deliverable_type]
  const daysUntilDue = getDeliverableDaysUntilDue(deliverable.due_date)
  const isOverdue = isDeliverableOverdue(deliverable.due_date, deliverable.status)
  const isCompleted = deliverable.status === 'completed'
  const isCancelled = deliverable.status === 'cancelled'

  const displayTitle = isRTL && deliverable.title_ar ? deliverable.title_ar : deliverable.title_en

  const handleMarkComplete = async () => {
    await updateStatusMutation.mutateAsync({
      deliverableId: deliverable.id,
      commitmentId,
      status: 'completed',
    })
  }

  const handleStartProgress = async () => {
    await updateStatusMutation.mutateAsync({
      deliverableId: deliverable.id,
      commitmentId,
      status: 'in_progress',
    })
  }

  const handleDelete = async () => {
    if (window.confirm(t('form.confirmDelete'))) {
      setIsDeleting(true)
      try {
        await deleteMutation.mutateAsync({
          deliverableId: deliverable.id,
          commitmentId,
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const formatDueDate = () => {
    const date = new Date(deliverable.due_date)
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    })
  }

  const getDueDateLabel = () => {
    if (isCompleted) {
      return t('timeline.completed', {
        date: new Date(deliverable.completed_at!).toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
      })
    }
    if (daysUntilDue < 0) {
      return t('timeline.overdue', { days: Math.abs(daysUntilDue) })
    }
    if (daysUntilDue === 0) {
      return t('timeline.dueToday')
    }
    return t('timeline.dueIn', { days: daysUntilDue })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(isDeleting && 'opacity-50 pointer-events-none', isCancelled && 'opacity-60')}
    >
      <Card
        className={cn(
          'transition-colors',
          isCompleted && 'bg-green-50/50 dark:bg-green-900/10',
          isOverdue && 'border-red-200 dark:border-red-800',
        )}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div
              className={cn(
                'h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                DELIVERABLE_TYPE_COLORS[deliverable.deliverable_type].bg,
                DELIVERABLE_TYPE_COLORS[deliverable.deliverable_type].text,
                isCompleted && 'opacity-60',
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-sm font-medium text-foreground text-start truncate',
                      isCompleted && 'line-through text-muted-foreground',
                    )}
                  >
                    {displayTitle}
                  </h4>
                </div>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs flex-shrink-0',
                    DELIVERABLE_STATUS_COLORS[deliverable.status].bg,
                    DELIVERABLE_STATUS_COLORS[deliverable.status].text,
                    DELIVERABLE_STATUS_COLORS[deliverable.status].border,
                  )}
                >
                  {t(`status.${deliverable.status}`)}
                </Badge>
              </div>

              {/* Due Date */}
              <div
                className={cn(
                  'flex items-center gap-1 text-xs mb-2',
                  isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                )}
              >
                {isOverdue ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : isCompleted ? (
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span>{getDueDateLabel()}</span>
              </div>

              {/* Progress Bar */}
              {!isCancelled && (
                <div className="flex items-center gap-2">
                  <Progress value={deliverable.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground min-w-[2.5rem] text-end">
                    {deliverable.progress}%
                  </span>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            {!isCancelled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  {!isCompleted && deliverable.status === 'not_started' && (
                    <DropdownMenuItem onClick={handleStartProgress}>
                      <Play className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('actions.markInProgress')}
                    </DropdownMenuItem>
                  )}
                  {!isCompleted && (
                    <DropdownMenuItem onClick={handleMarkComplete}>
                      <CheckCircle className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('actions.markComplete')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(deliverable)}>
                    <Pencil className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
