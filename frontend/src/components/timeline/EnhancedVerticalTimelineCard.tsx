/**
 * EnhancedVerticalTimelineCard Component
 *
 * Timeline card using react-vertical-timeline-component with:
 * - Expandable modal overlay (Aceternity UI inspired)
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Dark/light mode theming
 * - Touch-friendly interactions (44x44px minimum)
 */

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { VerticalTimelineElement } from 'react-vertical-timeline-component';
import {
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
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { cn } from '@/lib/utils';
import type { UnifiedTimelineEvent } from '@/types/timeline.types';

interface EnhancedVerticalTimelineCardProps {
  event: UnifiedTimelineEvent;
  index: number;
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
 * Get event type color class
 */
const getEventColor = (eventType: string): string => {
  const colorMap: Record<string, string> = {
    calendar: 'timeline-icon-calendar',
    interaction: 'timeline-icon-interaction',
    intelligence: 'timeline-icon-intelligence',
    document: 'timeline-icon-document',
    mou: 'timeline-icon-mou',
    position: 'timeline-icon-position',
    relationship: 'timeline-icon-relationship',
    commitment: 'timeline-icon-commitment',
    decision: 'timeline-icon-decision',
  };
  return colorMap[eventType] || 'timeline-icon-calendar';
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
  }).format(date);
};

/**
 * Format time for display
 */
const formatEventTime = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Close icon component
 */
function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-black dark:text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}

export function EnhancedVerticalTimelineCard({
  event,
  index,
}: EnhancedVerticalTimelineCardProps) {
  const { t, i18n } = useTranslation('dossier');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [isActive, setIsActive] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const EventIcon = getEventIcon(event.event_type);
  const eventColorClass = getEventColor(event.event_type);
  const title = isRTL ? event.title_ar : event.title_en;
  const description = isRTL ? event.description_ar : event.description_en;
  const formattedDate = formatEventDate(event.event_date, i18n.language);
  const formattedTime = formatEventTime(event.event_date, i18n.language);

  // Handle escape key and body overflow
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsActive(false);
      }
    }

    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive]);

  useOutsideClick(ref, () => setIsActive(false));

  const handleNavigate = () => {
    if (event.metadata.navigation_url) {
      setIsActive(false);
      navigate({ to: event.metadata.navigation_url });
    }
  };

  const handleCardClick = () => {
    setIsActive(true);
  };

  return (
    <>
      {/* Modal Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] size-full bg-black/20 backdrop-blur-sm dark:bg-black/40"
          />
        )}
      </AnimatePresence>

      {/* Modal Content */}
      <AnimatePresence>
        {isActive && (
          <div className="fixed inset-0 z-[101] grid place-items-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Close Button */}
            <motion.button
              key={`button-${event.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute end-4 top-4 z-[102] flex size-10 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              onClick={() => setIsActive(false)}
              aria-label={t('common.close')}
            >
              <CloseIcon />
            </motion.button>

            {/* Modal Card */}
            <motion.div
              layoutId={`card-${event.id}-${id}`}
              ref={ref}
              className="flex size-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl md:h-fit md:max-h-[90%]"
            >
              {/* Event Icon Header */}
              <div className={cn(
                "w-full h-32 sm:h-40 flex items-center justify-center",
                eventColorClass,
                "sm:rounded-t-3xl relative overflow-hidden"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <EventIcon className="relative z-10 size-16 text-white sm:size-20" />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                {/* Title & Metadata */}
                <div className="border-b border-border p-4 sm:p-6">
                  <motion.h3
                    layoutId={`title-${event.id}-${id}`}
                    className="mb-3 text-start text-xl font-bold text-neutral-700 dark:text-neutral-200 sm:text-2xl"
                  >
                    {title}
                  </motion.h3>

                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span className="font-medium">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn(getPriorityColor(event.priority), "text-xs")}>
                      {t(`timeline.priority.${event.priority}`)}
                    </Badge>
                    {event.status && (
                      <Badge variant="outline" className={cn(getStatusColor(event.status), "text-xs")}>
                        {t(`timeline.status.${event.status}`)}
                      </Badge>
                    )}
                    {event.metadata.badge_text_en && (
                      <Badge variant="secondary" className="text-xs">
                        {isRTL ? event.metadata.badge_text_ar : event.metadata.badge_text_en}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description & Details */}
                <div className="space-y-6 p-4 sm:p-6">
                  {/* Description */}
                  {description && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-pre-wrap text-start text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base"
                    >
                      {description}
                    </motion.div>
                  )}

                  {/* Location */}
                  {(event.metadata.location_en || event.metadata.location_ar) && (
                    <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
                      <MapPin className={cn('h-5 w-5 mt-0.5 text-primary', isRTL && 'rotate-180')} />
                      <div className="flex-1 text-start">
                        <p className="mb-1 text-sm font-semibold">{t('timeline.location')}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? event.metadata.location_ar : event.metadata.location_en}
                        </p>
                        {event.metadata.is_virtual && event.metadata.virtual_link && (
                          <a
                            href={event.metadata.virtual_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            {t('timeline.join_virtual')}
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {event.metadata.participants && event.metadata.participants.length > 0 && (
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-start text-sm font-semibold">
                        <Users className="size-4" />
                        {t('timeline.participants')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {event.metadata.participants.slice(0, 10).map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                          >
                            <Avatar className="size-7">
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
                            <span className="text-xs font-medium sm:text-sm">
                              {isRTL ? participant.name_ar : participant.name_en}
                            </span>
                          </div>
                        ))}
                        {event.metadata.participants.length > 10 && (
                          <Badge variant="secondary" className="rounded-full">
                            +{event.metadata.participants.length - 10} {t('timeline.more')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {event.metadata.attachments && event.metadata.attachments.length > 0 && (
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-start text-sm font-semibold">
                        <FileText className="size-4" />
                        {t('timeline.attachments')}
                      </p>
                      <div className="space-y-2">
                        {event.metadata.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm transition-colors hover:bg-muted/80"
                          >
                            <FileText className="size-5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-start font-medium">{attachment.filename}</span>
                            <Download className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intelligence-specific metadata */}
                  {event.event_type === 'intelligence' && event.metadata.confidence_score && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                      <TrendingUp className="size-5 text-primary" />
                      <span className="text-sm font-medium">{t('timeline.confidence')}:</span>
                      <Badge variant="outline" className="font-semibold">
                        {Math.round(event.metadata.confidence_score * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {event.metadata.navigation_url && (
                  <div className="border-t border-border bg-muted/30 p-4 sm:p-6">
                    <Button
                      onClick={handleNavigate}
                      className="min-h-11 w-full sm:min-h-10"
                      size="lg"
                    >
                      {t('timeline.view_details')}
                      <ExternalLink className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Timeline Element */}
      <VerticalTimelineElement
        className={cn(
          'vertical-timeline-element',
          event.priority === 'high' && 'timeline-priority-high'
        )}
        contentStyle={{
          cursor: 'pointer',
        }}
        contentArrowStyle={{
          borderRight: '7px solid hsl(var(--border))',
        }}
        date={formattedDate}
        iconStyle={{
          cursor: 'pointer',
        }}
        icon={<EventIcon className="size-5 sm:size-6" />}
        iconClassName={eventColorClass}
        onTimelineElementClick={handleCardClick}
      >
        <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Date - Prominent Display for Single-Side Layout (Mobile & Tablet up to 1169px) */}
          <div className="mb-3 border-b border-border pb-3 xl:hidden">
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="size-4 shrink-0 sm:size-5" />
              <span className="text-base font-bold sm:text-lg">{formattedDate}</span>
            </div>
            <div className="ms-6 mt-1 flex items-center gap-2 text-muted-foreground sm:ms-7">
              <Clock className="size-3.5 sm:size-4" />
              <span className="text-sm sm:text-base">{formattedTime}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h3 className="vertical-timeline-element-title flex-1 text-start">
              {title}
            </h3>
          </div>

          {/* Time - Desktop Only (date is shown by library on 2-column layout) */}
          <h4 className="vertical-timeline-element-subtitle hidden items-center gap-2 text-start xl:flex">
            <Clock className="size-3.5" />
            {formattedTime}
          </h4>

          {description && (
            <p className="line-clamp-2 text-start">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className={cn(getPriorityColor(event.priority), "text-xs")}>
              {t(`timeline.priority.${event.priority}`)}
            </Badge>
            {event.status && (
              <Badge variant="outline" className={cn(getStatusColor(event.status), "text-xs")}>
                {t(`timeline.status.${event.status}`)}
              </Badge>
            )}
          </div>

          {/* Quick info indicators */}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            {event.metadata.participants && event.metadata.participants.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {event.metadata.participants.length}
              </span>
            )}
            {event.metadata.attachments && event.metadata.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="size-3.5" />
                {event.metadata.attachments.length}
              </span>
            )}
            {(event.metadata.location_en || event.metadata.location_ar) && (
              <span className="flex items-center gap-1">
                <MapPin className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                {event.metadata.is_virtual ? t('timeline.virtual') : t('timeline.in_person')}
              </span>
            )}
          </div>
        </div>
      </VerticalTimelineElement>
    </>
  );
}

