/**
 * use-offline-state.ts
 *
 * Hook to detect and manage offline/online state for the application.
 * Listens to navigator.onLine events and provides an offline status indicator.
 *
 * Features:
 * - Detects browser online/offline state
 * - Provides reactive state for UI updates
 * - Monitors connectivity changes in real-time
 * - Supports toast notifications for connectivity changes
 *
 * Usage:
 * ```tsx
 * const { isOnline, isOffline } = useOfflineState();
 *
 * {isOffline && <OfflineBanner />}
 * ```
 */

import { useEffect, useState } from 'react'

export interface OfflineState {
  /** True if the browser is currently online */
  isOnline: boolean
  /** True if the browser is currently offline */
  isOffline: boolean
  /** Timestamp of last online event */
  lastOnlineAt: Date | null
  /** Timestamp of last offline event */
  lastOfflineAt: Date | null
}

/**
 * Hook to detect and manage offline/online state
 *
 * @returns {OfflineState} Current offline state with connection status
 */
export function useOfflineState(): OfflineState {
  // Initialize with current navigator.onLine state
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null)
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null)

  useEffect(() => {
    // Handler for online event
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineAt(new Date())
    }

    // Handler for offline event
    const handleOffline = () => {
      setIsOnline(false)
      setLastOfflineAt(new Date())
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineAt,
    lastOfflineAt,
  }
}
