/**
 * Last Sync Info Hooks
 * @module hooks/useLastSyncInfo
 *
 * React hooks for tracking synchronization state in pull-to-refresh and offline-first
 * list views with localStorage persistence.
 *
 * @description
 * This module provides hooks for managing sync metadata in list views:
 * - Track last sync timestamp and item counts
 * - Persist sync info to localStorage across sessions
 * - Manage offline queue counts for pending uploads
 * - Service worker integration for real offline sync tracking
 * - Helper functions for incrementing/decrementing queue counts
 * - SSR-safe with fallback for server-side rendering
 *
 * Used in pull-to-refresh components to display "Last synced 2 minutes ago" messages
 * and offline queue indicators like "3 items pending upload".
 *
 * @example
 * // Basic usage with pull-to-refresh
 * const { lastSyncTime, itemsSynced, updateSyncInfo } = useLastSyncInfo('my-work');
 *
 * const handleRefresh = async () => {
 *   const items = await fetchWorkItems();
 *   updateSyncInfo(items.length);
 * };
 *
 * @example
 * // With offline queue tracking
 * const {
 *   offlineQueueCount,
 *   incrementOfflineQueue,
 *   decrementOfflineQueue
 * } = useLastSyncInfo('commitments');
 *
 * // When creating offline
 * createCommitment(data);
 * incrementOfflineQueue();
 *
 * // When synced
 * syncToServer(data);
 * decrementOfflineQueue();
 *
 * @example
 * // Monitor service worker offline queue
 * const queueCount = useOfflineQueue('my-work-queue');
 */

import { useState, useCallback, useEffect, useMemo } from 'react'

export interface SyncInfo {
  /** Last sync timestamp (ISO string) */
  lastSyncTime: string | null
  /** Number of items in the last sync */
  itemsSynced: number
  /** Number of items waiting in offline queue */
  offlineQueueCount: number
}

export interface UseLastSyncInfoOptions {
  /** Unique key for localStorage persistence */
  storageKey: string
  /** Initial offline queue count. Default: 0 */
  initialOfflineQueueCount?: number
}

export interface UseLastSyncInfoResult {
  /** Last sync timestamp */
  lastSyncTime: string | null
  /** Number of items synced in last refresh */
  itemsSynced: number
  /** Number of items in offline queue */
  offlineQueueCount: number
  /** Update sync info after a refresh */
  updateSyncInfo: (itemCount: number) => void
  /** Set offline queue count */
  setOfflineQueueCount: (count: number) => void
  /** Increment offline queue */
  incrementOfflineQueue: () => void
  /** Decrement offline queue */
  decrementOfflineQueue: (count?: number) => void
  /** Clear all sync info */
  clearSyncInfo: () => void
}

const STORAGE_PREFIX = 'pull-to-refresh-sync-'

/**
 * Hook to track last sync info with localStorage persistence
 *
 * @description
 * Manages synchronization metadata for list views including last sync timestamp,
 * number of items synced, and offline queue count. Data is persisted to localStorage
 * for consistency across page refreshes and browser sessions.
 *
 * The hook:
 * 1. Loads initial state from localStorage on mount
 * 2. Persists sync time and item count on changes
 * 3. Does NOT persist offline queue count (recalculated on mount)
 * 4. Provides helper functions for common operations
 *
 * Storage key format: `pull-to-refresh-sync-{storageKey}`
 *
 * @param keyOrOptions - Either a string storage key or options object
 *   - storageKey: Unique key for localStorage (required)
 *   - initialOfflineQueueCount: Initial queue count (default: 0)
 * @returns Object with sync info state and update functions
 *   - lastSyncTime: ISO timestamp of last sync, or null
 *   - itemsSynced: Number of items in last sync
 *   - offlineQueueCount: Number of items in offline queue
 *   - updateSyncInfo: Update sync timestamp and item count
 *   - setOfflineQueueCount: Set queue count (clamped to min 0)
 *   - incrementOfflineQueue: Add 1 to queue count
 *   - decrementOfflineQueue: Remove N from queue count (default 1)
 *   - clearSyncInfo: Reset all sync info and clear localStorage
 *
 * @example
 * // Basic usage with pull-to-refresh
 * const { lastSyncTime, itemsSynced, updateSyncInfo } = useLastSyncInfo('my-work');
 *
 * const handleRefresh = async () => {
 *   const items = await fetchWorkItems();
 *   updateSyncInfo(items.length); // Sets lastSyncTime to now
 * };
 *
 * // Display last sync info
 * {lastSyncTime && (
 *   <p>Last synced: {formatDistanceToNow(new Date(lastSyncTime))} ago</p>
 * )}
 *
 * @example
 * // With options object
 * const syncInfo = useLastSyncInfo({
 *   storageKey: 'commitments-list',
 *   initialOfflineQueueCount: 5
 * });
 *
 * @example
 * // Manage offline queue
 * const { offlineQueueCount, incrementOfflineQueue, decrementOfflineQueue } =
 *   useLastSyncInfo('my-work');
 *
 * // Creating item offline
 * createItemLocally(data);
 * incrementOfflineQueue();
 *
 * // Successfully synced
 * await syncToServer(items);
 * decrementOfflineQueue(items.length);
 *
 * // Display queue indicator
 * {offlineQueueCount > 0 && (
 *   <Badge>{offlineQueueCount} pending</Badge>
 * )}
 */
export function useLastSyncInfo(
  keyOrOptions: string | UseLastSyncInfoOptions,
): UseLastSyncInfoResult {
  // Normalize options
  const options =
    typeof keyOrOptions === 'string'
      ? { storageKey: keyOrOptions, initialOfflineQueueCount: 0 }
      : keyOrOptions

  const { storageKey, initialOfflineQueueCount = 0 } = options
  const fullStorageKey = `${STORAGE_PREFIX}${storageKey}`

  // State
  const [syncInfo, setSyncInfo] = useState<SyncInfo>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(fullStorageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            lastSyncTime: parsed.lastSyncTime || null,
            itemsSynced: parsed.itemsSynced || 0,
            offlineQueueCount: initialOfflineQueueCount,
          }
        }
      } catch (e) {
        console.debug('Failed to load sync info from localStorage:', e)
      }
    }
    return {
      lastSyncTime: null,
      itemsSynced: 0,
      offlineQueueCount: initialOfflineQueueCount,
    }
  })

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          fullStorageKey,
          JSON.stringify({
            lastSyncTime: syncInfo.lastSyncTime,
            itemsSynced: syncInfo.itemsSynced,
            // Don't persist offline queue count - it should be recalculated
          }),
        )
      } catch (e) {
        console.debug('Failed to save sync info to localStorage:', e)
      }
    }
  }, [fullStorageKey, syncInfo.lastSyncTime, syncInfo.itemsSynced])

  // Update sync info after a refresh
  const updateSyncInfo = useCallback((itemCount: number) => {
    setSyncInfo((prev) => ({
      ...prev,
      lastSyncTime: new Date().toISOString(),
      itemsSynced: itemCount,
    }))
  }, [])

  // Set offline queue count
  const setOfflineQueueCount = useCallback((count: number) => {
    setSyncInfo((prev) => ({
      ...prev,
      offlineQueueCount: Math.max(0, count),
    }))
  }, [])

  // Increment offline queue
  const incrementOfflineQueue = useCallback(() => {
    setSyncInfo((prev) => ({
      ...prev,
      offlineQueueCount: prev.offlineQueueCount + 1,
    }))
  }, [])

  // Decrement offline queue
  const decrementOfflineQueue = useCallback((count = 1) => {
    setSyncInfo((prev) => ({
      ...prev,
      offlineQueueCount: Math.max(0, prev.offlineQueueCount - count),
    }))
  }, [])

  // Clear sync info
  const clearSyncInfo = useCallback(() => {
    setSyncInfo({
      lastSyncTime: null,
      itemsSynced: 0,
      offlineQueueCount: 0,
    })
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(fullStorageKey)
      } catch (e) {
        console.debug('Failed to remove sync info from localStorage:', e)
      }
    }
  }, [fullStorageKey])

  return {
    lastSyncTime: syncInfo.lastSyncTime,
    itemsSynced: syncInfo.itemsSynced,
    offlineQueueCount: syncInfo.offlineQueueCount,
    updateSyncInfo,
    setOfflineQueueCount,
    incrementOfflineQueue,
    decrementOfflineQueue,
    clearSyncInfo,
  }
}

/**
 * Hook to track offline queue from service worker
 *
 * @description
 * Monitors the offline queue count from a service worker via message passing.
 * Listens for OFFLINE_QUEUE_UPDATE messages and requests current count on mount.
 * This is a foundation for real offline-first sync implementations.
 *
 * Note: Requires a service worker that implements the message protocol:
 * - Responds to GET_OFFLINE_QUEUE_COUNT messages with current count
 * - Sends OFFLINE_QUEUE_UPDATE messages when queue changes
 *
 * @param storageKey - Unique key to identify the offline queue
 * @returns Current offline queue count (0 if service worker not available)
 *
 * @example
 * // Monitor offline queue from service worker
 * const queueCount = useOfflineQueue('work-items');
 *
 * {queueCount > 0 && (
 *   <div className="flex items-center gap-2">
 *     <Spinner size="sm" />
 *     <span>{queueCount} items syncing...</span>
 *   </div>
 * )}
 *
 * @example
 * // Combined with useLastSyncInfo
 * const { updateSyncInfo } = useLastSyncInfo('work-items');
 * const queueCount = useOfflineQueue('work-items');
 *
 * // Update sync info when queue drains
 * useEffect(() => {
 *   if (queueCount === 0) {
 *     updateSyncInfo(totalItems);
 *   }
 * }, [queueCount]);
 */
export function useOfflineQueue(storageKey: string) {
  const [queueCount, setQueueCount] = useState(0)

  // Listen for service worker messages about offline queue
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_QUEUE_UPDATE' && event.data?.key === storageKey) {
        setQueueCount(event.data.count || 0)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Request current queue count
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_OFFLINE_QUEUE_COUNT',
        key: storageKey,
      })
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [storageKey])

  return queueCount
}

export default useLastSyncInfo
