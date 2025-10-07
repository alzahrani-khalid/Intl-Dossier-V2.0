import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { PositionCard } from './PositionCard';
import { usePositions } from '../hooks/usePositions';
import { useInView } from '../hooks/useInView';
import type { PositionFilters, PositionStatus } from '../types/position';

interface PositionListProps {
  filters?: PositionFilters;
  onFilterChange?: (filters: PositionFilters) => void;
}

export function PositionList({ filters = {}, onFilterChange }: PositionListProps) {
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';

  // Local filter state
  const [localFilters, setLocalFilters] = useState<PositionFilters>(filters);

  // Infinite scroll observer target
  const observerTarget = useRef<HTMLDivElement>(null);
  const isInView = useInView(observerTarget, { threshold: 0.1 });

  // Fetch positions with infinite scroll
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = usePositions(localFilters);

  // Trigger next page fetch when observer target comes into view
  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten paginated results
  const positions = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Handle filter changes
  const handleFilterChange = (newFilters: PositionFilters) => {
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Status filter options
  const statusOptions: PositionStatus[] = ['draft', 'under_review', 'approved', 'published'];

  // Thematic category options (from spec)
  const categoryOptions = ['trade', 'climate', 'security', 'technology', 'health', 'education', 'other'];

  // Toggle filter
  const toggleFilter = (key: keyof PositionFilters, value: string) => {
    const newFilters = { ...localFilters };
    if (newFilters[key] === value) {
      // Remove filter if already selected
      delete newFilters[key];
    } else {
      // Set new filter
      (newFilters as any)[key] = value;
    }
    handleFilterChange(newFilters);
  };

  // Reset filters
  const resetFilters = () => {
    handleFilterChange({ limit: localFilters.limit });
  };

  // Count active filters
  const activeFilterCount = [
    localFilters.status,
    localFilters.thematic_category,
    localFilters.search,
  ].filter(Boolean).length;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('list.empty')}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {t('list.emptyDescription')}
        </p>
      </CardContent>
    </Card>
  );

  // Error state
  const ErrorState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('list.error')}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {t('list.errorDescription')}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          {t('actions.retry', { ns: 'common' }) || 'Retry'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Results Count */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('list.resultsCount', { count: totalCount, ns: 'common' }) ||
              `${totalCount} result${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Error State */}
      {isError && <ErrorState />}

      {/* Positions Grid */}
      {!isLoading && !isError && positions.length === 0 && <EmptyState />}

      {!isLoading && !isError && positions.length > 0 && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Observer Target */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex items-center justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t('list.loadingMore')}</span>
            </div>
          )}
        </div>
      )}

      {/* No More Results */}
      {!hasNextPage && positions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{t('list.noMoreResults')}</p>
        </div>
      )}
    </div>
  );
}
