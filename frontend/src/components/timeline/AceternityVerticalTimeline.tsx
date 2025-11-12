/**
 * AceternityVerticalTimeline Component
 *
 * Vertical timeline with alternating cards (desktop) and modal expansion
 * Based on Aceternity UI timeline component with:
 * - Vertical line with dots at event positions
 * - Alternating left/right card layout (desktop md+)
 * - Mobile-first stacking (cards on one side on mobile)
 * - Infinite scroll pagination
 * - RTL support with logical properties
 * - Dark/light mode theming
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AceternityTimelineCard } from './AceternityTimelineCard';
import type { UnifiedTimelineEvent } from '@/types/timeline.types';

interface AceternityVerticalTimelineProps {
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
    <div className="space-y-10 md:space-y-20">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="relative flex justify-start md:gap-10">
          {/* Timeline dot skeleton */}
          <div className="absolute start-3 md:start-8 top-4 h-10 w-10 rounded-full border-4 border-background bg-muted" />

          {/* Card skeleton */}
          <div className={cn(
            "w-full md:w-[calc(50%-2rem)]",
            index % 2 === 0 ? "md:ms-auto md:ps-12" : "md:me-auto md:ps-20"
          )}>
            <div className="ps-16 md:ps-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
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
  const { t } = useTranslation('dossier');
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
      <div className="rounded-full bg-muted p-6 sm:p-8 lg:p-10 mb-4 sm:mb-6">
        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-muted-foreground" />
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2">{t('timeline.empty.title')}</h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md px-4">
        {message || t('timeline.empty.description')}
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function TimelineErrorState({ error }: { error: Error }) {
  const { t } = useTranslation('dossier');
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTitle>{t('timeline.error.title')}</AlertTitle>
      <AlertDescription className="text-start">
        {error.message || t('timeline.error.description')}
      </AlertDescription>
    </Alert>
  );
}

export function AceternityVerticalTimeline({
  events,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  error,
  emptyMessage,
  className,
}: AceternityVerticalTimelineProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  // Calculate line height based on content
  useEffect(() => {
    if (lineRef.current) {
      const rect = lineRef.current.getBoundingClientRect();
      setLineHeight(rect.height);
    }
  }, [events]);

  // Disabled scroll-based animations to prevent SSR hydration issues
  // TODO: Re-enable with proper client-side only rendering if needed
  // const { scrollYProgress } = useScroll({
  //   target: containerRef,
  //   offset: ['start 10%', 'end 50%'],
  // });
  // const heightTransform = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  // const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
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
      ref={containerRef}
      className={cn('w-full bg-background font-sans px-4 md:px-10', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-20">
        {/* Timeline Events */}
        <div ref={lineRef} className="relative">
          {events.map((event, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={event.id}
                className="relative flex justify-start pt-6 md:pt-20"
              >
                {/* Render the timeline card with modal */}
                <AceternityTimelineCard
                  event={event}
                  index={index}
                  isEven={isEven}
                />
              </div>
            );
          })}

          {/* Static Timeline Line (scroll animation disabled to prevent hydration issues) */}
          <div
            style={{ height: `${lineHeight}px` }}
            className={cn(
              "absolute top-0 w-[2px]",
              "bg-gradient-to-b from-transparent from-[0%] via-border via-[10%] to-transparent to-[90%]",
              // Mobile: on the left (with date/time section)
              "start-[46px]",
              // Desktop: centered
              "md:start-1/2 md:-translate-x-1/2"
            )}
          />
        </div>

        {/* Load More Trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-6 sm:py-8 lg:py-10">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('timeline.loading_more')}</span>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="min-h-11 sm:min-h-10"
              >
                {t('timeline.load_more')}
              </Button>
            )}
          </div>
        )}

        {/* End of Timeline Indicator */}
        {!hasNextPage && events.length > 0 && (
          <div className="flex justify-center py-6 sm:py-8 lg:py-10">
            <p className="text-sm text-muted-foreground">{t('timeline.end')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
