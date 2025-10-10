import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Calendar, FileText, MessageSquare, Handshake, CheckCircle, Lightbulb, Link2 } from 'lucide-react';
import type { TimelineEvent } from '../types/dossier';

interface DossierTimelineProps {
  dossierId: string;
  events?: TimelineEvent[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

export function DossierTimeline({
  dossierId,
  events = [],
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: DossierTimelineProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage && onLoadMore) {
        onLoadMore();
      }
    },
    threshold: 0.1,
  });

  // Get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'engagement':
        return <Calendar className="h-4 w-4" />;
      case 'position':
        return <MessageSquare className="h-4 w-4" />;
      case 'mou':
        return <Handshake className="h-4 w-4" />;
      case 'commitment':
        return <CheckCircle className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'intelligence':
        return <Lightbulb className="h-4 w-4" />;
      case 'relationship':
        return <Link2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get badge color based on event type
  const getEventBadgeClass = (type: string): string => {
    switch (type) {
      case 'engagement':
        return 'bg-blue-100 text-blue-800';
      case 'position':
        return 'bg-purple-100 text-purple-800';
      case 'mou':
        return 'bg-green-100 text-green-800';
      case 'commitment':
        return 'bg-amber-100 text-amber-800';
      case 'document':
        return 'bg-gray-100 text-gray-800';
      case 'intelligence':
        return 'bg-rose-100 text-rose-800';
      case 'relationship':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Subscribe to Realtime updates for relationship events
  useEffect(() => {
    if (!dossierId) return;

    // Subscribe to dossier_relationships table
    const channel = supabase
      .channel(`dossier_relationships:${dossierId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dossier_relationships',
          filter: `parent_dossier_id=eq.${dossierId},child_dossier_id=eq.${dossierId}`,
        },
        () => {
          // Debounce invalidation to avoid too many refetches
          const timeoutId = setTimeout(() => {
            // Trigger refetch by calling onLoadMore if available
            // In practice, this would call queryClient.invalidateQueries(['timeline', dossierId])
            // but we're keeping it simple here
            if (onLoadMore) {
              onLoadMore();
            }
          }, 500);

          return () => clearTimeout(timeoutId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dossierId, onLoadMore]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label={t('loading')}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t('timeline.empty')}</h3>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      role="feed"
      aria-label={t('timeline.title')}
      aria-live="polite"
      aria-busy={isFetchingNextPage}
    >
      {events.map((event, index) => {
        const title = isRTL ? event.event_title_ar : event.event_title_en;
        const description = isRTL
          ? event.event_description_ar
          : event.event_description_en;
        const eventDate = new Date(event.event_date);

        return (
          <article
            key={`${event.event_type}-${event.source_id}-${index}`}
            className="flex gap-4 group"
            role="article"
            aria-label={`${t(`timeline.types.${event.event_type}`)}: ${title}`}
          >
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${getEventBadgeClass(event.event_type)}`}
                aria-hidden="true"
              >
                {getEventIcon(event.event_type)}
              </div>
              {index < events.length - 1 && (
                <div className="h-full w-px bg-border mt-2" aria-hidden="true" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-8 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <Badge
                    className={`${getEventBadgeClass(event.event_type)} mb-2`}
                    aria-label={t(`timeline.types.${event.event_type}`)}
                  >
                    {t(`timeline.types.${event.event_type}`)}
                  </Badge>
                  <h3 className="font-semibold text-base leading-tight mb-1 break-words">
                    {title}
                  </h3>
                </div>
                <time
                  dateTime={event.event_date}
                  className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0"
                >
                  {eventDate.toLocaleDateString(i18n.language, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>

              {description && (
                <p className="text-sm text-muted-foreground break-words">
                  {description}
                </p>
              )}

              {/* Metadata badges */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {Object.entries(event.metadata).map(([key, value]) => {
                    if (value && typeof value === 'string') {
                      return (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs"
                          aria-label={`${key}: ${value}`}
                        >
                          {key}: {value}
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </article>
        );
      })}

      {/* Load more trigger */}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-4"
          role="status"
          aria-label={isFetchingNextPage ? t('loading') : t('timeline.loadMore')}
        >
          {isFetchingNextPage ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t('timeline.loadMore')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}