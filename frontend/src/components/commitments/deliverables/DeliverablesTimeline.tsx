/**
 * DeliverablesTimeline Component
 *
 * Main component for displaying commitment deliverables as an interactive timeline.
 * Shows either the empty state (if no deliverables) or the list with progress tracking.
 *
 * Mobile-first responsive design with RTL support.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Target, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useCommitmentDeliverables,
  useDeliverablesSummary,
} from '@/hooks/useCommitmentDeliverables'
import type { CommitmentDeliverable } from '@/types/commitment-deliverable.types'
import { CommitmentDeliverablesEmptyState } from './CommitmentDeliverablesEmptyState'
import { DeliverableCard } from './DeliverableCard'
import { AddDeliverableDialog } from './AddDeliverableDialog'

interface DeliverablesTimelineProps {
  commitmentId: string
  commitmentDueDate: string
  isCompact?: boolean
}

export function DeliverablesTimeline({
  commitmentId,
  commitmentDueDate,
  isCompact = false,
}: DeliverablesTimelineProps) {
  const { t, i18n } = useTranslation('commitment-deliverables')
  const isRTL = i18n.language === 'ar'

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDeliverable, setEditDeliverable] = useState<CommitmentDeliverable | null>(null)

  const { data: deliverables, isLoading: isLoadingDeliverables } =
    useCommitmentDeliverables(commitmentId)
  const { data: summary, isLoading: isLoadingSummary } = useDeliverablesSummary(commitmentId)

  const isEmpty = !deliverables || deliverables.length === 0
  const isLoading = isLoadingDeliverables || isLoadingSummary

  // Sort deliverables by due date, then by sort_order
  const sortedDeliverables = useMemo(() => {
    if (!deliverables) return []
    return [...deliverables].sort((a, b) => {
      const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.sort_order - b.sort_order
    })
  }, [deliverables])

  const handleOpenDialog = () => {
    setEditDeliverable(null)
    setIsDialogOpen(true)
  }

  const handleEditDeliverable = (deliverable: CommitmentDeliverable) => {
    setEditDeliverable(deliverable)
    setIsDialogOpen(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <CommitmentDeliverablesEmptyState
        commitmentId={commitmentId}
        commitmentDueDate={commitmentDueDate}
      />
    )
  }

  // Main timeline view
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'} data-testid="deliverables-timeline">
      {/* Stats Bar */}
      {!isCompact && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('stats.total')}</p>
                <p className="text-base sm:text-lg font-semibold">{summary.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('stats.completed')}</p>
                <p className="text-base sm:text-lg font-semibold">{summary.completed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('stats.inProgress')}</p>
                <p className="text-base sm:text-lg font-semibold">{summary.inProgress}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('stats.overdue')}</p>
                <p
                  className={cn(
                    'text-base sm:text-lg font-semibold',
                    summary.overdue > 0 && 'text-red-600 dark:text-red-400',
                  )}
                >
                  {summary.overdue}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Progress Overview */}
      {summary && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('progress.title')}</span>
              </div>
              <span className="text-sm font-semibold text-primary">{summary.progress}%</span>
            </div>
            <Progress value={summary.progress} className="h-2" />
            {summary.progress === 100 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {t('progress.allComplete')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground text-start">
            {t('timeline.title')}
          </h3>
        </div>
        <Button onClick={handleOpenDialog} size="sm" className="min-h-9">
          <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
          <span className="hidden sm:inline">{t('form.addDeliverable')}</span>
        </Button>
      </div>

      {/* Deliverables List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedDeliverables.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              commitmentId={commitmentId}
              onEdit={handleEditDeliverable}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Dialog */}
      <AddDeliverableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        commitmentId={commitmentId}
        commitmentDueDate={commitmentDueDate}
        editDeliverable={editDeliverable}
      />
    </div>
  )
}
