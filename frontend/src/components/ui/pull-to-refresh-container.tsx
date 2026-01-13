/**
 * PullToRefreshContainer Component
 *
 * A wrapper component that combines pull-to-refresh gesture detection
 * with visual feedback. Drop-in replacement for scroll containers.
 *
 * Features:
 * - Pull-to-refresh gesture detection
 * - Visual progress indicator
 * - Last sync timestamp
 * - Items synced count
 * - Offline queue status
 * - Mobile-first design
 * - RTL support
 *
 * @example
 * <PullToRefreshContainer
 *   onRefresh={async () => await refetch()}
 *   isRefreshing={isFetching}
 *   itemCount={items.length}
 *   storageKey="my-work-list"
 * >
 *   <YourListContent />
 * </PullToRefreshContainer>
 */

import { useEffect, forwardRef, useImperativeHandle, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { usePullToRefresh, type PullToRefreshConfig } from '@/hooks/usePullToRefresh'
import { useLastSyncInfo } from '@/hooks/useLastSyncInfo'
import { PullToRefreshIndicator, SyncStatusBar } from './pull-to-refresh-indicator'

export interface PullToRefreshContainerProps extends Omit<PullToRefreshConfig, 'onRefresh'> {
  /** Children to render inside the scroll container */
  children: ReactNode
  /** Callback when refresh is triggered. Must return a Promise. */
  onRefresh: () => Promise<void> | void
  /** External refreshing state (from TanStack Query, etc.) */
  isRefreshing?: boolean
  /** Number of items in the list (for display) */
  itemCount?: number
  /** Storage key for persisting sync info */
  storageKey: string
  /** Number of items in offline queue */
  offlineQueueCount?: number
  /** Show the compact sync status bar at top */
  showSyncStatusBar?: boolean
  /** Additional class names for the container */
  className?: string
  /** Height of the container. Default: calc(100vh - 200px) */
  height?: string
  /** Min height of the container. Default: 400px */
  minHeight?: string
}

export interface PullToRefreshContainerRef {
  /** Manually trigger a refresh */
  refresh: () => Promise<void>
  /** Reset the pull-to-refresh state */
  reset: () => void
  /** Update sync info manually */
  updateSyncInfo: (itemCount: number) => void
}

export const PullToRefreshContainer = forwardRef<
  PullToRefreshContainerRef,
  PullToRefreshContainerProps
>(
  (
    {
      children,
      onRefresh,
      isRefreshing = false,
      itemCount,
      storageKey,
      offlineQueueCount: externalOfflineCount,
      showSyncStatusBar = true,
      className,
      height = 'calc(100vh - 200px)',
      minHeight = '400px',
      // Pull-to-refresh config
      pullThreshold = 80,
      maxPull = 150,
      resistance = 0.5,
      enabled = true,
      completeDelay = 500,
      enableHaptics = true,
    },
    ref,
  ) => {
    const { i18n } = useTranslation()
    const isRTL = i18n.language === 'ar'

    // Sync info tracking
    const {
      lastSyncTime,
      itemsSynced,
      offlineQueueCount: internalOfflineCount,
      updateSyncInfo,
    } = useLastSyncInfo(storageKey)

    const offlineQueueCount = externalOfflineCount ?? internalOfflineCount

    // Pull-to-refresh hook
    const { handlers, state, containerRef, reset } = usePullToRefresh({
      pullThreshold,
      maxPull,
      resistance,
      enabled,
      completeDelay,
      enableHaptics,
      onRefresh: async () => {
        await onRefresh()
      },
      isRefreshing,
    })

    // Update sync info when refresh completes
    useEffect(() => {
      if (state.status === 'complete' && itemCount !== undefined) {
        updateSyncInfo(itemCount)
      }
    }, [state.status, itemCount, updateSyncInfo])

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        refresh: async () => {
          await onRefresh()
          if (itemCount !== undefined) {
            updateSyncInfo(itemCount)
          }
        },
        reset,
        updateSyncInfo,
      }),
      [onRefresh, itemCount, updateSyncInfo, reset],
    )

    return (
      <div className="flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Sync status bar (optional) */}
        {showSyncStatusBar && (
          <SyncStatusBar
            lastSyncTime={lastSyncTime}
            itemCount={itemCount}
            isSyncing={isRefreshing}
            offlineQueueCount={offlineQueueCount}
          />
        )}

        {/* Pull-to-refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={state.pullDistance}
          progress={state.progress}
          status={state.status}
          lastSyncTime={lastSyncTime}
          itemsSynced={itemsSynced}
          offlineQueueCount={offlineQueueCount}
        />

        {/* Scroll container */}
        <div
          ref={containerRef}
          className={cn('overflow-auto overscroll-contain', className)}
          style={{
            height,
            minHeight,
          }}
          {...handlers}
        >
          {children}
        </div>
      </div>
    )
  },
)

PullToRefreshContainer.displayName = 'PullToRefreshContainer'

export default PullToRefreshContainer
