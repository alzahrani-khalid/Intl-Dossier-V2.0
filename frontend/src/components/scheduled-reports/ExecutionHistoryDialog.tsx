/**
 * Execution History Dialog
 *
 * Dialog showing the execution history for a scheduled report
 * with status, timestamps, and delivery statistics.
 */

import { useTranslation } from 'react-i18next'
import { format, formatDuration, intervalToDuration } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CheckCircle2, XCircle, Clock, SkipForward, AlertCircle } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { useScheduleExecutions, type ReportExecution } from '@/hooks/useScheduledReports'

interface ExecutionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  scheduleName: string
}

export function ExecutionHistoryDialog({
  open,
  onOpenChange,
  scheduleId,
  scheduleName,
}: ExecutionHistoryDialogProps) {
  const { t, i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const { data: executions, isLoading } = useScheduleExecutions(scheduleId)

  const getStatusIcon = (status: ReportExecution['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: ReportExecution['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{t(`status.${status}`)}</Badge>
  }

  const getDuration = (execution: ReportExecution) => {
    if (!execution.completed_at) return null

    const duration = intervalToDuration({
      start: new Date(execution.created_at),
      end: new Date(execution.completed_at),
    })

    return formatDuration(duration, { locale })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {t('history.title')} - {scheduleName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="space-y-4 p-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : executions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('history.noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {executions?.map((execution) => (
                <div key={execution.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium">
                          {format(new Date(execution.created_at), 'PPpp', { locale })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {execution.trigger_type === 'manual' ? 'Manual trigger' : 'Scheduled'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(execution.status)}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('history.successful')}</p>
                        <p className="font-medium">{execution.successful_deliveries}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('history.failed')}</p>
                        <p className="font-medium">{execution.failed_deliveries}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SkipForward className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('history.skipped')}</p>
                        <p className="font-medium">{execution.skipped_deliveries}</p>
                      </div>
                    </div>
                    {getDuration(execution) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('history.duration')}</p>
                          <p className="font-medium">{getDuration(execution)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {execution.error_message && (
                    <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                      {execution.error_message}
                    </div>
                  )}

                  {/* Conditions Result */}
                  {execution.conditions_met === false && (
                    <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm p-2 rounded">
                      Conditions not met - delivery skipped
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
