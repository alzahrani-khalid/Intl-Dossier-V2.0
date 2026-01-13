/**
 * EventsWidget Component
 *
 * Displays upcoming events and deadlines in a scrollable list.
 * Supports filtering by event type and RTL layout.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Users, FileText, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { EventsWidgetConfig, EventData, EventType } from '@/types/dashboard-widget.types'

interface EventsWidgetProps {
  config: EventsWidgetConfig
  data: EventData[] | null
  isLoading?: boolean
}

/**
 * Get icon component for event type
 */
function getEventIcon(type: EventType) {
  switch (type) {
    case 'meeting':
      return Users
    case 'deadline':
      return AlertCircle
    case 'follow-up':
      return Clock
    case 'engagement':
      return FileText
    case 'mou-renewal':
      return FileText
    default:
      return Calendar
  }
}

/**
 * Get color classes for event type
 */
function getEventColor(type: EventType) {
  switch (type) {
    case 'meeting':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      }
    case 'deadline':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      }
    case 'follow-up':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      }
    case 'engagement':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      }
    case 'mou-renewal':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      }
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
      }
  }
}

/**
 * Format relative date for events
 */
function formatRelativeDate(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  // Use Intl.RelativeTimeFormat for localized relative time
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffDays === 0) {
    // Same day - show time
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diffDays === 1) {
    return rtf.format(1, 'day')
  } else if (diffDays === -1) {
    return rtf.format(-1, 'day')
  } else if (diffDays > 0 && diffDays <= 7) {
    return rtf.format(diffDays, 'day')
  } else if (diffDays < 0 && diffDays >= -7) {
    return rtf.format(diffDays, 'day')
  } else {
    // Show date
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }
}

/**
 * Single event item component
 */
function EventItem({ event, locale, isRTL }: { event: EventData; locale: string; isRTL: boolean }) {
  const { t } = useTranslation('dashboard-widgets')
  const Icon = getEventIcon(event.type)
  const colors = getEventColor(event.type)

  const isPast = new Date(event.startDate) < new Date()
  const relativeDate = formatRelativeDate(event.startDate, locale)

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 sm:p-3 rounded-lg transition-colors',
        'hover:bg-muted/50 cursor-pointer group',
        isPast && 'opacity-60',
      )}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg shrink-0', colors.bg)}>
        <Icon className={cn('h-4 w-4', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium truncate">{event.title}</h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeDate}</span>
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', colors.badge)}>
            {t(`eventTypes.${event.type}`)}
          </Badge>
          {event.priority === 'high' && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {t('settings.kpi.targetValue')}
            </Badge>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        className={cn(
          'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
          isRTL && 'rotate-180',
        )}
      />
    </div>
  )
}

export function EventsWidget({ config, data, isLoading }: EventsWidgetProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? 'ar-SA' : 'en-US'

  const { settings } = config

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    if (!data) return []

    let events = [...data]

    // Filter by event types if not "all"
    if (!settings.eventTypes.includes('all')) {
      events = events.filter((e) => settings.eventTypes.includes(e.type))
    }

    // Filter past events if setting is disabled
    if (!settings.showPastEvents) {
      events = events.filter((e) => new Date(e.startDate) >= new Date())
    }

    // Sort by start date
    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    // Limit items
    return events.slice(0, settings.maxItems)
  }, [data, settings])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-muted rounded mb-1" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!filteredEvents.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('emptyStates.noEvents')}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {filteredEvents.map((event) => (
          <EventItem key={event.id} event={event} locale={locale} isRTL={isRTL} />
        ))}
      </div>
    </ScrollArea>
  )
}

export default EventsWidget
