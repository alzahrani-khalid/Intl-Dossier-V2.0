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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react'
import { MilestonePlannerEmptyState } from '@/components/milestone-planning'
import { useMilestonePlanning } from '@/hooks/useMilestonePlanning'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlannedMilestone } from '@/types/milestone-planning.types'

interface CalendarEntry {
  id: string
  entry_type: string
  title_en: string | null
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  start_datetime: string
  end_datetime: string | null
  all_day: boolean
  location: string | null
  linked_item_type: string | null
  linked_item_id: string | null
  created_at: string
}

interface EventTimelineProps {
  dossierId: string
  dossierType?: PlannedMilestone['dossier_type']
}

export function EventTimeline({ dossierId, dossierType = 'Engagement' }: EventTimelineProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const dateLocale = isRTL ? arSA : enUS

  // Fetch calendar entries for this dossier
  const { data: calendarEntries = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['calendar-entries', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('linked_item_id', dossierId)
        .order('start_datetime', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Failed to fetch calendar entries:', error)
        return []
      }

      return data as CalendarEntry[]
    },
    enabled: !!dossierId,
  })

  // Use the milestone planning hook
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone } =
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
    async (milestoneId: string) => {
      // Get the milestone
      const milestone = milestones.find((m) => m.id === milestoneId)
      if (!milestone) return

      // Mark as converted and update status
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

  // Get entry type badge color
  const getEntryTypeBadge = (entryType: string) => {
    const colors: Record<string, string> = {
      internal_meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      deadline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      holiday: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      training: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      review: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return colors[entryType] || colors.other
  }

  // Show loading state
  if (isLoadingEvents || isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If no calendar entries, show milestone planner
  if (calendarEntries.length === 0) {
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

  // Render calendar entries timeline
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'} data-testid="event-timeline-section">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-border" />

        {calendarEntries.map((entry, _index) => {
          const title = isRTL ? entry.title_ar || entry.title_en : entry.title_en || entry.title_ar
          const description = isRTL
            ? entry.description_ar || entry.description_en
            : entry.description_en || entry.description_ar

          return (
            <div key={entry.id} className="relative ps-10 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div className="absolute start-2.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn('text-xs', getEntryTypeBadge(entry.entry_type))}>
                        {t(`calendar.entryTypes.${entry.entry_type}`, entry.entry_type)}
                      </Badge>
                      {entry.all_day && (
                        <Badge variant="outline" className="text-xs">
                          {t('calendar.allDay')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(entry.start_datetime), 'PPP', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-medium text-sm sm:text-base mb-1 text-start">
                    {title || t('calendar.untitled')}
                  </h4>

                  {description && (
                    <p className="text-sm text-muted-foreground text-start line-clamp-2">
                      {description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    {!entry.all_day && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(entry.start_datetime), 'p', { locale: dateLocale })}
                          {entry.end_datetime && (
                            <>
                              {' '}
                              - {format(new Date(entry.end_datetime), 'p', { locale: dateLocale })}
                            </>
                          )}
                        </span>
                      </div>
                    )}
                    {entry.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{entry.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
