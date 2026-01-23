/**
 * AceternityTimelineCard Component
 *
 * Expandable card for timeline events with modal overlay
 * Based on Aceternity UI expandable-card component with:
 * - Modal/overlay expansion on click
 * - Escape key and outside-click to close
 * - Event icon and metadata display
 * - Participant avatars and attachments
 * - Mobile-first responsive design
 * - RTL support with logical properties
 */

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
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

interface AceternityTimelineCardProps {
  event: UnifiedTimelineEvent;
  index: number;
  isEven: boolean;
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
 * Get event type color for icon background
 */
const getEventColor = (eventType: string, metadata: any): string => {
  // Use metadata color if available, otherwise default colors
  if (metadata.color) {
    return metadata.color;
  }

  const colorMap: Record<string, string> = {
    calendar: 'blue',
    interaction: 'purple',
    intelligence: 'orange',
    document: 'gray',
    mou: 'green',
    position: 'indigo',
    relationship: 'pink',
    commitment: 'teal',
    decision: 'red',
  };
  return colorMap[eventType] || 'gray';
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

export function AceternityTimelineCard({ event, index, isEven }: AceternityTimelineCardProps) {
  const { t, i18n } = useTranslation('dossier');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [isActive, setIsActive] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const EventIcon = getEventIcon(event.event_type);
  const color = getEventColor(event.event_type, event.metadata);
  const title = isRTL ? event.title_ar : event.title_en;
  const description = isRTL ? event.description_ar : event.description_en;
  const formattedDate = formatEventDate(event.event_date, i18n.language);

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
              className="absolute end-4 top-4 z-[102] flex size-8 items-center justify-center rounded-full bg-white shadow-lg dark:bg-neutral-900"
              onClick={() => setIsActive(false)}
              aria-label={t('common.close')}
            >
              <CloseIcon />
            </motion.button>

            {/* Modal Card */}
            <motion.div
              layoutId={`card-${event.id}-${id}`}
              ref={ref}
              className="flex size-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl md:h-fit md:max-h-[90%]"
            >
              {/* Event Icon Header */}
              <div className={cn(
                "w-full h-32 sm:h-40 flex items-center justify-center",
                `bg-${color}-500 dark:bg-${color}-600`,
                "sm:rounded-t-3xl"
              )}>
                <EventIcon className="size-16 text-white sm:size-20" />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                {/* Title & Metadata */}
                <div className="border-b border-border p-4 sm:p-6">
                  <motion.h3
                    layoutId={`title-${event.id}-${id}`}
                    className="mb-2 text-start text-lg font-bold text-neutral-700 dark:text-neutral-200 sm:text-xl"
                  >
                    {title}
                  </motion.h3>

                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{formattedDate}</span>
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

                {/* Description & Details */}
                <div className="space-y-6 p-4 sm:p-6">
                  {/* Description */}
                  {description && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-pre-wrap text-start text-sm text-neutral-600 dark:text-neutral-400 sm:text-base"
                    >
                      {description}
                    </motion.div>
                  )}

                  {/* Location */}
                  {(event.metadata.location_en || event.metadata.location_ar) && (
                    <div className="flex items-start gap-3">
                      <MapPin className={cn('h-5 w-5 mt-0.5 text-muted-foreground', isRTL && 'rotate-180')} />
                      <div className="flex-1 text-start">
                        <p className="text-sm font-medium">{t('timeline.location')}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? event.metadata.location_ar : event.metadata.location_en}
                        </p>
                        {event.metadata.is_virtual && event.metadata.virtual_link && (
                          <a
                            href={event.metadata.virtual_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {t('timeline.join_virtual')}
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {event.metadata.participants && event.metadata.participants.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-start text-sm font-medium">{t('timeline.participants')}</p>
                      <div className="flex flex-wrap gap-2">
                        {event.metadata.participants.slice(0, 8).map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5"
                          >
                            <Avatar className="size-6">
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
                        {event.metadata.participants.length > 8 && (
                          <Badge variant="secondary" className="rounded-full">
                            +{event.metadata.participants.length - 8} {t('timeline.more')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {event.metadata.attachments && event.metadata.attachments.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-start text-sm font-medium">{t('timeline.attachments')}</p>
                      <div className="space-y-2">
                        {event.metadata.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm transition-colors hover:bg-muted/80"
                          >
                            <FileText className="size-5 text-muted-foreground" />
                            <span className="flex-1 truncate text-start font-medium">{attachment.filename}</span>
                            <Download className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intelligence-specific metadata */}
                  {event.event_type === 'intelligence' && event.metadata.confidence_score && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                      <span className="text-sm font-medium">{t('timeline.confidence')}:</span>
                      <Badge variant="outline" className="font-semibold">
                        {Math.round(event.metadata.confidence_score * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {event.metadata.navigation_url && (
                  <div className="border-t border-border p-4 sm:p-6">
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

      {/* Timeline Structure - Mobile & Desktop Layouts */}
      <div className={cn(
        "relative w-full flex justify-start",
        // Mobile: simple left-aligned layout
        "gap-4",
        // Desktop: centered timeline with alternating cards
        "md:gap-10"
      )} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* MOBILE LAYOUT: Date/Time + Dot on left, Card on right */}
        <div className="flex w-full gap-4 md:hidden">
          {/* Date/Time & Dot */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="text-center">
              <div className="whitespace-nowrap text-sm font-bold text-foreground">
                {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(event.event_date))}
              </div>
              <div className="whitespace-nowrap text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(event.event_date))}
              </div>
            </div>

            <div
              onClick={() => setIsActive(true)}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0",
                "shadow-lg hover:shadow-xl transition-all duration-200",
                "border-4 border-background",
                `bg-${color}-500 dark:bg-${color}-600`,
                "hover:scale-110 active:scale-95"
              )}
            >
              <EventIcon className="size-5 text-white" />
            </div>
          </div>

          {/* Card */}
          <motion.div
            layoutId={`card-${event.id}-${id}`}
            onClick={() => setIsActive(true)}
            className="flex-1 cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
          >
            <div className="space-y-2">
              <motion.h4
                layoutId={`title-${event.id}-${id}`}
                className="text-start text-base font-semibold text-card-foreground"
              >
                {title}
              </motion.h4>

              {description && (
                <p className="line-clamp-2 text-start text-sm text-muted-foreground">
                  {description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                  {t(`timeline.priority.${event.priority}`)}
                </Badge>
                {event.status && (
                  <Badge variant="outline" className={getStatusColor(event.status)}>
                    {t(`timeline.status.${event.status}`)}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* DESKTOP LAYOUT: Alternating Cards with Centered Timeline */}
        <div className={cn(
          "hidden md:flex w-full justify-start items-start gap-10",
          // Position content based on alternation
          isEven ? "flex-row" : "flex-row-reverse"
        )}>
          {/* Card Section */}
          <motion.div
            layoutId={`card-${event.id}-${id}`}
            onClick={() => setIsActive(true)}
            className="w-[calc(50%-5rem)] cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md sm:p-6"
          >
            <div className="space-y-3">
              <motion.h4
                layoutId={`title-${event.id}-${id}`}
                className={cn(
                  "font-semibold text-lg text-card-foreground",
                  isEven ? "text-end" : "text-start"
                )}
              >
                {title}
              </motion.h4>

              {description && (
                <p className={cn(
                  "text-sm text-muted-foreground line-clamp-2",
                  isEven ? "text-end" : "text-start"
                )}>
                  {description}
                </p>
              )}

              <div className={cn(
                "flex flex-wrap gap-2 pt-1",
                isEven ? "justify-end" : "justify-start"
              )}>
                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                  {t(`timeline.priority.${event.priority}`)}
                </Badge>
                {event.status && (
                  <Badge variant="outline" className={getStatusColor(event.status)}>
                    {t(`timeline.status.${event.status}`)}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Date/Time Section (between card and dot) */}
          <div className={cn(
            "sticky top-40 flex flex-col items-center z-40 flex-shrink-0",
            isEven ? "text-start" : "text-end"
          )}>
            <motion.time className="whitespace-nowrap text-xl font-bold text-foreground lg:text-2xl">
              {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                month: 'short',
                day: 'numeric',
              }).format(new Date(event.event_date))}
            </motion.time>
            <motion.time className="whitespace-nowrap text-base text-muted-foreground">
              {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(event.event_date))}
            </motion.time>
          </div>

          {/* Timeline Dot (centered) */}
          <div className="sticky top-40 z-40 flex shrink-0 items-center justify-center">
            <div
              onClick={() => setIsActive(true)}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center cursor-pointer",
                "shadow-lg hover:shadow-xl transition-all duration-200",
                "border-4 border-background",
                `bg-${color}-500 dark:bg-${color}-600`,
                "hover:scale-110 active:scale-95"
              )}
            >
              <EventIcon className="size-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
