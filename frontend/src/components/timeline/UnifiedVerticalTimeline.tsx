/**
 * UnifiedVerticalTimeline Component
 *
 * Core vertical timeline container with:
 * - Infinite scroll pagination
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Dark/light mode theming
 * - Aceternity-inspired animations
 * - Empty and loading states
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TimelineEventCard } from './TimelineEventCard';
import type { UnifiedTimelineEvent } from '@/types/timeline.types';

interface UnifiedVerticalTimelineProps {
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
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline dot skeleton */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-11 w-11 rounded-full" />
            {index < count - 1 && <Skeleton className="h-20 w-0.5 mt-2" />}
          </div>
          {/* Card skeleton */}
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
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
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="rounded-full bg-muted p-6 sm:p-8 mb-4 sm:mb-6">
        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('timeline.empty.title')}</h3>
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

export function UnifiedVerticalTimeline({
  events,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  error,
  emptyMessage,
  className,
}: UnifiedVerticalTimelineProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Disabled scroll-based animations to prevent SSR hydration issues
  // TODO: Re-enable with proper client-side only rendering
  // const { scrollYProgress } = useScroll({
  //   target: containerRef,
  //   offset: ['start end', 'end start'],
  // });
  // const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  // const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

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
    <motion.div
      ref={containerRef}
      className={cn('w-full relative', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Timeline Events */}
      <div className="space-y-0">
        {events.map((event, index) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            isFirst={index === 0}
            isLast={index === events.length - 1 && !hasNextPage}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-6 sm:py-8">
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
        <div className="flex justify-center py-6 sm:py-8">
          <p className="text-sm text-muted-foreground">{t('timeline.end')}</p>
        </div>
      )}
    </motion.div>
  );
}
