/**
 * Scheduled Reports Manager
 *
 * Main component for managing scheduled reports with list view,
 * create/edit dialogs, and execution history.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  History,
  MoreVertical,
  AlertCircle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import {
  useScheduledReports,
  useDeleteSchedule,
  useToggleScheduleStatus,
  useRunScheduleNow,
  type ReportSchedule,
} from '@/hooks/useScheduledReports'

import { ScheduleFormDialog } from './ScheduleFormDialog'
import { ExecutionHistoryDialog } from './ExecutionHistoryDialog'

export function ScheduledReportsManager() {
  const { t, i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  const { toast } = useToast()

  const { data: schedules, isLoading, isFetching, error, fetchStatus } = useScheduledReports()
  const deleteSchedule = useDeleteSchedule()
  const toggleStatus = useToggleScheduleStatus()
  const runNow = useRunScheduleNow()

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ReportSchedule | null>(null)

  const handleCreate = () => {
    setSelectedSchedule(null)
    setFormDialogOpen(true)
  }

  const handleEdit = (schedule: ReportSchedule) => {
    setSelectedSchedule(schedule)
    setFormDialogOpen(true)
  }

  const handleViewHistory = (schedule: ReportSchedule) => {
    setSelectedSchedule(schedule)
    setHistoryDialogOpen(true)
  }

  const handleDeleteClick = (schedule: ReportSchedule) => {
    setSelectedSchedule(schedule)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedSchedule) return

    try {
      await deleteSchedule.mutateAsync(selectedSchedule.id)
      toast({
        title: t('messages.deleteSuccess'),
      })
    } catch {
      toast({
        title: t('messages.error'),
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedSchedule(null)
    }
  }

  const handleToggleStatus = async (schedule: ReportSchedule) => {
    try {
      await toggleStatus.mutateAsync({
        id: schedule.id,
        is_active: !schedule.is_active,
      })
      toast({
        title: schedule.is_active ? t('messages.pauseSuccess') : t('messages.resumeSuccess'),
      })
    } catch {
      toast({
        title: t('messages.error'),
        variant: 'destructive',
      })
    }
  }

  const handleRunNow = async (schedule: ReportSchedule) => {
    try {
      await runNow.mutateAsync(schedule.id)
      toast({
        title: t('messages.runNowSuccess'),
      })
    } catch {
      toast({
        title: t('messages.error'),
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (schedule: ReportSchedule) => {
    if (!schedule.is_active) {
      return <Badge variant="secondary">{t('status.paused')}</Badge>
    }
    if (schedule.consecutive_failures > 0) {
      return <Badge variant="destructive">{t('status.failed')}</Badge>
    }
    return <Badge variant="default">{t('status.active')}</Badge>
  }

  const getFrequencyLabel = (schedule: ReportSchedule) => {
    const frequencyText = t(`frequency.${schedule.frequency}`)
    if (schedule.frequency === 'weekly' && schedule.day_of_week !== undefined) {
      return `${frequencyText} (${t(`days.${schedule.day_of_week}`)})`
    }
    if (schedule.frequency === 'monthly' && schedule.day_of_month) {
      return `${frequencyText} (${schedule.day_of_month})`
    }
    return frequencyText
  }

  // Show loading only when actually fetching (not when query is disabled)
  const showLoading = isLoading && fetchStatus === 'fetching'

  if (showLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
        <div className="grid gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium">{t('messages.error')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('createNew')}
        </Button>
      </div>

      {/* Empty State */}
      {schedules?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t('noSchedules')}</h3>
            <p className="text-muted-foreground mt-1">{t('noSchedulesDescription')}</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('createNew')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule List */}
      <div className="grid gap-4 sm:gap-6">
        {schedules?.map((schedule) => (
          <Card
            key={schedule.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleEdit(schedule)}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {isRTL && schedule.name_ar ? schedule.name_ar : schedule.name}
                  </CardTitle>
                  {schedule.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {isRTL && schedule.description_ar
                        ? schedule.description_ar
                        : schedule.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(schedule)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRunNow(schedule)
                        }}
                      >
                        <Play className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('actions.runNow')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(schedule)
                        }}
                      >
                        <Pause className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {schedule.is_active ? t('actions.pause') : t('actions.resume')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewHistory(schedule)
                        }}
                      >
                        <History className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('actions.viewHistory')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(schedule)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getFrequencyLabel(schedule)}</span>
                  <span>@ {schedule.time}</span>
                </div>
                {schedule.report && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isRTL && schedule.report.name_ar
                        ? schedule.report.name_ar
                        : schedule.report.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {schedule.next_run_at && (
                  <div>
                    <span className="text-muted-foreground">{t('schedule.nextRun')}: </span>
                    <span>
                      {formatDistanceToNow(new Date(schedule.next_run_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                )}
                {schedule.last_run_at && (
                  <div>
                    <span className="text-muted-foreground">{t('schedule.lastRun')}: </span>
                    <span>{format(new Date(schedule.last_run_at), 'PPp', { locale })}</span>
                  </div>
                )}
                {schedule.consecutive_failures > 0 && (
                  <div className="text-destructive">
                    <span>{t('schedule.consecutiveFailures')}: </span>
                    <span>{schedule.consecutive_failures}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <ScheduleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        schedule={selectedSchedule}
      />

      {/* History Dialog */}
      {selectedSchedule && (
        <ExecutionHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          scheduleId={selectedSchedule.id}
          scheduleName={
            isRTL && selectedSchedule.name_ar ? selectedSchedule.name_ar : selectedSchedule.name
          }
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('messages.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
