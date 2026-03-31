/**
 * CalendarTab — Engagement calendar view
 * Shows engagement date range, key lifecycle dates, and Add Event placeholder.
 * NOTE: Events API lacks engagement_id filter (confirmed blocker in RESEARCH).
 * Uses the engagement's own dates as primary content per research recommendation.
 */

import { type ReactElement, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'
import { useLifecycleHistory } from '@/domains/engagements/hooks/useLifecycle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Plus,
  CalendarCheck,
  CalendarClock,
  Milestone,
  Loader2,
} from 'lucide-react'

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

  const { data: engagement, isLoading } = useEngagement(engagementId)
  const { data: lifecycleHistory } = useLifecycleHistory(engagementId)

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

  // Build calendar events from engagement dates
  const events = useMemo((): CalendarEvent[] => {
    if (!engagement?.engagement) return []
    const eng = engagement.engagement
    const items: CalendarEvent[] = []

    if (eng.start_date) {
      items.push({
        id: 'start',
        title: i18n.language === 'ar' ? 'بداية المشاركة' : 'Engagement Start',
        date: eng.start_date,
        type: 'start',
        icon: CalendarCheck,
        badgeLabel: i18n.language === 'ar' ? 'بداية' : 'Start',
      })
    }

    if (eng.end_date) {
      items.push({
        id: 'end',
        title: i18n.language === 'ar' ? 'موعد نهاية المشاركة' : 'Engagement Deadline',
        date: eng.end_date,
        type: 'end',
        icon: CalendarClock,
        badgeLabel: i18n.language === 'ar' ? 'نهاية' : 'Deadline',
      })
    }

    // Use lifecycle transition timestamp, not eng.updated_at (Codex P2 fix)
    if (eng.lifecycle_stage && lifecycleHistory?.length) {
      const latestTransition = lifecycleHistory[lifecycleHistory.length - 1]
      const stageLabel =
        i18n.language === 'ar'
          ? `مرحلة: ${eng.lifecycle_stage}`
          : `Current Stage: ${eng.lifecycle_stage}`
      items.push({
        id: 'lifecycle',
        title: stageLabel,
        date: latestTransition.transitioned_at,
        type: 'lifecycle',
        icon: Milestone,
        badgeLabel: eng.lifecycle_stage,
      })
    }

    // Sort chronologically
    items.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

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
    const eng = engagement.engagement
    if (eng.start_date && eng.end_date) {
      return `${dateFormatter.format(new Date(eng.start_date))} — ${dateFormatter.format(new Date(eng.end_date))}`
    }
    if (eng.start_date) {
      return dateFormatter.format(new Date(eng.start_date))
    }
    return ''
  }, [engagement, dateFormatter])

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

  // Empty state
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t('empty.calendar.heading')}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {t('empty.calendar.body')}
        </p>
        <Button variant="outline" size="sm" className="min-h-11">
          <Plus className="h-4 w-4" />
          {t('empty.calendar.action')}
        </Button>
      </div>
    )
  }

  return (
    <div
      className="space-y-4 p-4 sm:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {dateRange}
          </span>
        </div>
        {/* TODO: Link to event creation when events API supports engagement_id filter */}
        <Button variant="outline" size="sm" className="min-h-8 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          {t('actions.addEvent')}
        </Button>
      </div>

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

      {/* TODO: Conflict detection endpoint exists at POST /api/events/conflicts
       * but is not wired until events API supports engagement_id filter.
       * Backend extension needed: GET /api/calendar-events?engagement_id=:id */}
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
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-md border bg-card p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {event.title}
                </p>
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
