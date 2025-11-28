/**
 * Work Item List Component
 * Virtualized list with infinite scroll
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { WorkItemCard } from './WorkItemCard';
import type { UnifiedWorkItem } from '@/types/unified-work.types';

interface WorkItemListProps {
  items: UnifiedWorkItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore?: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

export function WorkItemList({
  items,
  isLoading,
  isError,
  error,
  hasMore,
  onLoadMore,
  isFetchingMore,
}: WorkItemListProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer for performance with 500+ items
  const rowVirtualizer = useVirtualizer({
    count: items.length + (hasMore ? 1 : 0), // +1 for loading indicator
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
    overscan: 5, // Render 5 extra items outside viewport
  });

  // Infinite scroll trigger
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      if (isLoading || isFetchingMore || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        { rootMargin: '200px' }
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [isLoading, isFetchingMore, hasMore, onLoadMore]
  );

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error?.message || t('error.loading', 'Failed to load work items')}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 me-2" />
            {t('error.retry', 'Retry')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">
            {t('empty.title', 'No work items found')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('empty.description', 'Try adjusting your filters or check back later')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Virtualized list
  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-400px)] min-h-[400px] overflow-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= items.length;
          const item = items[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              ref={virtualRow.index === items.length - 1 ? lastItemRef : undefined}
              style={{
                position: 'absolute',
                top: 0,
                [isRTL ? 'right' : 'left']: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-3"
            >
              {isLoaderRow ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <WorkItemCard item={item} />
              )}
            </div>
          );
        })}
      </div>

      {/* Load more button (fallback for non-intersection observer) */}
      {hasMore && !isFetchingMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore}>
            {t('loadMore', 'Load More')}
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
