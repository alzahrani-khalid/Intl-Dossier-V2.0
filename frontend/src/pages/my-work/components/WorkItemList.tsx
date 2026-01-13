/**
 * Work Item List Component
 * Virtualized list with infinite scroll and pull-to-refresh
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next'
import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { WorkItemCard } from './WorkItemCard'
import { WorkItemListSkeleton, WorkItemSkeleton } from '@/components/ui/content-skeletons'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useLastSyncInfo } from '@/hooks/useLastSyncInfo'
import { PullToRefreshIndicator, SyncStatusBar } from '@/components/ui/pull-to-refresh-indicator'
import type { UnifiedWorkItem } from '@/types/unified-work.types'

interface WorkItemListProps {
  items: UnifiedWorkItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasMore?: boolean
  onLoadMore: () => void
  isFetchingMore: boolean
  /** Callback to refresh data */
  onRefresh?: () => Promise<void>
}

export function WorkItemList({
  items,
  isLoading,
  isError,
  error,
  hasMore,
  onLoadMore,
  isFetchingMore,
  onRefresh,
}: WorkItemListProps) {
  const { t, i18n } = useTranslation('my-work')
  const isRTL = i18n.language === 'ar'

  // Sync info tracking
  const { lastSyncTime, itemsSynced, updateSyncInfo } = useLastSyncInfo('my-work-list')

  // Pull-to-refresh hook
  const {
    handlers: pullHandlers,
    state: pullState,
    containerRef,
  } = usePullToRefresh({
    onRefresh: async () => {
      if (onRefresh) {
        await onRefresh()
        updateSyncInfo(items.length)
      }
    },
    isRefreshing: isLoading && items.length > 0,
    enabled: !!onRefresh && !isLoading,
  })

  // Use containerRef for both pull-to-refresh and virtualizer
  const parentRef = containerRef as React.RefObject<HTMLDivElement>

  // Virtualizer for performance with 500+ items
  const rowVirtualizer = useVirtualizer({
    count: items.length + (hasMore ? 1 : 0), // +1 for loading indicator
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
    overscan: 5, // Render 5 extra items outside viewport
  })

  // Infinite scroll trigger
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      if (isLoading || isFetchingMore || !hasMore) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore()
          }
        },
        { rootMargin: '200px' },
      )

      observer.observe(node)
      return () => observer.disconnect()
    },
    [isLoading, isFetchingMore, hasMore, onLoadMore],
  )

  // Loading state - use content-aware skeleton
  if (isLoading && items.length === 0) {
    return <WorkItemListSkeleton count={5} className={isRTL ? 'dir-rtl' : 'dir-ltr'} />
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
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">{t('empty.title', 'No work items found')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('empty.description', 'Try adjusting your filters or check back later')}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Virtualized list with pull-to-refresh
  return (
    <div className="flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sync status bar */}
      <SyncStatusBar
        lastSyncTime={lastSyncTime}
        itemCount={items.length}
        isSyncing={isLoading && items.length > 0}
      />

      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullState.pullDistance}
        progress={pullState.progress}
        status={pullState.status}
        lastSyncTime={lastSyncTime}
        itemsSynced={itemsSynced}
      />

      {/* Scrollable container */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-450px)] min-h-[350px] overflow-auto overscroll-contain"
        {...pullHandlers}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= items.length
            const item = items[virtualRow.index]

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
                {isLoaderRow ? <WorkItemSkeleton /> : <WorkItemCard item={item} />}
              </div>
            )
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

        {/* Loading more indicator - shows skeleton instead of spinner */}
        {isFetchingMore && (
          <div className="py-2">
            <WorkItemSkeleton />
          </div>
        )}
      </div>
    </div>
  )
}
