/**
 * CalendarEventsSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays calendar events linked to the dossier.
 * Mobile-first, RTL-supported.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  CalendarClock,
  CalendarCheck,
  CalendarX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  CalendarEventsSectionProps,
  DossierCalendarEvent,
  CalendarEventType,
} from '@/types/dossier-overview.types'

/**
 * Get icon for event type
 */
function getEventTypeIcon(type: CalendarEventType) {
  const icons: Record<CalendarEventType, React.ElementType> = {
    meeting: Calendar,
    deadline: Clock,
    milestone: CalendarCheck,
    reminder: CalendarClock,
    engagement: Calendar,
    review: CalendarCheck,
  }
  return icons[type] || Calendar
}

/**
 * Get event type color
 */
function getEventTypeColor(type: CalendarEventType) {
  const colors: Record<CalendarEventType, string> = {
    meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    deadline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    milestone: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    engagement: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    review: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  }
  return colors[type] || colors.meeting
}

/**
 * Format date and time
 */
function formatEventTime(
  startDatetime: string,
  endDatetime: string | null,
  isAllDay: boolean,
  locale: string,
): string {
  const start = new Date(startDatetime)

  if (isAllDay) {
    return start.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const dateFormat: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }

  const formattedDate = start.toLocaleDateString(locale, dateFormat)
  const formattedStart = start.toLocaleTimeString(locale, timeFormat)

  if (endDatetime) {
    const end = new Date(endDatetime)
    const formattedEnd = end.toLocaleTimeString(locale, timeFormat)
    return `${formattedDate}, ${formattedStart} - ${formattedEnd}`
  }

  return `${formattedDate}, ${formattedStart}`
}

/**
 * Event card component
 */
function EventCard({
  event,
  isRTL,
  variant = 'default',
}: {
  event: DossierCalendarEvent
  isRTL: boolean
  variant?: 'default' | 'today' | 'past'
}) {
  const { t, i18n } = useTranslation('dossier-overview')
  const Icon = getEventTypeIcon(event.event_type)
  const locale = isRTL ? 'ar-SA' : 'en-US'

  const variantStyles = {
    default: '',
    today: 'border-primary bg-primary/5',
    past: 'opacity-60',
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${variantStyles[variant]}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getEventTypeColor(event.event_type)} shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold line-clamp-2">
                {isRTL && event.title_ar ? event.title_ar : event.title_en}
              </h4>
              {variant === 'today' && (
                <Badge variant="default" className="text-xs shrink-0">
                  {t('calendarEvents.today')}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs mb-2">
              <Badge variant="outline" className="text-xs">
                {t(`eventType.${event.event_type}`)}
              </Badge>
              {event.is_all_day && (
                <Badge variant="secondary" className="text-xs">
                  {t('calendarEvents.allDay')}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatEventTime(
                    event.start_datetime,
                    event.end_datetime,
                    event.is_all_day,
                    locale,
                  )}
                </span>
              </div>
              {(event.location_en || event.location_ar) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{isRTL && event.location_ar ? event.location_ar : event.location_en}</span>
                </div>
              )}
              {event.is_virtual && event.meeting_link && (
                <div className="flex items-center gap-2">
                  <Video className="h-3 w-3 shrink-0" />
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {t('calendarEvents.joinMeeting')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            {event.description_en && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {isRTL && event.description_ar ? event.description_ar : event.description_en}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component
 */
function EmptyState({
  type,
  isRTL,
}: {
  type?: 'upcoming' | 'today' | 'past' | 'all'
  isRTL: boolean
}) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="text-center py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-3 rounded-full bg-muted inline-block mb-3">
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {type ? t(`calendarEvents.empty.${type}`) : t('calendarEvents.empty.all')}
      </p>
    </div>
  )
}

/**
 * Event list component
 */
function EventList({
  events,
  isRTL,
  variant = 'default',
  emptyType,
}: {
  events: DossierCalendarEvent[]
  isRTL: boolean
  variant?: 'default' | 'today' | 'past'
  emptyType?: 'upcoming' | 'today' | 'past' | 'all'
}) {
  if (events.length === 0) {
    return <EmptyState type={emptyType} isRTL={isRTL} />
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isRTL={isRTL} variant={variant} />
      ))}
    </div>
  )
}

/**
 * Main CalendarEventsSection component
 */
export function CalendarEventsSection({
  data,
  isLoading,
  isRTL = false,
  className = '',
}: CalendarEventsSectionProps) {
  const { t } = useTranslation('dossier-overview')

  // Combine all events for the "All" tab
  const allEvents = useMemo(() => {
    if (!data) return []
    return [...data.today, ...data.upcoming, ...data.past].sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
    )
  }, [data])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('calendarEvents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <EmptyState type="all" isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('calendarEvents.title')}
          <Badge variant="secondary">{data.total_count}</Badge>
          {data.today.length > 0 && (
            <Badge variant="default">
              {data.today.length} {t('calendarEvents.today')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        <Tabs defaultValue={data.today.length > 0 ? 'today' : 'upcoming'} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4 h-auto p-1">
            <TabsTrigger value="today" className="text-xs sm:text-sm shrink-0">
              <CalendarCheck className="h-4 w-4 me-1" />
              {t('calendarEvents.tabs.today')} ({data.today.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm shrink-0">
              <CalendarClock className="h-4 w-4 me-1" />
              {t('calendarEvents.tabs.upcoming')} ({data.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs sm:text-sm shrink-0">
              <CalendarX className="h-4 w-4 me-1" />
              {t('calendarEvents.tabs.past')} ({data.past.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm shrink-0">
              {t('calendarEvents.tabs.all')} ({allEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <EventList events={data.today} isRTL={isRTL} variant="today" emptyType="today" />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0">
            <EventList events={data.upcoming} isRTL={isRTL} emptyType="upcoming" />
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <EventList events={data.past} isRTL={isRTL} variant="past" emptyType="past" />
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <EventList events={allEvents} isRTL={isRTL} emptyType="all" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CalendarEventsSection
