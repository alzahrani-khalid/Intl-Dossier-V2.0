/**
 * TimelineEventCard Component
 *
 * Expandable card for timeline events
 * Features:
 * - Collapsed/expanded states
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Dark/light mode theming
 * - Touch-friendly interactions (min 44x44px)
 * - Navigation to related entities
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  FileText,
  Briefcase,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { UnifiedTimelineEvent } from '@/types/timeline.types';

interface TimelineEventCardProps {
  event: UnifiedTimelineEvent;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

/**
 * Get icon component based on event type
 */
const getEventIcon = (eventType: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    calendar: Calendar,
    interaction: Users,
    intelligence: TrendingUp,
    document: FileText,
    mou: Briefcase,
    position: Target,
    relationship: Users,
    commitment: CheckCircle2,
    decision: AlertCircle,
  };
  return iconMap[eventType] || Calendar;
};

/**
 * Get priority color classes
 */
const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return colorMap[priority] || colorMap.low;
};

/**
 * Get status color classes
 */
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    planned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    ongoing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    postponed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return colorMap[status] || colorMap.planned;
};

/**
 * Format date for display
 */
const formatEventDate = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function TimelineEventCard({ event, isFirst, isLast, className }: TimelineEventCardProps) {
  const { t, i18n } = useTranslation('dossier');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);

  const EventIcon = getEventIcon(event.event_type);
  const title = isRTL ? event.title_ar : event.title_en;
  const description = isRTL ? event.description_ar : event.description_en;
  const formattedDate = formatEventDate(event.event_date, i18n.language);

  const handleNavigate = () => {
    if (event.metadata.navigation_url) {
      navigate({ to: event.metadata.navigation_url });
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn('relative flex gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Timeline Line & Icon */}
      <div className="relative flex flex-col items-center">
        {/* Line Above (hidden for first item) */}
        {!isFirst && (
          <div className="absolute top-0 h-6 w-0.5 bg-border" style={{ insetBlockStart: 0 }} />
        )}

        {/* Event Icon */}
        <div
          className={cn(
            'z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-background',
            `bg-${event.metadata.color}-500 dark:bg-${event.metadata.color}-600`,
            'shadow-sm'
          )}
        >
          <EventIcon className="h-5 w-5 text-white" />
        </div>

        {/* Line Below (hidden for last item) */}
        {!isLast && (
          <div
            className="flex-1 w-0.5 bg-border"
            style={{ minHeight: isExpanded ? '200px' : '80px' }}
          />
        )}
      </div>

      {/* Event Card */}
      <Card
        className={cn(
          'flex-1 transition-all duration-200 hover:shadow-md',
          'mb-4 sm:mb-6',
          isExpanded && 'ring-2 ring-primary'
        )}
      >
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-1">
              <CardTitle className="text-base sm:text-lg text-start">{title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-start">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">{formattedDate}</span>
              </CardDescription>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getPriorityColor(event.priority)}>
                {t(`timeline.priority.${event.priority}`)}
              </Badge>
              {event.status && (
                <Badge variant="outline" className={getStatusColor(event.status)}>
                  {t(`timeline.status.${event.status}`)}
                </Badge>
              )}
              {event.metadata.badge_text_en && (
                <Badge variant="secondary">
                  {isRTL ? event.metadata.badge_text_ar : event.metadata.badge_text_en}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Collapsed State - Brief Description */}
          {!isExpanded && description && (
            <p className="text-sm text-muted-foreground text-start line-clamp-2">{description}</p>
          )}

          {/* Expanded State - Full Details */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Full Description */}
              {description && (
                <div className="text-sm text-start">
                  <p className="whitespace-pre-wrap">{description}</p>
                </div>
              )}

              {/* Location */}
              {(event.metadata.location_en || event.metadata.location_ar) && (
                <div className="flex items-start gap-2">
                  <MapPin className={cn('h-4 w-4 mt-0.5 text-muted-foreground', isRTL && 'rotate-180')} />
                  <div className="text-sm text-start">
                    <p className="font-medium">{t('timeline.location')}</p>
                    <p className="text-muted-foreground">
                      {isRTL ? event.metadata.location_ar : event.metadata.location_en}
                    </p>
                    {event.metadata.is_virtual && event.metadata.virtual_link && (
                      <a
                        href={event.metadata.virtual_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {t('timeline.join_virtual')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Participants */}
              {event.metadata.participants && event.metadata.participants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-start">{t('timeline.participants')}</p>
                  <div className="flex flex-wrap gap-2">
                    {event.metadata.participants.slice(0, 5).map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5"
                      >
                        <Avatar className="h-6 w-6">
                          {participant.avatar_url && <AvatarImage src={participant.avatar_url} />}
                          <AvatarFallback className="text-xs">
                            {(isRTL ? participant.name_ar : participant.name_en)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs sm:text-sm">
                          {isRTL ? participant.name_ar : participant.name_en}
                        </span>
                      </div>
                    ))}
                    {event.metadata.participants.length > 5 && (
                      <Badge variant="secondary" className="rounded-full">
                        +{event.metadata.participants.length - 5} {t('timeline.more')}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {event.metadata.attachments && event.metadata.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-start">{t('timeline.attachments')}</p>
                  <div className="space-y-1">
                    {event.metadata.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm hover:bg-muted/80 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-start truncate">{attachment.filename}</span>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Intelligence-specific metadata */}
              {event.event_type === 'intelligence' && event.metadata.confidence_score && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('timeline.confidence')}:</span>
                  <Badge variant="outline">
                    {Math.round(event.metadata.confidence_score * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {/* Expand/Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpand}
              className="min-h-11 sm:min-h-10 w-full sm:w-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('timeline.show_less')}
                </>
              ) : (
                <>
                  <ChevronDown className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('timeline.show_more')}
                </>
              )}
            </Button>

            {/* View Full Details Button */}
            {event.metadata.navigation_url && (
              <Button
                variant="default"
                size="sm"
                onClick={handleNavigate}
                className="min-h-11 sm:min-h-10 w-full sm:w-auto"
              >
                {t('timeline.view_details')}
                <ExternalLink className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
