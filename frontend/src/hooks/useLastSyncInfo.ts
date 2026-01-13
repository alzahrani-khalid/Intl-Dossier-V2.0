/**
 * useLastSyncInfo Hook
 *
 * Tracks last sync timestamps and item counts for list views.
 * Persists to localStorage for persistence across sessions.
 *
 * @example
 * const { lastSyncTime, itemsSynced, updateSyncInfo, offlineQueueCount } = useLastSyncInfo('my-work');
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
 * Hook to track offline queue from IndexedDB or service worker
 * This is a placeholder that can be extended for real offline sync
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
