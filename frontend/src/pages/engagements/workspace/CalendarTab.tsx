/**
 * CalendarTab — Engagement calendar view
 * Renders the engagement's own dates (derived Today/Upcoming/Past groups) plus a
 * "Scheduled events" reader of the user-created calendar_entries anchored to the
 * engagement dossier. Add event (CTAs #6/#7) opens the shipped EventDialog; a
 * created entry renders in the Scheduled events section without reload.
 */

import { type ReactElement, useMemo, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'
import { useLifecycleHistory } from '@/domains/engagements/hooks/useLifecycle'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'
import {
  useEngagementCalendarEntries,
  type EngagementCalendarEntry,
} from '@/hooks/useEngagementCalendarEntries'
import { EventDialog } from '@/components/dossier/AddToDossierDialogs'
import type { DossierContextForAction } from '@/hooks/useAddToDossierActions'
import { toFormatLocale } from '@/lib/format-locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog'
import { AvailabilityPollCreator } from '@/components/availability-polling/AvailabilityPollCreator'
import { CalendarDays, Plus, CalendarCheck, CalendarClock, Milestone, Loader2 } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'start' | 'end' | 'lifecycle'
  icon: typeof CalendarDays
  badgeLabel: string
}

export default function CalendarTab(): ReactElement {
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })
  const { t, i18n } = useTranslation('workspace')
  const { isRTL } = useDirection()
  const [pollDialogOpen, setPollDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)

  const { data: engagement, isLoading } = useEngagement(engagementId)
  const { data: lifecycleHistory } = useLifecycleHistory(engagementId)

  // Add event wiring: the engagement IS a dossier, so the shipped EventDialog
  // works with an engagement-typed context. useDossier supplies the
  // required-but-ignored `dossier` prop (Pitfall 5).
  const { data: dossier } = useDossier(engagementId)
  const eng = engagement?.engagement
  const dossierContext: DossierContextForAction | null = eng
    ? {
        dossier_id: engagementId,
        dossier_type: 'engagement',
        dossier_name_en: eng.name_en,
        dossier_name_ar: eng.name_ar ?? null,
        inheritance_source: 'direct',
      }
    : null
  const addEventDisabled = dossierContext === null || dossier === undefined

  // Scheduled-events reader: user-created calendar_entries for this engagement.
  const {
    entries,
    isLoading: entriesLoading,
    error: entriesError,
  } = useEngagementCalendarEntries(engagementId)

  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        timeZone: 'UTC',
      }),
    [locale],
  )

  // Day-first short formatter for the Scheduled-events rows (UI-SPEC §3):
  // "Tue 28 Apr". en-GB for EN (en-US is month-first); toFormatLocale for AR
  // (raw 'ar' yields Latin digits in Chrome — round-11 fact).
  const entryDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : toFormatLocale(i18n.language), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    [i18n.language],
  )

  // Build calendar events from engagement dates
  const events = useMemo((): CalendarEvent[] => {
    if (!engagement?.engagement) return []
    const e = engagement.engagement
    const items: CalendarEvent[] = []

    if (e.start_date) {
      items.push({
        id: 'start',
        title: i18n.language === 'ar' ? 'بداية المشاركة' : 'Engagement Start',
        date: e.start_date,
        type: 'start',
        icon: CalendarCheck,
        badgeLabel: i18n.language === 'ar' ? 'بداية' : 'Start',
      })
    }

    if (e.end_date) {
      items.push({
        id: 'end',
        title: i18n.language === 'ar' ? 'موعد نهاية المشاركة' : 'Engagement Deadline',
        date: e.end_date,
        type: 'end',
        icon: CalendarClock,
        badgeLabel: i18n.language === 'ar' ? 'نهاية' : 'Deadline',
      })
    }

    // Use lifecycle transition timestamp, not eng.updated_at (Codex P2 fix)
    if (e.lifecycle_stage && lifecycleHistory?.length) {
      const latestTransition = lifecycleHistory[lifecycleHistory.length - 1]
      if (latestTransition) {
        const stageLabel =
          i18n.language === 'ar'
            ? `مرحلة: ${e.lifecycle_stage}`
            : `Current Stage: ${e.lifecycle_stage}`
        items.push({
          id: 'lifecycle',
          title: stageLabel,
          date: latestTransition.transitioned_at,
          type: 'lifecycle',
          icon: Milestone,
          badgeLabel: e.lifecycle_stage,
        })
      }
    }

    // Sort chronologically
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return items
  }, [engagement, lifecycleHistory, i18n.language])

  // Categorize events by relative date using UTC to avoid timezone drift (Codex P2 fix)
  const categorized = useMemo(() => {
    const now = new Date()
    const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
    const past: CalendarEvent[] = []
    const todayEvents: CalendarEvent[] = []
    const upcoming: CalendarEvent[] = []

    for (const event of events) {
      const d = new Date(event.date)
      const eventKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

      if (eventKey === todayKey) {
        todayEvents.push(event)
      } else if (eventKey < todayKey) {
        past.push(event)
      } else {
        upcoming.push(event)
      }
    }

    return { past, today: todayEvents, upcoming }
  }, [events])

  // Date range display
  const dateRange = useMemo((): string => {
    if (!engagement?.engagement) return ''
    const e = engagement.engagement
    if (e.start_date && e.end_date) {
      return `${dateFormatter.format(new Date(e.start_date))} — ${dateFormatter.format(new Date(e.end_date))}`
    }
    if (e.start_date) {
      return dateFormatter.format(new Date(e.start_date))
    }
    return ''
  }, [engagement, dateFormatter])

  // The shipped EventDialog, mounted once and shared by both Add event CTAs.
  // Rendered in both the empty-state and main render paths (separate returns).
  const eventDialog =
    dossierContext !== null && dossier !== undefined ? (
      <EventDialog
        isOpen={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        dossier={dossier as Parameters<typeof EventDialog>[0]['dossier']}
        dossierContext={dossierContext}
        isRTL={isRTL}
      />
    ) : null

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-muted-foreground">
          <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin" />
          <p className="text-sm">{t('header.loading')}</p>
        </div>
      </div>
    )
  }

  // Whole-tab empty state: only when derived events AND scheduled entries are
  // BOTH empty. While the entries query is unresolved, keep derived-only
  // behavior (no flash) — an unresolved query is not "empty".
  const entriesEmptyResolved = !entriesLoading && entriesError === null && entries.length === 0
  if (events.length === 0 && entriesEmptyResolved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t('empty.calendar.heading')}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {t('empty.calendar.body')}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={addEventDisabled}
          onClick={() => setEventDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t('empty.calendar.action')}
        </Button>
        {eventDialog}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{dateRange}</span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Schedule Poll -- ABSORB-05, D-15 */}
          <Button
            variant="default"
            size="sm"
            className="min-h-11 min-w-11 gap-2"
            onClick={() => setPollDialogOpen(true)}
          >
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.schedulePoll')}</span>
          </Button>

          {/* Add event — opens the shipped EventDialog (min-h-11 per CLAUDE.md
              44px CTA floor). The created entry renders in Scheduled events
              below without reload (EventDialog invalidates the reader key). */}
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={addEventDisabled}
            onClick={() => setEventDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('actions.addEvent')}
          </Button>
        </div>
      </div>

      {/* Scheduled events — user-created calendar_entries (FIRST content section,
          above the derived date groups: user content outranks derived metadata). */}
      <ScheduledEventsSection
        heading={t('calendar.scheduledEvents')}
        emptyLabel={t('calendar.entriesEmpty')}
        errorLabel={t('calendar.entriesError')}
        entries={entries}
        isLoading={entriesLoading}
        hasError={entriesError !== null}
        language={i18n.language}
        dateFormatter={entryDateFormatter}
        typeLabel={(entryType) => t(`calendar:types.${entryType}`, { defaultValue: entryType })}
      />

      {/* Schedule Poll Dialog */}
      <AdaptiveDialog
        open={pollDialogOpen}
        onOpenChange={setPollDialogOpen}
        title={t('actions.schedulePoll')}
        snapPreset="large"
      >
        <AvailabilityPollCreator
          dossierId={engagementId}
          onSuccess={() => setPollDialogOpen(false)}
          onCancel={() => setPollDialogOpen(false)}
        />
      </AdaptiveDialog>

      {/* Add event dialog */}
      {eventDialog}

      {/* Event sections by date group */}
      {categorized.today.length > 0 && (
        <EventSection
          title={i18n.language === 'ar' ? 'اليوم' : 'Today'}
          events={categorized.today}
          dateFormatter={dateFormatter}
        />
      )}
      {categorized.upcoming.length > 0 && (
        <EventSection
          title={i18n.language === 'ar' ? 'قادم' : 'Upcoming'}
          events={categorized.upcoming}
          dateFormatter={dateFormatter}
        />
      )}
      {categorized.past.length > 0 && (
        <EventSection
          title={i18n.language === 'ar' ? 'سابق' : 'Past'}
          events={categorized.past}
          dateFormatter={dateFormatter}
        />
      )}

      {/* TODO: Wire the conflict-detection endpoint (POST /api/events/conflicts)
       * into the Add event flow so overlapping entries surface a warning. */}
    </div>
  )
}

/**
 * Scheduled events reader section (UI-SPEC §3): bordered divided list of the
 * user-created calendar_entries for this engagement. Non-interactive rows.
 */
function ScheduledEventsSection({
  heading,
  emptyLabel,
  errorLabel,
  entries,
  isLoading,
  hasError,
  language,
  dateFormatter,
  typeLabel,
}: {
  heading: string
  emptyLabel: string
  errorLabel: string
  entries: EngagementCalendarEntry[]
  isLoading: boolean
  hasError: boolean
  language: string
  dateFormatter: Intl.DateTimeFormat
  typeLabel: (entryType: string) => string
}): ReactElement {
  const isAr = language === 'ar'
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {heading}
      </h3>
      {hasError ? (
        <p className="text-xs text-[var(--danger)]">{errorLabel}</p>
      ) : !isLoading && entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="rounded-md border divide-y">
          {entries.map((entry) => {
            const title =
              isAr && entry.title_ar && entry.title_ar.length > 0 ? entry.title_ar : entry.title_en
            const dateLabel = dateFormatter.format(new Date(entry.event_date))
            const timeLabel =
              !entry.all_day && entry.event_time ? ` ${entry.event_time.slice(0, 5)}` : ''
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 px-3 min-h-[var(--row-h)]"
              >
                <p className="text-sm font-medium text-foreground truncate min-w-0">{title}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {dateLabel}
                    {timeLabel}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {typeLabel(entry.entry_type)}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Grouped event section (Today, Upcoming, Past)
 */
function EventSection({
  title,
  events,
  dateFormatter,
}: {
  title: string
  events: CalendarEvent[]
  dateFormatter: Intl.DateTimeFormat
}): ReactElement {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-3">
        {events.map((event) => {
          const Icon = event.icon
          return (
            <div key={event.id} className="flex items-start gap-3 rounded-md border bg-card p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dateFormatter.format(new Date(event.date))}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize shrink-0">
                {event.badgeLabel}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
