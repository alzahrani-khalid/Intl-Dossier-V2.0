/**
 * Offline State Hooks
 * @module hooks/use-offline-state
 *
 * React hooks for detecting and managing online/offline network state with
 * real-time updates and optional callbacks.
 *
 * @description
 * This module provides hooks for monitoring browser connectivity:
 * - Real-time network state detection via navigator.onLine
 * - Automatic updates via online/offline window events
 * - Timestamp tracking for last state change
 * - Optional callbacks for connectivity changes
 * - SSR-safe (assumes online on server)
 * - Reactive state for UI updates (banners, toast notifications, etc.)
 *
 * @example
 * // Basic usage with offline banner
 * const { isOnline, isOffline } = useOfflineState();
 *
 * {isOffline && <OfflineBanner />}
 *
 * @example
 * // With callbacks for toast notifications
 * useOfflineStateWithCallback(
 *   () => toast.success('Connection restored'),
 *   () => toast.warning('You are offline')
 * );
 *
 * @example
 * // Access last state change timestamps
 * const { lastOnlineAt, lastOfflineAt } = useOfflineState();
 * if (lastOfflineAt) {
 *   console.log('Offline since:', lastOfflineAt);
 * }
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
 * @description
 * Monitors browser connectivity by listening to window online/offline events
 * and tracking the navigator.onLine property. Automatically updates state when
 * network connectivity changes. SSR-safe (assumes online during server rendering).
 *
 * The hook tracks:
 * - Current online/offline status
 * - Timestamp of last online event
 * - Timestamp of last offline event
 *
 * Event listeners are automatically cleaned up on unmount.
 *
 * @returns Current offline state with connection status and timestamps
 *   - isOnline: True if browser is currently online
 *   - isOffline: True if browser is currently offline (inverse of isOnline)
 *   - lastOnlineAt: Timestamp of last online event, or null
 *   - lastOfflineAt: Timestamp of last offline event, or null
 *
 * @example
 * // Show offline banner
 * const { isOnline, isOffline } = useOfflineState();
 *
 * return (
 *   <div>
 *     {isOffline && (
 *       <div className="bg-yellow-100 p-2 text-center">
 *         You are currently offline
 *       </div>
 *     )}
 *     <MainContent />
 *   </div>
 * );
 *
 * @example
 * // Disable form submission when offline
 * const { isOnline } = useOfflineState();
 *
 * <Button disabled={!isOnline}>
 *   Submit
 * </Button>
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

/**
 * Hook to detect offline state with optional callbacks
 *
 * @description
 * Extends useOfflineState with callback support for connectivity changes.
 * Callbacks are triggered when the connection state changes, useful for
 * showing toast notifications or triggering sync operations.
 *
 * Callbacks are only invoked when the state actually changes (not on initial render).
 * This prevents false triggers when the component mounts.
 *
 * @param onOnline - Optional callback function when connection is restored
 * @param onOffline - Optional callback function when connection is lost
 * @returns Current offline state with connection status and timestamps
 *
 * @example
 * // Toast notifications for connectivity changes
 * import { toast } from 'sonner';
 *
 * useOfflineStateWithCallback(
 *   () => toast.success('Connection restored'),
 *   () => toast.warning('You are offline. Changes will sync when connection is restored.')
 * );
 *
 * @example
 * // Trigger sync when online
 * useOfflineStateWithCallback(
 *   () => {
 *     syncOfflineChanges();
 *     toast.info('Syncing offline changes...');
 *   }
 * );
 *
 * @example
 * // Save work and warn when going offline
 * useOfflineStateWithCallback(
 *   undefined,
 *   () => {
 *     autoSaveDraft();
 *     toast.warning('Connection lost. Working in offline mode.');
 *   }
 * );
 */
export function useOfflineStateWithCallback(
  onOnline?: () => void,
  onOffline?: () => void,
): OfflineState {
  const offlineState = useOfflineState()

  useEffect(() => {
    if (offlineState.isOnline && offlineState.lastOnlineAt && onOnline) {
      onOnline()
    }
  }, [offlineState.isOnline, offlineState.lastOnlineAt, onOnline])

  useEffect(() => {
    if (offlineState.isOffline && offlineState.lastOfflineAt && onOffline) {
      onOffline()
    }
  }, [offlineState.isOffline, offlineState.lastOfflineAt, onOffline])

  return offlineState
}
