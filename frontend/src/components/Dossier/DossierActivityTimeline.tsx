/**
 * DossierActivityTimeline Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T027
 *
 * Displays all activities (tasks, commitments, intakes) linked to a dossier.
 * Mobile-first design with infinite scroll and RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { Loader2, Filter, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDossierActivityTimeline,
  type TimelineFilters,
} from '@/hooks/useDossierActivityTimeline'
import { ActivityTimelineItem } from './ActivityTimelineItem'

// ============================================================================
// Props
// ============================================================================

export interface DossierActivityTimelineProps {
  /**
   * The dossier ID to show activities for.
   */
  dossierId: string
  /**
   * Optional filters to apply.
   */
  filters?: TimelineFilters
  /**
   * Whether to show filter controls.
   * @default true
   */
  showFilters?: boolean
  /**
   * Callback when a filter is changed.
   */
  onFiltersChange?: (filters: TimelineFilters) => void
  /**
   * Additional CSS classes.
   */
  className?: string
  /**
   * Maximum height for scrollable container.
   * @default '600px'
   */
  maxHeight?: string
}

// ============================================================================
// Component
// ============================================================================

export function DossierActivityTimeline({
  dossierId,
  filters,
  showFilters = true,
  onFiltersChange,
  className,
  maxHeight = '600px',
}: DossierActivityTimelineProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const isRTL = i18n.language === 'ar'

  // Fetch timeline data with infinite scroll
  const {
    activities,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    totalCount,
  } = useDossierActivityTimeline({
    dossierId,
    filters,
    pageSize: 20,
  })

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  })

  // Auto-fetch next page when load more trigger is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with count and refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('timeline.title', 'Activity Timeline')}</h3>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showFilters && onFiltersChange && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 sm:min-w-0"
              onClick={() => {
                // TODO: Open filter dialog
              }}
            >
              <Filter className={cn('size-4', isRTL ? 'ms-0 sm:me-2' : 'me-0 sm:me-2')} />
              <span className="hidden sm:inline">{t('timeline.filter', 'Filter')}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
            <span className="sr-only">{t('timeline.refresh', 'Refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {filters && Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.work_item_types?.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {t(`timeline.type.${type}`, type)}
            </Badge>
          ))}
          {filters.overdue_only && (
            <Badge variant="destructive" className="text-xs">
              {t('timeline.overdueOnly', 'Overdue Only')}
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 border rounded-lg">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-destructive mb-4">
            {error?.message || t('timeline.error', 'Failed to load activities')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('timeline.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {t('timeline.empty', 'No activities found for this dossier')}
          </p>
          {filters && Object.keys(filters).length > 0 && (
            <Button variant="link" className="mt-2" onClick={() => onFiltersChange?.({})}>
              {t('timeline.clearFilters', 'Clear filters')}
            </Button>
          )}
        </div>
      )}

      {/* Timeline Content */}
      {!isLoading && activities.length > 0 && (
        <div className="overflow-y-auto space-y-2" style={{ maxHeight }}>
          {activities.map((activity, index) => (
            <ActivityTimelineItem
              key={activity.id}
              activity={activity}
              isFirst={index === 0}
              isLast={index === activities.length - 1 && !hasNextPage}
            />
          ))}

          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <Button variant="ghost" onClick={() => fetchNextPage()} className="min-h-11">
                  {t('timeline.loadMore', 'Load More')}
                </Button>
              )}
            </div>
          )}

          {/* End of List Indicator */}
          {!hasNextPage && activities.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              {t('timeline.endOfList', 'End of activities')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default DossierActivityTimeline
