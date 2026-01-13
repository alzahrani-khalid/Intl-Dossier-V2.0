/**
 * useSwipeGesture Hook
 *
 * Provides swipe gesture detection for touch-first mobile interactions.
 * Features:
 * - Left/Right swipe detection with RTL support
 * - Long-press detection for contextual menus
 * - Velocity-based gesture recognition
 * - Configurable thresholds
 *
 * @example
 * const { handlers, state } = useSwipeGesture({
 *   onSwipeLeft: () => handleArchive(),
 *   onSwipeRight: () => handleFavorite(),
 *   onLongPress: () => handleContextMenu(),
 * });
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export type SwipeDirection = 'left' | 'right' | 'none'
export type SwipeState = 'idle' | 'swiping' | 'swiped' | 'long-pressing'

export interface SwipeGestureConfig {
  /** Minimum distance (px) to register as a swipe. Default: 50 */
  swipeThreshold?: number
  /** Minimum velocity (px/ms) for gesture recognition. Default: 0.3 */
  velocityThreshold?: number
  /** Long-press duration (ms). Default: 500 */
  longPressDuration?: number
  /** Maximum offset (px) before resetting. Default: 150 */
  maxOffset?: number
  /** Enable/disable the hook. Default: true */
  enabled?: boolean
  /** Callback for right swipe (favorite/pin in LTR, archive/delete in RTL) */
  onSwipeRight?: () => void
  /** Callback for left swipe (archive/delete in LTR, favorite/pin in RTL) */
  onSwipeLeft?: () => void
  /** Callback for long-press (contextual menu) */
  onLongPress?: () => void
  /** Callback when swipe starts */
  onSwipeStart?: () => void
  /** Callback when swipe ends */
  onSwipeEnd?: () => void
}

export interface SwipeGestureState {
  /** Current horizontal offset */
  offsetX: number
  /** Current swipe direction */
  direction: SwipeDirection
  /** Current state of the gesture */
  state: SwipeState
  /** Whether the gesture exceeds the threshold */
  isActive: boolean
  /** Progress percentage (0-1) of the swipe relative to threshold */
  progress: number
}

export interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

export interface SwipeGestureResult {
  /** Touch/mouse event handlers to attach to the element */
  handlers: SwipeGestureHandlers
  /** Current state of the swipe gesture */
  state: SwipeGestureState
  /** Reset the gesture state */
  reset: () => void
}

export function useSwipeGesture(config: SwipeGestureConfig = {}): SwipeGestureResult {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const {
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    longPressDuration = 500,
    maxOffset = 150,
    enabled = true,
    onSwipeRight,
    onSwipeLeft,
    onLongPress,
    onSwipeStart,
    onSwipeEnd,
  } = config

  // State
  const [offsetX, setOffsetX] = useState(0)
  const [direction, setDirection] = useState<SwipeDirection>('none')
  const [gestureState, setGestureState] = useState<SwipeState>('idle')

  // Refs for tracking
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isTracking = useRef(false)
  const isLongPressing = useRef(false)

  // Clear long-press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setOffsetX(0)
    setDirection('none')
    setGestureState('idle')
    isTracking.current = false
    isLongPressing.current = false
    clearLongPressTimer()
  }, [clearLongPressTimer])

  // Calculate progress (0-1)
  const progress = useMemo(() => {
    const absOffset = Math.abs(offsetX)
    return Math.min(absOffset / swipeThreshold, 1)
  }, [offsetX, swipeThreshold])

  // Is gesture active (past threshold)
  const isActive = useMemo(() => {
    return Math.abs(offsetX) >= swipeThreshold
  }, [offsetX, swipeThreshold])

  // Handle gesture start
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return

      startX.current = clientX
      startY.current = clientY
      startTime.current = Date.now()
      isTracking.current = true
      isLongPressing.current = false

      setGestureState('idle')
      onSwipeStart?.()

      // Set up long-press timer
      longPressTimer.current = setTimeout(() => {
        if (isTracking.current && Math.abs(offsetX) < 10) {
          isLongPressing.current = true
          setGestureState('long-pressing')
          onLongPress?.()
        }
      }, longPressDuration)
    },
    [enabled, longPressDuration, onLongPress, onSwipeStart, offsetX],
  )

  // Handle gesture move
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isTracking.current || !enabled || isLongPressing.current) return

      const deltaX = clientX - startX.current
      const deltaY = clientY - startY.current

      // If vertical movement is greater, ignore horizontal swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
        return
      }

      // Clear long-press if we're swiping
      if (Math.abs(deltaX) > 10) {
        clearLongPressTimer()
      }

      // Clamp the offset
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
      setOffsetX(clampedOffset)

      // Determine direction
      if (deltaX > 0) {
        setDirection(isRTL ? 'left' : 'right')
      } else if (deltaX < 0) {
        setDirection(isRTL ? 'right' : 'left')
      } else {
        setDirection('none')
      }

      setGestureState('swiping')
    },
    [enabled, maxOffset, isRTL, clearLongPressTimer],
  )

  // Handle gesture end
  const handleEnd = useCallback(() => {
    if (!isTracking.current || !enabled) return

    clearLongPressTimer()

    const elapsed = Date.now() - startTime.current
    const velocity = Math.abs(offsetX) / elapsed
    const absOffset = Math.abs(offsetX)

    // Check if swipe is valid (past threshold OR fast enough)
    const isValidSwipe = absOffset >= swipeThreshold || velocity >= velocityThreshold

    if (isValidSwipe && !isLongPressing.current) {
      setGestureState('swiped')

      // Determine action based on direction (accounting for RTL)
      if (offsetX > 0) {
        // Physical right swipe
        if (isRTL) {
          onSwipeLeft?.() // In RTL, right physical swipe = left logical action
        } else {
          onSwipeRight?.() // In LTR, right physical swipe = right logical action
        }
      } else if (offsetX < 0) {
        // Physical left swipe
        if (isRTL) {
          onSwipeRight?.() // In RTL, left physical swipe = right logical action
        } else {
          onSwipeLeft?.() // In LTR, left physical swipe = left logical action
        }
      }
    }

    onSwipeEnd?.()

    // Reset after animation delay
    setTimeout(reset, 200)
  }, [
    enabled,
    offsetX,
    swipeThreshold,
    velocityThreshold,
    isRTL,
    onSwipeLeft,
    onSwipeRight,
    onSwipeEnd,
    clearLongPressTimer,
    reset,
  ])

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    },
    [handleStart],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    },
    [handleMove],
  )

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      handleEnd()
    },
    [handleEnd],
  )

  // Mouse handlers (for desktop testing)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY)
    },
    [handleStart],
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons === 1) {
        // Left mouse button held
        handleMove(e.clientX, e.clientY)
      }
    },
    [handleMove],
  )

  const onMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      handleEnd()
    },
    [handleEnd],
  )

  const onMouseLeave = useCallback(
    (_e: React.MouseEvent) => {
      if (isTracking.current) {
        reset()
      }
    },
    [reset],
  )

  // Memoize handlers object
  const handlers = useMemo<SwipeGestureHandlers>(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    }),
    [onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp, onMouseLeave],
  )

  // Memoize state object
  const state = useMemo<SwipeGestureState>(
    () => ({
      offsetX,
      direction,
      state: gestureState,
      isActive,
      progress,
    }),
    [offsetX, direction, gestureState, isActive, progress],
  )

  return { handlers, state, reset }
}

export default useSwipeGesture
