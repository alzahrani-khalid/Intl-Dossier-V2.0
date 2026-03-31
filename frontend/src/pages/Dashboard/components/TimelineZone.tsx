/**
 * TimelineZone — Day-grouped timeline with show-all expand
 * Phase 10: Operations Hub Dashboard
 *
 * Renders events grouped by Today, Tomorrow, This Week, Next Week.
 * Shows max 5 events per section with "Show all" expand toggle.
 * Handles loading, error, and empty states.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TimelineEventCard } from './TimelineEventCard'
import type {
  GroupedEvents,
  TimelineGroup,
} from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Constants
// ============================================================================

const DAY_GROUP_ORDER: TimelineGroup[] = ['today', 'tomorrow', 'this_week', 'next_week']
const MAX_VISIBLE_EVENTS = 5

// ============================================================================
// Component
// ============================================================================

interface TimelineZoneProps {
  events: GroupedEvents
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function TimelineZone({
  events,
  isLoading,
  isError,
  onRetry,
}: TimelineZoneProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')
  const navigate = useNavigate()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = useCallback((group: TimelineGroup): void => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !(prev[group] ?? false) }))
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div role="region" aria-label={t('zones.timeline.title')} className="space-y-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        role="region"
        aria-label={t('zones.timeline.title')}
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
        <p className="text-sm text-destructive mb-2">
          {t('error.load_failed', { zone: t('zones.timeline.title') })}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('error.retry')}
        </Button>
      </div>
    )
  }

  // Check if all groups are empty
  const hasAnyEvents = DAY_GROUP_ORDER.some(
    (group) => (events[group]?.length ?? 0) > 0,
  )

  if (!hasAnyEvents) {
    return (
      <div role="region" aria-label={t('zones.timeline.title')}>
        <p className="text-sm text-muted-foreground py-4">
          {t('zones.timeline.empty')}
        </p>
      </div>
    )
  }

  // Non-empty groups only
  const nonEmptyGroups = DAY_GROUP_ORDER.filter(
    (group) => (events[group]?.length ?? 0) > 0,
  )

  return (
    <div role="region" aria-label={t('zones.timeline.title')} className="space-y-4">
      {nonEmptyGroups.map((group, groupIndex) => {
        const groupEvents = events[group] ?? []
        const isExpanded = expandedGroups[group] ?? false
        const visibleEvents = isExpanded
          ? groupEvents
          : groupEvents.slice(0, MAX_VISIBLE_EVENTS)
        const hasMore = groupEvents.length > MAX_VISIBLE_EVENTS

        return (
          <div key={group}>
            {groupIndex > 0 && <Separator className="mb-4" />}
            <h3 className="text-sm font-normal text-muted-foreground mb-2">
              {t(`zones.timeline.${group}`)}
            </h3>
            <div className="space-y-1">
              {visibleEvents.map((event) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  onClick={(): void => {
                    if (event.engagement_id != null) {
                      void navigate({ to: `/engagements/${event.engagement_id}` })
                    }
                  }}
                />
              ))}
            </div>
            {hasMore && (
              <Button
                variant="link"
                size="sm"
                className="text-sm font-semibold px-0 mt-1"
                onClick={(): void => toggleGroup(group)}
              >
                {isExpanded
                  ? t('zones.timeline.show_less', { defaultValue: 'Show less' })
                  : t('zones.timeline.show_all')}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
