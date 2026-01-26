/**
 * MeetingSchedule Section Component (Forum Sessions)
 *
 * For Forums: Shows linked engagement dossiers as "sessions/editions"
 * Each forum edition (e.g., G20 2024) is an engagement dossier linked via relationships.
 *
 * For Working Groups: Shows meeting frequency and next meeting date.
 *
 * Mobile-first responsive, RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { CalendarDays, Clock, MapPin, ChevronRight, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useForumSessions, getSessionStatus, type ForumSession } from '@/hooks/useForumSessions'
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFunc = ReturnType<typeof useTranslation<'dossier'>>['t']

interface MeetingScheduleProps {
  dossier: ForumDossier | WorkingGroupDossier
  isWorkingGroup?: boolean
}

export function MeetingSchedule({ dossier, isWorkingGroup = false }: MeetingScheduleProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // For forums, fetch linked sessions
  const { data, isLoading, error } = useForumSessions(dossier.type === 'forum' ? dossier.id : '', {
    enabled: dossier.type === 'forum',
  })

  // Working group view - simple schedule display
  if (isWorkingGroup || dossier.type === 'working_group') {
    return <WorkingGroupSchedule dossier={dossier} isRTL={isRTL} t={t} i18n={i18n} />
  }

  // Forum view - show sessions/editions
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Add Session button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">
            {t('sessions.title', 'Forum Sessions')}
          </h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('sessions.subtitle', 'Editions and instances of this recurring forum')}
          </p>
        </div>
        <Link
          to="/dossiers/create"
          search={{ type: 'engagement', parentForumId: dossier.id }}
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="gap-2 min-h-11">
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('sessions.addSession', 'Add Session')}
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-destructive">
          <p>{t('sessions.error', 'Failed to load sessions')}</p>
        </div>
      )}

      {/* Sessions List */}
      {!isLoading && !error && data?.sessions && data.sessions.length > 0 && (
        <div className="space-y-3">
          {data.sessions.map((session) => (
            <SessionCard key={session.id} session={session} isRTL={isRTL} t={t} i18n={i18n} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!data?.sessions || data.sessions.length === 0) && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">{t('sessions.empty', 'No Sessions Yet')}</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t(
              'sessions.emptyDescription',
              'This forum has no sessions or editions yet. Create an engagement dossier to represent a specific instance of this forum.',
            )}
          </p>
          <Link to="/dossiers/create" search={{ type: 'engagement', parentForumId: dossier.id }}>
            <Button variant="default" className="gap-2 min-h-11">
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('sessions.createFirst', 'Create First Session')}
            </Button>
          </Link>
        </div>
      )}

      {/* Total Count */}
      {data?.total && data.total > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          {t('sessions.totalCount', '{{count}} session(s) total', { count: data.total })}
        </p>
      )}
    </div>
  )
}

/**
 * Session Card Component
 */
interface SessionCardProps {
  session: ForumSession
  isRTL: boolean
  t: TranslationFunc
  i18n: { language: string }
}

function SessionCard({ session, isRTL, t, i18n }: SessionCardProps) {
  const status = getSessionStatus(session)
  const name = isRTL ? session.name_ar || session.name_en : session.name_en || session.name_ar
  const location = isRTL
    ? session.extension?.location_ar ||
      session.extension?.location_en ||
      session.extension?.location
    : session.extension?.location_en ||
      session.extension?.location_ar ||
      session.extension?.location

  // Format dates
  const startDate = session.extension?.engagement_date
    ? new Date(session.extension.engagement_date)
    : null
  const endDate = session.extension?.engagement_end_date
    ? new Date(session.extension.engagement_end_date)
    : null

  const formatDate = (date: Date) =>
    date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const dateRange =
    startDate && endDate && startDate.getTime() !== endDate.getTime()
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
        ? formatDate(startDate)
        : t('sessions.dateNotSet', 'Date not set')

  // Extract year for display
  const year = startDate ? startDate.getFullYear() : null

  // Status badge styling
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
  const defaultStatusEntry = {
    label: t('sessions.status.upcoming', 'Upcoming'),
    variant: 'default' as BadgeVariant,
  }
  const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    upcoming: defaultStatusEntry,
    ongoing: { label: t('sessions.status.ongoing', 'Ongoing'), variant: 'secondary' },
    completed: { label: t('sessions.status.completed', 'Completed'), variant: 'outline' },
    cancelled: { label: t('sessions.status.cancelled', 'Cancelled'), variant: 'destructive' },
  }

  const statusEntry = statusConfig[status] || defaultStatusEntry
  const statusLabel = statusEntry.label
  const statusVariant = statusEntry.variant

  return (
    <Link to="/dossiers/engagements/$id" params={{ id: session.id }} className="block group">
      <div
        className={cn(
          'p-4 rounded-lg border bg-card transition-all duration-200',
          'hover:border-primary/50 hover:shadow-sm',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Year Badge */}
          {year && (
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {year}
            </div>
          )}

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h4>
              <Badge variant={statusVariant} className="shrink-0">
                {statusLabel}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {/* Date */}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateRange}
              </span>

              {/* Location */}
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}

              {/* Participants count */}
              {session.extension?.participants && session.extension.participants.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t('sessions.participants', '{{count}} participants', {
                    count: session.extension.participants.length,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* View Arrow */}
          <ChevronRight
            className={cn(
              'h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 hidden sm:block',
              isRTL && 'rotate-180',
            )}
          />
        </div>
      </div>
    </Link>
  )
}

/**
 * Working Group Schedule View (original behavior)
 */
interface WorkingGroupScheduleProps {
  dossier: ForumDossier | WorkingGroupDossier
  isRTL: boolean
  t: TranslationFunc
  i18n: { language: string }
}

function WorkingGroupSchedule({ dossier, isRTL, t, i18n }: WorkingGroupScheduleProps) {
  // Extract next meeting date if available
  const nextMeetingDate =
    dossier.type === 'forum' ? dossier.extension?.next_meeting_date : undefined
  const meetingFrequency =
    dossier.type === 'forum' ? dossier.extension?.meeting_frequency : undefined

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Next Meeting Highlight */}
      {nextMeetingDate && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-primary mb-1">
                {t('schedule.nextMeeting', 'Next Meeting')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {new Date(nextMeetingDate).toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Frequency Info */}
      {meetingFrequency && (
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">
                {t('schedule.meetingFrequency', 'Meeting Frequency')}
              </h4>
              <p className="text-xs text-muted-foreground">{meetingFrequency}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!nextMeetingDate && !meetingFrequency && (
        <div className="text-center py-6 sm:py-8">
          <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('schedule.noSchedule', 'No schedule information available.')}
          </p>
        </div>
      )}
    </div>
  )
}
