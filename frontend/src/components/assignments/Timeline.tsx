import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ListChecks,
  User,
  ArrowRight,
} from 'lucide-react'
import type { Database } from '@/types/database'

type AssignmentEvent = Database['public']['Tables']['assignment_events']['Row']

interface TimelineProps {
  events: AssignmentEvent[]
  getUserName?: (userId: string) => string
}

export function Timeline({ events, getUserName }: TimelineProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'

  const formatTimestamp = (timestamp: string): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
  }

  const getEventIcon = (eventType: string): React.JSX.Element => {
    switch (eventType) {
      case 'created':
        return <CheckCircle2 className="h-4 w-4" />
      case 'status_changed':
        return <ArrowRight className="h-4 w-4" />
      case 'escalated':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'commented':
        return <MessageSquare className="h-4 w-4" />
      case 'checklist_updated':
        return <ListChecks className="h-4 w-4" />
      case 'observer_added':
        return <User className="h-4 w-4" />
      case 'reassigned':
        return <ArrowRight className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'created':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'escalated':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400'
      case 'status_changed':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  const isCriticalEvent = (eventType: string): boolean => {
    return ['escalated', 'completed', 'created'].includes(eventType)
  }

  const getEventDescription = (event: AssignmentEvent): string => {
    const actorName =
      getUserName && event.actor_user_id
        ? getUserName(event.actor_user_id)
        : t('timeline.unknownUser')

    const eventData = event.event_data as any

    switch (event.event_type) {
      case 'created':
        return t('timeline.event_created', { actor: actorName })
      case 'status_changed':
        return t('timeline.event_status_changed', {
          actor: actorName,
          oldStatus: eventData?.old_status,
          newStatus: eventData?.new_status,
        })
      case 'escalated':
        return t('timeline.event_escalated', {
          actor: actorName,
          reason: eventData?.reason || '',
        })
      case 'completed':
        return t('timeline.event_completed', { actor: actorName })
      case 'commented':
        return t('timeline.event_commented', { actor: actorName })
      case 'checklist_updated':
        return t('timeline.event_checklist_updated', {
          actor: actorName,
          progress: eventData?.progress_percentage || 0,
        })
      case 'observer_added':
        return t('timeline.event_observer_added', { actor: actorName })
      case 'reassigned':
        return t('timeline.event_reassigned', { actor: actorName })
      default:
        return t('timeline.event_unknown', { type: event.event_type })
    }
  }

  // Sort events by created_at DESC (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('timeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className="h-[400px]"
          role="feed"
          aria-label={t('timeline.ariaLabel')}
          aria-live="polite"
        >
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('timeline.empty')}</div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline Line */}
              <div
                className={`absolute ${
                  isRTL ? 'right-[19px]' : 'left-[19px]'
                } top-0 bottom-0 w-px bg-border`}
              />

              {/* Events */}
              {sortedEvents.map((event, index) => (
                <article
                  key={event.id}
                  className="relative flex gap-4"
                  aria-posinset={index + 1}
                  aria-setsize={sortedEvents.length}
                  tabIndex={0}
                >
                  {/* Event Icon */}
                  <div
                    className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(
                      event.event_type,
                    )} ${isCriticalEvent(event.event_type) ? 'ring-2 ring-offset-2' : ''}`}
                  >
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{getEventDescription(event)}</p>
                        <time className="text-xs text-muted-foreground">
                          {formatTimestamp(event.created_at)}
                        </time>
                      </div>
                      {isCriticalEvent(event.event_type) && (
                        <Badge variant="outline" className="text-xs">
                          {t(`timeline.type_${event.event_type}`)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
