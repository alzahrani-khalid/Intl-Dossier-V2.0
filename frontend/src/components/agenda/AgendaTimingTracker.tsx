/**
 * AgendaTimingTracker Component
 * Feature: meeting-agenda-builder
 *
 * Real-time timing display during meetings showing:
 * - Total meeting progress (planned vs actual)
 * - Current item timing
 * - Variance indicators
 * - Progress bars with color coding
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  Timer,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { AgendaTiming, AgendaItemTiming } from '@/types/meeting-agenda.types'
import {
  formatDuration,
  TIMING_STATUS_COLORS,
  getVarianceColor,
} from '@/types/meeting-agenda.types'
import { cn } from '@/lib/utils'

interface AgendaTimingTrackerProps {
  timing: AgendaTiming
  currentItemId?: string
  inMeeting: boolean
}

export function AgendaTimingTracker({
  timing,
  currentItemId,
  inMeeting,
}: AgendaTimingTrackerProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'

  // Live elapsed time calculation
  const [elapsedMinutes, setElapsedMinutes] = useState(0)

  // Update elapsed time every second during meeting
  useEffect(() => {
    if (!inMeeting || !timing.actual_start_time) return

    const updateElapsed = () => {
      const start = new Date(timing.actual_start_time!).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - start) / 60000) // Convert to minutes
      setElapsedMinutes(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [inMeeting, timing.actual_start_time])

  // Calculate progress percentages
  const plannedProgress = useMemo(() => {
    if (timing.total_planned_minutes === 0) return 0
    const completedMinutes = timing.items
      .filter((i) => i.status === 'discussed' || i.status === 'skipped')
      .reduce((sum, i) => sum + i.planned_minutes, 0)
    return Math.min(100, (completedMinutes / timing.total_planned_minutes) * 100)
  }, [timing])

  const actualProgress = useMemo(() => {
    if (timing.total_planned_minutes === 0) return 0
    return Math.min(100, (elapsedMinutes / timing.total_planned_minutes) * 100)
  }, [elapsedMinutes, timing.total_planned_minutes])

  // Find current item
  const currentItem = useMemo(
    () => timing.items.find((i) => i.id === currentItemId),
    [timing.items, currentItemId],
  )

  // Calculate overall status
  const overallVariance = elapsedMinutes - timing.total_planned_minutes * (plannedProgress / 100)
  const isRunningLate = overallVariance > 5
  const isOnTrack = Math.abs(overallVariance) <= 5
  const isAheadOfSchedule = overallVariance < -5

  // Count items by status
  const itemCounts = useMemo(() => {
    const counts = {
      completed: 0,
      inProgress: 0,
      pending: 0,
      skipped: 0,
    }
    timing.items.forEach((item) => {
      if (item.status === 'discussed') counts.completed++
      else if (item.status === 'in_progress') counts.inProgress++
      else if (item.status === 'skipped') counts.skipped++
      else counts.pending++
    })
    return counts
  }, [timing.items])

  // Format time for display
  const formatTime = (date: string | undefined) => {
    if (!date) return '--:--'
    return new Date(date).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Timer className="h-5 w-5" />
            {t('meetingTiming')}
          </CardTitle>

          {/* Overall status badge */}
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              isRunningLate && 'border-red-500 bg-red-50 text-red-700',
              isOnTrack && 'border-green-500 bg-green-50 text-green-700',
              isAheadOfSchedule && 'border-blue-500 bg-blue-50 text-blue-700',
            )}
          >
            {isRunningLate && <AlertTriangle className="h-3.5 w-3.5" />}
            {isOnTrack && <CheckCircle className="h-3.5 w-3.5" />}
            {isAheadOfSchedule && <TrendingDown className="h-3.5 w-3.5" />}
            {isRunningLate && t('runningLate')}
            {isOnTrack && t('onTrack')}
            {isAheadOfSchedule && t('aheadOfSchedule')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time overview */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Start time */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('startTime')}</p>
            <p className="text-lg font-semibold">{formatTime(timing.actual_start_time)}</p>
          </div>

          {/* Elapsed time */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('elapsed')}</p>
            <p className="text-lg font-semibold">{formatDuration(elapsedMinutes)}</p>
          </div>

          {/* Planned total */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('planned')}</p>
            <p className="text-lg font-semibold">{formatDuration(timing.total_planned_minutes)}</p>
          </div>

          {/* Variance */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('variance')}</p>
            <p
              className={cn('text-lg font-semibold', getVarianceColor(Math.round(overallVariance)))}
            >
              {overallVariance > 0 ? '+' : ''}
              {formatDuration(Math.abs(Math.round(overallVariance)))}
            </p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {/* Agenda progress (items completed) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('agendaProgress')}</span>
              <span className="font-medium">{Math.round(plannedProgress)}%</span>
            </div>
            <Progress value={plannedProgress} className="h-2" />
          </div>

          {/* Time progress (actual vs planned) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('timeProgress')}</span>
              <span className={cn('font-medium', getVarianceColor(Math.round(overallVariance)))}>
                {Math.round(actualProgress)}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isRunningLate && 'bg-red-500',
                  isOnTrack && 'bg-green-500',
                  isAheadOfSchedule && 'bg-blue-500',
                )}
                style={{ width: `${actualProgress}%` }}
              />
              {/* Planned position marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-gray-400"
                style={{ left: `${plannedProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current item */}
        {currentItem && inMeeting && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Play className="h-4 w-4" />
              {t('currentItem')}
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium">{currentItem.title_en}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(currentItem.planned_minutes)}
                </Badge>
                {currentItem.actual_minutes !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      TIMING_STATUS_COLORS[currentItem.timing_status].bg,
                      TIMING_STATUS_COLORS[currentItem.timing_status].text,
                    )}
                  >
                    {currentItem.variance_minutes > 0 ? '+' : ''}
                    {currentItem.variance_minutes}m
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Item counts */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {itemCounts.completed} {t('completed')}
          </Badge>
          {itemCounts.inProgress > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Play className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
              {itemCounts.inProgress} {t('inProgress')}
            </Badge>
          )}
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <Pause className={cn('h-3.5 w-3.5', isRTL ? 'ms-1' : 'me-1')} />
            {itemCounts.pending} {t('pending')}
          </Badge>
          {itemCounts.skipped > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {itemCounts.skipped} {t('skipped')}
            </Badge>
          )}
        </div>

        {/* Items timing list (compact) */}
        {timing.items.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {timing.items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between rounded px-2 py-1 text-sm',
                  item.id === currentItemId && 'bg-blue-100 dark:bg-blue-900/30',
                  item.status === 'discussed' && 'text-muted-foreground',
                  item.status === 'skipped' && 'text-muted-foreground line-through',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs text-muted-foreground">{index + 1}</span>
                  <span className="truncate">{item.title_en}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatDuration(item.planned_minutes)}
                  </span>
                  {item.actual_minutes !== undefined && (
                    <span className={getVarianceColor(item.variance_minutes)}>
                      ({item.variance_minutes > 0 ? '+' : ''}
                      {item.variance_minutes}m)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AgendaTimingTracker
