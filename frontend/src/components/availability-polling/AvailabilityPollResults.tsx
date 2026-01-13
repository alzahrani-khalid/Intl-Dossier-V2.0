/**
 * Availability Poll Results Component
 * Feature: participant-availability-polling
 *
 * Displays poll results and allows scheduling
 * Mobile-first, RTL-compatible
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Check,
  X,
  HelpCircle,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  CalendarPlus,
  BarChart3,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { usePollDetails, useClosePoll, useAutoSchedule } from '@/hooks/useAvailabilityPolling'
import type { OptimalSlot, PollSlot, PollParticipant } from '@/types/availability-polling.types'
import { RESPONSE_COLORS, POLL_STATUS_COLORS } from '@/types/availability-polling.types'

interface AvailabilityPollResultsProps {
  pollId: string
  isOrganizer?: boolean
  onScheduleSuccess?: (eventId: string) => void
}

export function AvailabilityPollResults({
  pollId,
  isOrganizer = false,
  onScheduleSuccess,
}: AvailabilityPollResultsProps) {
  const { t, i18n } = useTranslation('availability-polling')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data: pollData, isLoading, error } = usePollDetails(pollId)
  const closePoll = useClosePoll()
  const autoSchedule = useAutoSchedule()

  // Calculate response rate
  const responseStats = useMemo(() => {
    if (!pollData) return null

    const { participants, completion_status } = pollData
    return {
      total: completion_status?.total_participants || participants?.length || 0,
      responded: completion_status?.responded_participants || 0,
      required: completion_status?.required_participants || 1,
      rate: completion_status?.response_rate || 0,
      canClose: completion_status?.can_close || false,
    }
  }, [pollData])

  // Handle close poll
  const handleClosePoll = async (slotId?: string) => {
    try {
      await closePoll.mutateAsync({ pollId, selectedSlotId: slotId })
    } catch (error) {
      console.error('Failed to close poll:', error)
    }
  }

  // Handle schedule meeting
  const handleSchedule = async (slotId?: string) => {
    try {
      const result = await autoSchedule.mutateAsync({ pollId, slotId })
      if (result.event_id) {
        onScheduleSuccess?.(result.event_id)
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !pollData?.poll) {
    return (
      <Card className="p-6">
        <p className="text-center text-destructive">{t('errors.loadFailed')}</p>
      </Card>
    )
  }

  const { poll, slots, participants, optimal_slots } = pollData
  const isPollClosed = poll.status === 'closed'
  const isPollScheduled = poll.status === 'scheduled'

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">
            {isRTL ? poll.meeting_title_ar || poll.meeting_title_en : poll.meeting_title_en}
          </h2>
          <Badge
            className={cn(POLL_STATUS_COLORS[poll.status].bg, POLL_STATUS_COLORS[poll.status].text)}
          >
            {t(`status.${poll.status}`)}
          </Badge>
        </div>
      </div>

      {/* Response Stats */}
      {responseStats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('results.title')}
            </CardTitle>
            <CardDescription>
              {t('results.subtitle', {
                responded: responseStats.responded,
                total: responseStats.total,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={responseStats.rate} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {responseStats.rate.toFixed(0)}% {t('participants.responded').toLowerCase()}
                </span>
                {isOrganizer && !isPollClosed && !isPollScheduled && (
                  <span
                    className={cn(
                      'font-medium',
                      responseStats.canClose ? 'text-green-600' : 'text-yellow-600',
                    )}
                  >
                    {responseStats.canClose
                      ? t('results.canClose')
                      : t('results.needMoreResponses', {
                          count: responseStats.required - responseStats.responded,
                        })}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Slots */}
      {optimal_slots && optimal_slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {t('results.optimalSlots')}
            </CardTitle>
            <CardDescription>{t('results.optimalSlotsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimal_slots.map((optSlot, index) => {
              const startDate = parseISO(optSlot.slot_start)
              const endDate = parseISO(optSlot.slot_end)
              const scorePercent = Math.round(optSlot.total_score * 100)
              const isSelected = poll.selected_slot_id === optSlot.slot_id
              const isFirst = index === 0

              return (
                <Card
                  key={optSlot.slot_id}
                  className={cn(
                    'transition-all',
                    isSelected && 'border-2 border-green-500',
                    isFirst && !isSelected && 'border-2 border-yellow-500',
                  )}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Rank Badge */}
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                          isFirst
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        #{optSlot.rank}
                      </div>

                      {/* Date & Time */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-2">
                          {format(startDate, 'EEEE, MMMM d', { locale: dateLocale })}
                          {isSelected && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {t('slots.selectedSlot')}
                            </Badge>
                          )}
                          {isFirst && !isSelected && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              {t('slots.bestSlot')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(startDate, 'h:mm a', { locale: dateLocale })} -{' '}
                          {format(endDate, 'h:mm a', { locale: dateLocale })}
                        </div>
                        {(optSlot.venue_suggestion_en || optSlot.venue_suggestion_ar) && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {isRTL
                              ? optSlot.venue_suggestion_ar || optSlot.venue_suggestion_en
                              : optSlot.venue_suggestion_en}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-end">
                        <div className="text-lg font-bold text-primary">{scorePercent}%</div>
                        <div className="text-xs text-muted-foreground">
                          {t('results.score', { score: scorePercent })}
                        </div>
                      </div>

                      {/* Response Counts */}
                      <div className="flex items-center gap-2 text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-0.5 text-green-600">
                                <Check className="h-4 w-4" />
                                {optSlot.available_count}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('slots.availableCount', { count: optSlot.available_count })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-0.5 text-yellow-600">
                                <HelpCircle className="h-4 w-4" />
                                {optSlot.maybe_count}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('slots.maybeCount', { count: optSlot.maybe_count })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-0.5 text-red-600">
                                <X className="h-4 w-4" />
                                {optSlot.unavailable_count}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('slots.unavailableCount', { count: optSlot.unavailable_count })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Actions */}
                      {isOrganizer && (
                        <div className="flex items-center gap-2">
                          {poll.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClosePoll(optSlot.slot_id)}
                              disabled={closePoll.isPending}
                            >
                              {t('actions.close')}
                            </Button>
                          )}
                          {poll.status === 'closed' && !isPollScheduled && (
                            <Button
                              size="sm"
                              onClick={() => handleSchedule(optSlot.slot_id)}
                              disabled={autoSchedule.isPending}
                              className="gap-1"
                            >
                              <CalendarPlus className="h-4 w-4" />
                              {t('actions.schedule')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">
                        {t('results.breakdown')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{t('results.availabilityScore')}</span>
                          <span className="font-medium">
                            {Math.round(
                              ((optSlot.available_count + optSlot.maybe_count * 0.5) /
                                Math.max(responseStats?.total || 1, 1)) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t('results.preferenceScore')}</span>
                          <span className="font-medium">
                            {Math.round(optSlot.organizer_preference_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {(!optimal_slots || optimal_slots.length === 0) &&
        responseStats &&
        responseStats.responded === 0 && (
          <Card className="p-6">
            <div className="text-center space-y-2">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="font-medium">{t('results.noOptimalSlots')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('results.optimalSlotsDescription')}
              </p>
            </div>
          </Card>
        )}

      {/* Response Matrix Preview */}
      {participants && participants.length > 0 && slots && slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('matrix.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky start-0 bg-background">
                      {t('matrix.participant')}
                    </TableHead>
                    {slots.slice(0, 5).map((slot) => (
                      <TableHead key={slot.id} className="text-center min-w-[100px]">
                        <div className="text-xs">
                          {format(parseISO(slot.slot_start), 'MMM d', { locale: dateLocale })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(slot.slot_start), 'h:mm a', { locale: dateLocale })}
                        </div>
                      </TableHead>
                    ))}
                    {slots.length > 5 && (
                      <TableHead className="text-center">+{slots.length - 5}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.slice(0, 10).map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="sticky start-0 bg-background font-medium">
                        {isRTL
                          ? participant.display_name_ar ||
                            participant.display_name_en ||
                            participant.email
                          : participant.display_name_en ||
                            participant.display_name_ar ||
                            participant.email}
                      </TableCell>
                      {slots.slice(0, 5).map((slot) => (
                        <TableCell key={slot.id} className="text-center">
                          {/* Response would be shown here if we had the data */}
                          <span className="text-muted-foreground">-</span>
                        </TableCell>
                      ))}
                      {slots.length > 5 && <TableCell />}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {(participants.length > 10 || slots.length > 5) && (
              <div className="mt-2 text-center">
                <Button variant="link" size="sm">
                  {t('results.viewAllResponses')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Organizer Actions */}
      {isOrganizer && poll.status === 'active' && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleClosePoll()}
            disabled={closePoll.isPending || !responseStats?.canClose}
          >
            {t('actions.close')}
          </Button>
        </div>
      )}

      {isOrganizer && poll.status === 'closed' && !isPollScheduled && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            onClick={() => handleSchedule()}
            disabled={autoSchedule.isPending}
            className="gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            {t('results.selectAndSchedule')}
          </Button>
        </div>
      )}

      {isPollScheduled && poll.scheduled_event_id && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">{t('notifications.pollScheduled')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
