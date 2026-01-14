/**
 * SchedulingConflictComparison Component
 * Feature: scheduling-conflict-side-by-side
 *
 * Presents a clear side-by-side view of conflicting events with options to:
 * - Reschedule the new event
 * - Adjust duration
 * - Proceed anyway
 * Shows participant availability conflicts prominently
 *
 * Mobile-first, RTL-compatible design
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Edit3,
  Timer,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type {
  EventConflict,
  ConflictCheckResponse,
  ConflictSeverity,
} from '@/types/calendar-conflict.types'
import { SEVERITY_COLORS } from '@/types/calendar-conflict.types'

// Types for the component
export interface NewEventData {
  title_en?: string
  title_ar?: string
  start_datetime: string
  end_datetime?: string
  location?: string
  participants: Array<{
    participant_id: string
    participant_name?: string
    participant_type: 'person_dossier' | 'organization_dossier'
  }>
}

export interface ParticipantConflictInfo {
  participant_id: string
  participant_name?: string
  is_conflicting: boolean
  conflicting_event_title?: string
  availability_status?: 'available' | 'busy' | 'tentative' | 'unknown'
}

interface SchedulingConflictComparisonProps {
  conflicts: ConflictCheckResponse
  newEvent: NewEventData
  participantConflicts?: ParticipantConflictInfo[]
  onProceedAnyway?: () => void
  onReschedule?: () => void
  onAdjustDuration?: (newDuration: number) => void
  onGenerateSuggestions?: () => void
  onDismiss?: () => void
  className?: string
}

export function SchedulingConflictComparison({
  conflicts,
  newEvent,
  participantConflicts,
  onProceedAnyway,
  onReschedule,
  onAdjustDuration,
  onGenerateSuggestions,
  onDismiss,
  className,
}: SchedulingConflictComparisonProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'
  const [expandedConflictIndex, setExpandedConflictIndex] = useState<number | null>(0)
  const [showDurationOptions, setShowDurationOptions] = useState(false)

  // Format datetime for display
  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate duration in minutes
  const getDurationMinutes = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  }

  // Get the highest severity
  const highestSeverity: ConflictSeverity = useMemo(() => {
    if (conflicts.severity_summary.critical > 0) return 'critical'
    if (conflicts.severity_summary.high > 0) return 'high'
    if (conflicts.severity_summary.medium > 0) return 'medium'
    return 'low'
  }, [conflicts.severity_summary])

  // Count conflicting participants
  const conflictingParticipantCount = useMemo(() => {
    return participantConflicts?.filter((p) => p.is_conflicting).length ?? 0
  }, [participantConflicts])

  // Calculate suggested duration options (shorter durations that might avoid conflict)
  const durationOptions = useMemo(() => {
    if (!newEvent.end_datetime) return []
    const currentDuration = getDurationMinutes(newEvent.start_datetime, newEvent.end_datetime)
    const options = [30, 45, 60, 90].filter((d) => d < currentDuration)
    return options
  }, [newEvent.start_datetime, newEvent.end_datetime])

  const hasHighSeverity = highestSeverity === 'critical' || highestSeverity === 'high'

  if (!conflicts.has_conflicts) {
    return null
  }

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 transition-all duration-300',
        hasHighSeverity
          ? 'border-destructive/60 bg-destructive/5'
          : 'border-warning/60 bg-warning/5',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <CardHeader className="pb-3 bg-background/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0',
                hasHighSeverity
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg">
                {t('conflictComparison.title', { count: conflicts.total_conflicts })}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t('conflictComparison.subtitle')}
              </p>
            </div>
          </div>

          {/* Severity badges */}
          <div className="flex items-center gap-1 shrink-0">
            {conflicts.severity_summary.critical > 0 && (
              <Badge variant="destructive" className="text-xs px-2">
                {conflicts.severity_summary.critical}
              </Badge>
            )}
            {conflicts.severity_summary.high > 0 && (
              <Badge className="bg-orange-500 text-white text-xs px-2">
                {conflicts.severity_summary.high}
              </Badge>
            )}
            {onDismiss && (
              <Button variant="ghost" size="icon" className="h-8 w-8 ms-1" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Participant Availability Section */}
        {participantConflicts && participantConflicts.length > 0 && (
          <div className="p-3 sm:p-4 bg-muted/30 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {t('conflictComparison.participantAvailability')}
              </span>
              {conflictingParticipantCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {t('conflictComparison.conflictsCount', { count: conflictingParticipantCount })}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {participantConflicts.map((participant) => (
                <ParticipantAvailabilityBadge
                  key={participant.participant_id}
                  participant={participant}
                  isRTL={isRTL}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Side-by-side Comparison */}
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {conflicts.conflicts.map((conflict, index) => (
              <ConflictComparisonItem
                key={conflict.id || index}
                conflict={conflict}
                newEvent={newEvent}
                isExpanded={expandedConflictIndex === index}
                onToggle={() =>
                  setExpandedConflictIndex(expandedConflictIndex === index ? null : index)
                }
                isRTL={isRTL}
                formatDate={formatDate}
                formatTime={formatTime}
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Resolution Actions */}
        <div className="p-3 sm:p-4 bg-background border-t">
          <p className="text-xs text-muted-foreground mb-3">
            {t('conflictComparison.resolvePrompt')}
          </p>

          <div className="flex flex-col gap-2">
            {/* Primary actions - grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Reschedule button */}
              {onReschedule && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" size="sm" onClick={onReschedule} className="w-full">
                        <Calendar className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        {t('conflictComparison.reschedule')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('conflictComparison.rescheduleTooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Adjust duration button */}
              {onAdjustDuration && durationOptions.length > 0 && (
                <Collapsible open={showDurationOptions} onOpenChange={setShowDurationOptions}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Timer className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('conflictComparison.adjustDuration')}
                      {showDurationOptions ? (
                        <ChevronUp className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
                      ) : (
                        <ChevronDown className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {durationOptions.map((duration) => (
                        <Button
                          key={duration}
                          variant="secondary"
                          size="sm"
                          onClick={() => onAdjustDuration(duration)}
                          className="text-xs"
                        >
                          {duration} {t('conflictComparison.minutes')}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Proceed anyway button */}
              {onProceedAnyway && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onProceedAnyway}
                        className={cn(
                          'w-full',
                          hasHighSeverity && 'border-warning text-warning hover:bg-warning/10',
                        )}
                      >
                        <Check className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        {t('conflictComparison.proceedAnyway')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('conflictComparison.proceedAnywayTooltip')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* AI Suggestions button */}
            {onGenerateSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGenerateSuggestions}
                className="w-full mt-1"
              >
                <Sparkles className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('conflictComparison.getAISuggestions')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Participant availability badge component
interface ParticipantAvailabilityBadgeProps {
  participant: ParticipantConflictInfo
  isRTL: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

function ParticipantAvailabilityBadge({
  participant,
  isRTL,
  t,
}: ParticipantAvailabilityBadgeProps) {
  const statusColors = {
    available:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    busy: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    tentative:
      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    unknown:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
  }

  const status = participant.is_conflicting ? 'busy' : participant.availability_status || 'unknown'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs cursor-default',
              statusColors[status],
            )}
          >
            {participant.is_conflicting ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            <span className="truncate max-w-24 sm:max-w-32">
              {participant.participant_name || participant.participant_id}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'left' : 'right'}>
          <div className="text-xs">
            <p className="font-medium">{participant.participant_name}</p>
            {participant.is_conflicting ? (
              <p className="text-muted-foreground">
                {t('conflictComparison.participantBusy')}
                {participant.conflicting_event_title && (
                  <span className="block text-warning">{participant.conflicting_event_title}</span>
                )}
              </p>
            ) : (
              <p className="text-green-600">{t('conflictComparison.participantAvailable')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Side-by-side comparison item
interface ConflictComparisonItemProps {
  conflict: EventConflict
  newEvent: NewEventData
  isExpanded: boolean
  onToggle: () => void
  isRTL: boolean
  formatDate: (datetime: string) => string
  formatTime: (datetime: string) => string
  t: (key: string, options?: Record<string, unknown>) => string
}

function ConflictComparisonItem({
  conflict,
  newEvent,
  isExpanded,
  onToggle,
  isRTL,
  formatDate,
  formatTime,
  t,
}: ConflictComparisonItemProps) {
  const colors = SEVERITY_COLORS[conflict.severity]
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  // Event card component for comparison
  const EventCard = ({
    title,
    startDatetime,
    endDatetime,
    location,
    variant,
  }: {
    title?: string
    startDatetime: string
    endDatetime?: string
    location?: string
    variant: 'new' | 'existing'
  }) => (
    <div
      className={cn(
        'flex-1 p-3 rounded-lg border',
        variant === 'new' ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-muted',
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {variant === 'new' ? (
          <Edit3 className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {variant === 'new'
            ? t('conflictComparison.newEvent')
            : t('conflictComparison.existingEvent')}
        </span>
      </div>

      <p className="text-sm font-medium line-clamp-2 mb-2">
        {title || t('conflictComparison.untitled')}
      </p>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(startDatetime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {formatTime(startDatetime)}
            {endDatetime && ` - ${formatTime(endDatetime)}`}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors',
            isExpanded && 'bg-muted/20',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge
                variant="outline"
                className={cn('text-xs shrink-0', colors.bg, colors.text, colors.border)}
              >
                {t(`conflicts.severity.${conflict.severity}`)}
              </Badge>
              <Badge variant="secondary" className="text-xs shrink-0">
                {t(`conflicts.types.${conflict.conflict_type}`)}
              </Badge>
              <p className="text-sm text-muted-foreground truncate">
                {isRTL ? conflict.message_ar || conflict.message_en : conflict.message_en}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 sm:px-4 pb-4"
        >
          {/* Side-by-side comparison */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
            {/* New event */}
            <EventCard
              title={isRTL ? newEvent.title_ar : newEvent.title_en}
              startDatetime={newEvent.start_datetime}
              endDatetime={newEvent.end_datetime}
              location={newEvent.location}
              variant="new"
            />

            {/* Arrow indicator */}
            <div className="flex items-center justify-center py-2 sm:py-0">
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-full',
                  colors.bg,
                  colors.border,
                  'border',
                )}
              >
                <ArrowIcon className={cn('h-4 w-4', colors.text)} />
              </div>
            </div>

            {/* Existing event */}
            {conflict.conflicting_event && (
              <EventCard
                title={
                  isRTL
                    ? conflict.conflicting_event.title_ar || conflict.conflicting_event.title_en
                    : conflict.conflicting_event.title_en || conflict.conflicting_event.title_ar
                }
                startDatetime={conflict.conflicting_event.start_datetime}
                endDatetime={conflict.conflicting_event.end_datetime}
                variant="existing"
              />
            )}
          </div>

          {/* Overlap details */}
          {conflict.overlap_start && conflict.overlap_end && (
            <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">{t('conflictComparison.overlapPeriod')}:</span>
                <span>
                  {formatTime(conflict.overlap_start)} - {formatTime(conflict.overlap_end)}
                  {conflict.overlap_minutes && (
                    <span className="ms-1">
                      ({conflict.overlap_minutes} {t('conflictComparison.minutes')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default SchedulingConflictComparison
