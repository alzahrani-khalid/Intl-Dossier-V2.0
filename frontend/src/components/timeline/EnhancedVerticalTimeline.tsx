/**
 * EnhancedVerticalTimeline Component
 *
 * Main timeline container using react-vertical-timeline-component:
 * - Infinite scroll pagination
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Dark/light mode theming
 * - Expandable cards with modal overlay
 * - Empty and loading states
 * - Accessibility compliant
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { VerticalTimeline } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '@/styles/vertical-timeline.css';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { EnhancedVerticalTimelineCard } from './EnhancedVerticalTimelineCard';
import type { UnifiedTimelineEvent } from '@/types/timeline.types';

interface EnhancedVerticalTimelineProps {
  events: UnifiedTimelineEvent[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  error?: Error | null;
  emptyMessage?: string;
  className?: string;
}

/**
 * Loading skeleton for timeline events
 */
function TimelineLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8 sm:space-y-12 py-8 sm:py-12">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative flex items-start gap-4 sm:gap-6 animate-pulse"
        >
          {/* Icon skeleton */}
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-5 sm:h-6 bg-muted rounded-md w-3/4" />
            <div className="h-4 bg-muted rounded-md w-1/2" />
            <div className="h-20 sm:h-24 bg-muted rounded-lg" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted rounded-full" />
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function TimelineEmptyState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 text-center px-4">
      <div className="rounded-full bg-muted p-8 sm:p-10 lg:p-12 mb-6 sm:mb-8">
        <Calendar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-muted-foreground" />
      </div>
      <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-3">
        {t('timeline.empty.title')}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md">
        {message || t('timeline.empty.description')}
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function TimelineErrorState({ error }: { error: Error }) {
  const { t } = useTranslation();
  return (
    <Alert variant="destructive" className="mb-6 mx-4">
      <AlertTitle>{t('timeline.error.title')}</AlertTitle>
      <AlertDescription className="text-start">
        {error.message || t('timeline.error.description')}
      </AlertDescription>
    </Alert>
  );
}

export function EnhancedVerticalTimeline({
  events,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  error,
  emptyMessage,
  className,
}: EnhancedVerticalTimelineProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Initial loading state
  if (isLoading) {
    return (
      <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <TimelineLoadingSkeleton count={5} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <TimelineErrorState error={error} />
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <TimelineEmptyState message={emptyMessage || ''} />
      </div>
    );
  }

  return (
    <div
      className={cn('w-full bg-background font-sans', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto">
        {/* Vertical Timeline */}
        <VerticalTimeline
          animate={true}
          layout="2-columns"
          lineColor={
            typeof window !== 'undefined' &&
            document.documentElement.getAttribute('data-color-mode') === 'dark'
              ? 'hsl(var(--border))'
              : 'hsl(var(--border))'
          }
        >
          {events.map((event, index) => (
            <EnhancedVerticalTimelineCard
              key={event.id}
              event={event}
              index={index}
            />
          ))}
        </VerticalTimeline>

        {/* Load More Trigger */}
        {hasNextPage && (
          <div
            ref={loadMoreRef}
            className="flex justify-center py-8 sm:py-10 lg:py-12 px-4"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-3 text-sm sm:text-base text-muted-foreground">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span>{t('timeline.loading_more')}</span>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="min-h-11 sm:min-h-10 px-6 sm:px-8"
                size="lg"
              >
                {t('timeline.load_more')}
              </Button>
            )}
          </div>
        )}

        {/* End of Timeline Indicator */}
        {!hasNextPage && events.length > 0 && (
          <div className="flex justify-center py-8 sm:py-10 lg:py-12 px-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-px w-24 bg-border" />
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {t('timeline.end')}
              </p>
              <div className="h-px w-24 bg-border" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








