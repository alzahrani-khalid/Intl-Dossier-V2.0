/**
 * Phase 38 plan 02 — WeekAhead widget.
 *
 * Renders upcoming engagements grouped by day (today / tomorrow / this_week /
 * next_week). Each row: <DossierGlyph> + title + counterpart/location +
 * <LtrIsolate> time range + status chip. Per-group expand toggle when
 * groupEvents.length > MAX_VISIBLE_EVENTS.
 *
 * Data: useWeekAhead(user?.id) — Wave 0 adapter wrapping useUpcomingEvents.
 * Visual source: handoff dashboard.jsx L66–L109 (verbatim) + widget shell SP-1.
 *
 * Mitigates:
 *   T-38-01 — no mock constants; data comes from useWeekAhead only.
 *   T-38-02 — TimelineEvent shape imported from operations-hub types.
 *   T-38-04 — time range wrapped in <LtrIsolate> (RTL flip-safe).
 */

import { type ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { DossierGlyph } from '@/components/signature-visuals'
import { useAuth } from '@/hooks/useAuth'
import { useWeekAhead } from '@/hooks/useWeekAhead'
import type {
  TimelineEvent,
  TimelineGroup,
} from '@/domains/operations-hub/types/operations-hub.types'
import { WidgetSkeleton } from './WidgetSkeleton'

const DAY_GROUP_ORDER: readonly TimelineGroup[] = [
  'today',
  'tomorrow',
  'this_week',
  'next_week',
] as const

const MAX_VISIBLE_EVENTS = 5

function formatTimeRange(startIso: string, endIso: string | null, language: string): string {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US'
  const start = new Date(startIso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (endIso === null) {
    return start
  }
  const end = new Date(endIso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${start} — ${end}`
}

function formatDayDate(iso: string, language: string): { weekday: string; day: string } {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US'
  const date = new Date(iso)
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' })
  const day = date.toLocaleDateString(locale, { day: '2-digit' })
  return { weekday, day }
}

interface WeekRowProps {
  event: TimelineEvent
  language: string
  statusLabel: (stage: string) => string
}

function WeekRow({ event, language, statusLabel }: WeekRowProps): ReactElement {
  const { weekday, day } = formatDayDate(event.start_date, language)
  const dossierName = event.engagement_name ?? event.title
  return (
    <div className="week-row">
      <div className="week-date">
        <div className="week-day">{weekday}</div>
        <div className="week-dd">
          <LtrIsolate>{day}</LtrIsolate>
        </div>
        <LtrIsolate className="week-time">
          {formatTimeRange(event.start_date, event.end_date, language)}
        </LtrIsolate>
      </div>
      <div className="week-body flex items-center gap-3 min-w-0">
        <DossierGlyph type="country" name={dossierName} size={20} />
        <div className="min-w-0 flex-1">
          <div className="week-title text-start truncate">{event.title}</div>
          {event.engagement_name !== null && (
            <div className="week-meta">
              <span className="truncate">{event.engagement_name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="week-right">
        {event.lifecycle_stage !== null && (
          <Badge data-testid="week-status" variant="secondary">
            {statusLabel(event.lifecycle_stage)}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function WeekAhead(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const { data, isLoading, isError } = useWeekAhead(user?.id)
  const [expanded, setExpanded] = useState<Record<TimelineGroup, boolean>>({
    today: false,
    tomorrow: false,
    this_week: false,
    next_week: false,
  })

  if (isLoading) {
    return (
      <section
        role="region"
        aria-labelledby="week-ahead-heading"
        className="week-ahead"
        data-testid="dashboard-widget-week-ahead"
      >
        <h3 id="week-ahead-heading" className="card-title mb-3 text-start">
          {t('weekAhead.title')}
        </h3>
        <WidgetSkeleton rows={4} />
      </section>
    )
  }

  if (isError || data === undefined) {
    return (
      <section
        role="region"
        aria-labelledby="week-ahead-heading"
        className="week-ahead card"
        data-testid="dashboard-widget-week-ahead"
      >
        <h3 id="week-ahead-heading" className="card-title mb-2 text-start">
          {t('weekAhead.title')}
        </h3>
        <p className="text-sm text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  const populatedGroups = DAY_GROUP_ORDER.filter((group): boolean => data[group].length > 0)

  if (populatedGroups.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="week-ahead-heading"
        className="week-ahead card"
        data-testid="dashboard-widget-week-ahead"
      >
        <h3 id="week-ahead-heading" className="card-title mb-2 text-start">
          {t('weekAhead.title')}
        </h3>
        <p className="text-sm text-start">{t('weekAhead.empty')}</p>
      </section>
    )
  }

  const statusLabel = (stage: string): string =>
    t(`weekAhead.status.${stage}`, { defaultValue: stage })

  return (
    <section
      role="region"
      aria-labelledby="week-ahead-heading"
      className="week-ahead"
      data-testid="dashboard-widget-week-ahead"
    >
      <h3 id="week-ahead-heading" className="card-title mb-3 text-start">
        {t('weekAhead.title')}
      </h3>
      {populatedGroups.map((group): ReactElement => {
        const events = data[group]
        const isOpen = expanded[group] === true
        const visible = isOpen ? events : events.slice(0, MAX_VISIBLE_EVENTS)
        const hasMore = events.length > MAX_VISIBLE_EVENTS
        return (
          <div key={group} className="week-group mb-3">
            <h4 className="text-xs font-normal mb-2 text-start uppercase tracking-wide">
              {t(`weekAhead.${group}`)}
            </h4>
            <div className="week-list">
              {visible.map(
                (event): ReactElement => (
                  <WeekRow
                    key={event.id}
                    event={event}
                    language={i18n.language}
                    statusLabel={statusLabel}
                  />
                ),
              )}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={(): void =>
                  setExpanded(
                    (prev): Record<TimelineGroup, boolean> => ({
                      ...prev,
                      [group]: !(prev[group] === true),
                    }),
                  )
                }
              >
                {isOpen ? t('overdue.collapse') : t('overdue.expand')}
              </Button>
            )}
          </div>
        )
      })}
    </section>
  )
}
