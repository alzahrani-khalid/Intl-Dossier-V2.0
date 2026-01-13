/**
 * Event Timeline Section (Feature 028 - User Story 3 - T029)
 *
 * Displays chronological sequence of events for engagement.
 * When no events exist, shows the milestone planning tool to allow
 * users to project future events, set policy deadlines, and schedule
 * relationship reviews - creating forward-looking timeline content.
 *
 * Mobile-first layout with RTL support.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { MilestonePlannerEmptyState } from '@/components/milestone-planning'
import { useMilestonePlanning } from '@/hooks/useMilestonePlanning'
import type { PlannedMilestone } from '@/types/milestone-planning.types'

interface EventTimelineProps {
  dossierId: string
  dossierType?: PlannedMilestone['dossier_type']
}

export function EventTimeline({ dossierId, dossierType = 'Engagement' }: EventTimelineProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // Use the milestone planning hook
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone, refetch } =
    useMilestonePlanning({
      dossierId,
      dossierType,
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
      // Get the milestone
      const milestone = milestones.find((m) => m.id === milestoneId)
      if (!milestone) return

      // For now, mark as converted and update status
      await updateMilestone(milestoneId, {
        status: 'completed',
      })

      // Invalidate timeline queries to show potential new event
      queryClient.invalidateQueries({ queryKey: ['calendar-entries', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['events', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', dossierId] })
    },
    [milestones, updateMilestone, queryClient, dossierId],
  )

  // TODO: Fetch calendar entries from calendar_entries table
  // WHERE entity_type = 'engagement' AND entity_id = dossierId
  // For now, we rely on the milestone planning tool for empty state
  const events: any[] = []

  // If we have actual timeline events, render them
  // For now, always show the milestone planner which handles both
  // empty state and milestone management
  if (events.length === 0) {
    return (
      <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'} data-testid="event-timeline-section">
        <MilestonePlannerEmptyState
          dossierId={dossierId}
          dossierType={dossierType}
          milestones={milestones}
          isLoading={isLoading}
          onCreateMilestone={createMilestone}
          onUpdateMilestone={updateMilestone}
          onDeleteMilestone={deleteMilestone}
          onMarkComplete={handleMarkComplete}
          onConvertToEvent={handleConvertToEvent}
        />
      </div>
    )
  }

  // TODO: Render actual events when data is available
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'} data-testid="event-timeline-section">
      {/* Events will be rendered here */}
    </div>
  )
}
