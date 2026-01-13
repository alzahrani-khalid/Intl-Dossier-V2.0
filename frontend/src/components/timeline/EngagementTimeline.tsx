/**
 * EngagementTimeline Component
 *
 * Type-specific timeline wrapper for Engagement dossiers
 * Default event types:
 * - Calendar events (primary) - event schedule, sessions
 * - Commitments - action items
 * - Decisions - outcomes
 * - Documents - agendas, minutes
 *
 * When no events exist, shows the milestone planning tool to allow
 * users to project future events, set policy deadlines, and schedule
 * relationship reviews - creating forward-looking timeline content.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { EnhancedVerticalTimeline } from './EnhancedVerticalTimeline'
import { TimelineFilters } from './TimelineFilters'
import { MilestonePlannerEmptyState } from '@/components/milestone-planning'
import {
  useUnifiedTimeline,
  getDefaultEventTypes,
  getAvailableEventTypes,
} from '@/hooks/useUnifiedTimeline'
import { useMilestonePlanning } from '@/hooks/useMilestonePlanning'
import type { TimelineFilters as ITimelineFilters } from '@/types/timeline.types'

interface EngagementTimelineProps {
  dossierId: string
  className?: string
}

export function EngagementTimeline({ dossierId, className }: EngagementTimelineProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)

  const defaultEventTypes = getDefaultEventTypes('Engagement')
  const availableEventTypes = getAvailableEventTypes('Engagement')

  const {
    events,
    isLoading: isLoadingTimeline,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
    filters,
    setFilters,
  } = useUnifiedTimeline({
    dossierId,
    dossierType: 'Engagement',
    initialFilters: {
      event_types: defaultEventTypes,
    },
    itemsPerPage: 20,
    enableRealtime: false,
  })

  // Use milestone planning hook for the empty state planner
  const {
    milestones,
    isLoading: isLoadingMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestonePlanning({
    dossierId,
    dossierType: 'Engagement',
    enabled: true,
  })

  // Handle mark complete
  const handleMarkComplete = useCallback(
    async (milestoneId: string) => {
      await updateMilestone(milestoneId, { status: 'completed' })
    },
    [updateMilestone],
  )

  // Handle convert to event
  const handleConvertToEvent = useCallback(
    async (milestoneId: string, eventType: string) => {
      const milestone = milestones.find((m) => m.id === milestoneId)
      if (!milestone) return

      // Mark as converted and update status
      await updateMilestone(milestoneId, {
        status: 'completed',
      })

      // Invalidate timeline queries to show the new event
      queryClient.invalidateQueries({ queryKey: ['calendar-entries', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['events', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['unified-timeline', dossierId] })
      refetch()
    },
    [milestones, updateMilestone, queryClient, dossierId, refetch],
  )

  const handleFiltersChange = (newFilters: ITimelineFilters) => {
    setFilters(newFilters)
  }

  const isLoading = isLoadingTimeline || isLoadingMilestones

  // Show milestone planner when no timeline events exist
  if (!isLoading && events.length === 0) {
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'} data-testid="event-timeline-section">
        <MilestonePlannerEmptyState
          dossierId={dossierId}
          dossierType="Engagement"
          milestones={milestones}
          isLoading={isLoadingMilestones}
          onCreateMilestone={createMilestone}
          onUpdateMilestone={updateMilestone}
          onDeleteMilestone={deleteMilestone}
          onMarkComplete={handleMarkComplete}
          onConvertToEvent={handleConvertToEvent}
        />
      </div>
    )
  }

  return (
    <div className={className} data-testid="event-timeline-section">
      <TimelineFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableEventTypes={availableEventTypes}
        defaultEventTypes={defaultEventTypes}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refetch}
      />

      <EnhancedVerticalTimeline
        events={events}
        isLoading={isLoadingTimeline}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={fetchNextPage}
        error={error}
        emptyMessage={t('timeline.empty.engagement')}
      />
    </div>
  )
}
