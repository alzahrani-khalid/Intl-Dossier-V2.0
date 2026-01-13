/**
 * usePullToRefresh Hook
 *
 * Provides pull-to-refresh gesture detection for list views.
 * Features:
 * - Touch gesture detection with vertical pull threshold
 * - Visual progress feedback (0-1)
 * - RTL support
 * - Haptic feedback integration
 * - Configurable thresholds
 *
 * @example
 * const { handlers, state, containerRef } = usePullToRefresh({
 *   onRefresh: async () => await refetch(),
 *   isRefreshing: isFetching,
 * });
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useHapticFeedback } from './useHapticFeedback'

export type PullToRefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete'

export interface PullToRefreshConfig {
  /** Minimum pull distance (px) to trigger refresh. Default: 80 */
  pullThreshold?: number
  /** Maximum pull distance (px). Default: 150 */
  maxPull?: number
  /** Resistance factor (0-1) for overscroll. Default: 0.5 */
  resistance?: number
  /** Enable/disable the hook. Default: true */
  enabled?: boolean
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void> | void
  /** External refreshing state (from query hook) */
  isRefreshing?: boolean
  /** Delay (ms) to show completion state. Default: 500 */
  completeDelay?: number
  /** Enable haptic feedback. Default: true */
  enableHaptics?: boolean
}

export interface PullToRefreshResult {
  /** Touch event handlers to attach to the scroll container */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
  /** Current state of pull-to-refresh */
  state: {
    /** Current pull distance (px) */
    pullDistance: number
    /** Progress percentage (0-1) relative to threshold */
    progress: number
    /** Current gesture state */
    status: PullToRefreshState
    /** Whether the container is at the top (scrollTop === 0) */
    isAtTop: boolean
  }
  /** Ref to attach to the scroll container */
  containerRef: React.RefObject<HTMLDivElement>
  /** Reset the pull-to-refresh state */
  reset: () => void
}

export function usePullToRefresh(config: PullToRefreshConfig): PullToRefreshResult {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const {
    pullThreshold = 80,
    maxPull = 150,
    resistance = 0.5,
    enabled = true,
    onRefresh,
    isRefreshing = false,
    completeDelay = 500,
    enableHaptics = true,
  } = config

  // State
  const [pullDistance, setPullDistance] = useState(0)
  const [status, setStatus] = useState<PullToRefreshState>('idle')
  const [isAtTop, setIsAtTop] = useState(true)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isTracking = useRef(false)
  const hasTriggeredHaptic = useRef(false)

  // Haptic feedback
  const haptic = useHapticFeedback({ enabled: enableHaptics })

  // Calculate progress (0-1)
  const progress = useMemo(() => {
    return Math.min(pullDistance / pullThreshold, 1)
  }, [pullDistance, pullThreshold])

  // Check if container is at top
  const checkIsAtTop = useCallback(() => {
    if (containerRef.current) {
      const atTop = containerRef.current.scrollTop <= 0
      setIsAtTop(atTop)
      return atTop
    }
    return true
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setPullDistance(0)
    setStatus('idle')
    isTracking.current = false
    hasTriggeredHaptic.current = false
  }, [])

  // Handle refresh complete
  useEffect(() => {
    if (!isRefreshing && status === 'refreshing') {
      setStatus('complete')
      haptic.success()

      // Reset after delay
      const timer = setTimeout(() => {
        reset()
      }, completeDelay)

      return () => clearTimeout(timer)
    }
  }, [isRefreshing, status, completeDelay, reset, haptic])

  // Update status based on pull distance
  useEffect(() => {
    if (status === 'pulling' || status === 'ready') {
      if (pullDistance >= pullThreshold) {
        if (status !== 'ready') {
          setStatus('ready')
          if (!hasTriggeredHaptic.current) {
            haptic.selection()
            hasTriggeredHaptic.current = true
          }
        }
      } else {
        if (status !== 'pulling') {
          setStatus('pulling')
          hasTriggeredHaptic.current = false
        }
      }
    }
  }, [pullDistance, pullThreshold, status, haptic])

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || status === 'refreshing' || status === 'complete') return

      // Check if we're at the top of the scroll container
      if (!checkIsAtTop()) return

      const touch = e.touches[0]
      startY.current = touch.clientY
      currentY.current = touch.clientY
      isTracking.current = true
    },
    [enabled, status, checkIsAtTop],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isTracking.current || status === 'refreshing' || status === 'complete')
        return

      // Re-check if we're still at the top
      if (!checkIsAtTop()) {
        isTracking.current = false
        setPullDistance(0)
        setStatus('idle')
        return
      }

      const touch = e.touches[0]
      currentY.current = touch.clientY
      const deltaY = currentY.current - startY.current

      // Only track downward pulls
      if (deltaY <= 0) {
        setPullDistance(0)
        setStatus('idle')
        return
      }

      // Apply resistance for overscroll
      const resistedDelta = deltaY * resistance
      const clampedPull = Math.min(resistedDelta, maxPull)

      setPullDistance(clampedPull)
      if (status === 'idle') {
        setStatus('pulling')
      }

      // Prevent default scroll when pulling
      if (clampedPull > 0) {
        e.preventDefault()
      }
    },
    [enabled, status, checkIsAtTop, resistance, maxPull],
  )

  const onTouchEnd = useCallback(
    async (_e: React.TouchEvent) => {
      if (!enabled || !isTracking.current) return

      isTracking.current = false

      if (pullDistance >= pullThreshold && status === 'ready') {
        // Trigger refresh
        setStatus('refreshing')
        haptic.impact()

        try {
          await onRefresh()
        } catch (error) {
          console.error('Pull-to-refresh error:', error)
          haptic.error()
        }

        // Note: reset will happen via the isRefreshing effect
      } else {
        // Not enough pull, reset
        reset()
      }
    },
    [enabled, pullDistance, pullThreshold, status, onRefresh, haptic, reset],
  )

  // Memoize handlers
  const handlers = useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchStart, onTouchMove, onTouchEnd],
  )

  // Memoize state
  const state = useMemo(
    () => ({
      pullDistance,
      progress,
      status,
      isAtTop,
    }),
    [pullDistance, progress, status, isAtTop],
  )

  return {
    handlers,
    state,
    containerRef,
    reset,
  }
}

export default usePullToRefresh
