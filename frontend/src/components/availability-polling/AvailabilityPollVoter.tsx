/**
 * Availability Poll Voter Component
 * Feature: participant-availability-polling
 *
 * Allows participants to vote on proposed time slots
 * Mobile-first, RTL-compatible
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isAfter, isBefore } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Check, X, HelpCircle, Clock, MapPin, Calendar, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { usePollDetails, useSubmitVotes } from '@/hooks/useAvailabilityPolling'
import type {
  PollSlot,
  PollResponse,
  PollResponseType,
  SubmitVoteRequest,
} from '@/types/availability-polling.types'
import { RESPONSE_COLORS, POLL_STATUS_COLORS } from '@/types/availability-polling.types'

interface AvailabilityPollVoterProps {
  pollId: string
  onVoteSuccess?: () => void
}

interface SlotVote {
  slot_id: string
  response: PollResponseType | null
  notes?: string
}

export function AvailabilityPollVoter({ pollId, onVoteSuccess }: AvailabilityPollVoterProps) {
  const { t, i18n } = useTranslation('availability-polling')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data: pollData, isLoading, error } = usePollDetails(pollId)
  const submitVotes = useSubmitVotes()

  // Track votes locally
  const [votes, setVotes] = useState<Map<string, SlotVote>>(new Map())
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  // Initialize votes from existing responses
  useMemo(() => {
    if (pollData?.my_responses && votes.size === 0) {
      const initialVotes = new Map<string, SlotVote>()
      pollData.my_responses.forEach((response) => {
        initialVotes.set(response.slot_id, {
          slot_id: response.slot_id,
          response: response.response,
          notes: response.notes,
        })
      })
      if (initialVotes.size > 0) {
        setVotes(initialVotes)
      }
    }
  }, [pollData?.my_responses])

  // Handle vote change
  const handleVoteChange = (slotId: string, response: PollResponseType) => {
    setVotes((prev) => {
      const newVotes = new Map(prev)
      const existing = newVotes.get(slotId)
      newVotes.set(slotId, {
        slot_id: slotId,
        response: existing?.response === response ? null : response,
        notes: existing?.notes,
      })
      return newVotes
    })
  }

  // Handle note change
  const handleNoteChange = (slotId: string, notes: string) => {
    setVotes((prev) => {
      const newVotes = new Map(prev)
      const existing = newVotes.get(slotId)
      if (existing) {
        newVotes.set(slotId, { ...existing, notes })
      }
      return newVotes
    })
  }

  // Submit votes
  const handleSubmit = async () => {
    const votesToSubmit: SubmitVoteRequest[] = []

    votes.forEach((vote) => {
      if (vote.response) {
        votesToSubmit.push({
          slot_id: vote.slot_id,
          response: vote.response,
          notes: vote.notes,
        })
      }
    })

    if (votesToSubmit.length === 0) {
      return
    }

    try {
      await submitVotes.mutateAsync({ pollId, votes: votesToSubmit })
      onVoteSuccess?.()
    } catch (error) {
      console.error('Failed to submit votes:', error)
    }
  }

  // Quick actions
  const markAllAs = (response: PollResponseType) => {
    if (!pollData?.slots) return

    const newVotes = new Map<string, SlotVote>()
    pollData.slots.forEach((slot) => {
      newVotes.set(slot.id, {
        slot_id: slot.id,
        response,
        notes: votes.get(slot.id)?.notes,
      })
    })
    setVotes(newVotes)
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

  const { poll, slots } = pollData
  const isPollActive = poll.status === 'active'
  const deadlinePassed = isAfter(new Date(), parseISO(poll.deadline))
  const canVote = isPollActive && !deadlinePassed

  // Count votes by status
  const voteCounts = useMemo(() => {
    let available = 0
    let unavailable = 0
    let maybe = 0

    votes.forEach((vote) => {
      if (vote.response === 'available') available++
      else if (vote.response === 'unavailable') unavailable++
      else if (vote.response === 'maybe') maybe++
    })

    return { available, unavailable, maybe, total: slots?.length || 0 }
  }, [votes, slots])

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

        {(poll.description_en || poll.description_ar) && (
          <p className="text-muted-foreground">
            {isRTL ? poll.description_ar || poll.description_en : poll.description_en}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {t('form.durationMinutes', { count: poll.meeting_duration_minutes })}
          </span>

          {!deadlinePassed && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('voting.deadline', {
                date: format(parseISO(poll.deadline), 'PPp', { locale: dateLocale }),
              })}
            </span>
          )}

          {(poll.location_en || poll.location_ar) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {isRTL ? poll.location_ar || poll.location_en : poll.location_en}
            </span>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {!canVote && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <p className="text-center text-sm text-muted-foreground">
              {deadlinePassed ? t('voting.deadlinePassed') : t('voting.pollClosed')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {canVote && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t('voting.selectAll')}:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => markAllAs('available')}
          >
            <Check className="h-3 w-3 text-green-600" />
            {t('responses.available')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => markAllAs('unavailable')}
          >
            <X className="h-3 w-3 text-red-600" />
            {t('responses.unavailable')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => markAllAs('maybe')}
          >
            <HelpCircle className="h-3 w-3 text-yellow-600" />
            {t('responses.maybe')}
          </Button>
        </div>
      )}

      {/* Time Slots */}
      <div className="space-y-3">
        {slots?.map((slot) => {
          const vote = votes.get(slot.id)
          const isExpanded = expandedSlot === slot.id
          const startDate = parseISO(slot.slot_start)
          const endDate = parseISO(slot.slot_end)

          return (
            <Card
              key={slot.id}
              className={cn(
                'transition-all',
                vote?.response && RESPONSE_COLORS[vote.response].border,
                vote?.response && 'border-2',
              )}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Date & Time */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {format(startDate, 'EEEE, MMMM d', { locale: dateLocale })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(startDate, 'h:mm a', { locale: dateLocale })} -{' '}
                      {format(endDate, 'h:mm a', { locale: dateLocale })}
                    </div>
                    {(slot.venue_suggestion_en || slot.venue_suggestion_ar) && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {isRTL
                          ? slot.venue_suggestion_ar || slot.venue_suggestion_en
                          : slot.venue_suggestion_en}
                      </div>
                    )}
                  </div>

                  {/* Response Summary */}
                  <div className="flex items-center gap-1 text-xs">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-0.5 text-green-600">
                            <Check className="h-3 w-3" />
                            {slot.available_count}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('slots.availableCount', { count: slot.available_count })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground">/</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-0.5 text-yellow-600">
                            <HelpCircle className="h-3 w-3" />
                            {slot.maybe_count}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('slots.maybeCount', { count: slot.maybe_count })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground">/</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-0.5 text-red-600">
                            <X className="h-3 w-3" />
                            {slot.unavailable_count}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('slots.unavailableCount', { count: slot.unavailable_count })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Vote Buttons */}
                  {canVote && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={vote?.response === 'available' ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'h-9 w-9 sm:h-10 sm:w-10',
                          vote?.response === 'available' && 'bg-green-600 hover:bg-green-700',
                        )}
                        onClick={() => handleVoteChange(slot.id, 'available')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={vote?.response === 'maybe' ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'h-9 w-9 sm:h-10 sm:w-10',
                          vote?.response === 'maybe' && 'bg-yellow-600 hover:bg-yellow-700',
                        )}
                        onClick={() => handleVoteChange(slot.id, 'maybe')}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={vote?.response === 'unavailable' ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'h-9 w-9 sm:h-10 sm:w-10',
                          vote?.response === 'unavailable' && 'bg-red-600 hover:bg-red-700',
                        )}
                        onClick={() => handleVoteChange(slot.id, 'unavailable')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes (expandable) */}
                {canVote && vote?.response && (
                  <div className="mt-3 pt-3 border-t">
                    <Textarea
                      value={vote?.notes || ''}
                      onChange={(e) => handleNoteChange(slot.id, e.target.value)}
                      placeholder={t('voting.notePlaceholder')}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submit */}
      {canVote && (
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="text-green-600">{voteCounts.available}</span>{' '}
            {t('responses.available')} / <span className="text-yellow-600">{voteCounts.maybe}</span>{' '}
            {t('responses.maybe')} / <span className="text-red-600">{voteCounts.unavailable}</span>{' '}
            {t('responses.unavailable')}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              submitVotes.isPending ||
              voteCounts.available + voteCounts.maybe + voteCounts.unavailable === 0
            }
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {pollData.my_responses && pollData.my_responses.length > 0
              ? t('voting.updateVotes')
              : t('voting.submitVotes')}
          </Button>
        </div>
      )}
    </div>
  )
}
