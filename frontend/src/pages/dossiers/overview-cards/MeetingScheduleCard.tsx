/**
 * MeetingScheduleCard
 *
 * Working-group-specific card showing upcoming meetings.
 * Shows next 3 meetings with date and brief description.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

interface MeetingScheduleCardProps {
  dossierId: string
}

const MAX_MEETINGS = 3

export function MeetingScheduleCard({ dossierId }: MeetingScheduleCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['calendar_events'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-8" />
          ))}
        </div>
      </div>
    )
  }

  const upcomingEvents = (data?.calendar_events?.upcoming ?? []).slice(0, MAX_MEETINGS)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.meetings.title', { defaultValue: 'Upcoming Meetings' })}
        </h3>
      </div>

      {upcomingEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.meetings.empty', { defaultValue: 'No upcoming meetings' })}
        </p>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                {format(new Date(event.start_datetime), 'PP', { locale: dateLocale })}
              </span>
              <p className="text-sm flex-1 min-w-0 truncate">
                {(isRTL ? (event.title_ar ?? event.title_en) : event.title_en) ??
                  t('overview.meetings.untitled', { defaultValue: 'Meeting' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
