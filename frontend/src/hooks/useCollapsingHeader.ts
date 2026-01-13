import { useState, useEffect, useCallback, useRef } from 'react'
import { useScroll, useMotionValueEvent, MotionValue } from 'motion/react'

export interface CollapsingHeaderState {
  /** Whether the header is currently visible */
  isVisible: boolean
  /** Whether the header is in collapsed (compact) state */
  isCollapsed: boolean
  /** Current scroll position in pixels */
  scrollY: number
  /** Scroll direction: 'up' | 'down' | 'idle' */
  scrollDirection: 'up' | 'down' | 'idle'
  /** Whether user is at the top of the page (within threshold) */
  isAtTop: boolean
  /** Progress of collapse animation (0 = expanded, 1 = fully collapsed) */
  collapseProgress: number
}

export interface UseCollapsingHeaderOptions {
  /** Threshold in pixels before header starts collapsing (default: 60) */
  collapseThreshold?: number
  /** Amount of upward scroll needed to show header again (default: 20) */
  quickReturnThreshold?: number
  /** Distance to scroll before header collapses fully (default: 100) */
  collapseDistance?: number
  /** Container element to attach scroll listener (default: window) */
  containerRef?: React.RefObject<HTMLElement>
  /** Whether the header behavior is enabled (default: true) */
  enabled?: boolean
}

export interface UseCollapsingHeaderReturn extends CollapsingHeaderState {
  /** Reset the header to its initial visible state */
  reset: () => void
  /** Force show the header */
  show: () => void
  /** Force hide the header */
  hide: () => void
  /** Framer Motion scrollY motion value for animations */
  scrollYProgress: MotionValue<number>
}

/**
 * Hook for implementing collapsing headers that:
 * 1. Shrink on scroll to maximize content space
 * 2. Show contextual title bar when collapsed
 * 3. Implement quick-return pattern (reappear when scrolling up slightly)
 *
 * Mobile-first implementation with proper RTL support.
 */
export function useCollapsingHeader(
  options: UseCollapsingHeaderOptions = {},
): UseCollapsingHeaderReturn {
  const {
    collapseThreshold = 60,
    quickReturnThreshold = 20,
    collapseDistance = 100,
    containerRef,
    enabled = true,
  } = options

  // Use Framer Motion's useScroll for smooth scroll tracking
  const { scrollY, scrollYProgress } = useScroll({
    container: containerRef,
  })

  // State for header visibility and collapse
  const [state, setState] = useState<CollapsingHeaderState>({
    isVisible: true,
    isCollapsed: false,
    scrollY: 0,
    scrollDirection: 'idle',
    isAtTop: true,
    collapseProgress: 0,
  })

  // Track previous scroll position for direction detection
  const prevScrollY = useRef(0)
  // Track the scroll position when we started scrolling up (for quick-return)
  const scrollUpStartY = useRef<number | null>(null)
  // Track if header was forcefully shown/hidden
  const forcedState = useRef<'show' | 'hide' | null>(null)

  // Calculate collapse progress (0 = expanded, 1 = collapsed)
  const calculateCollapseProgress = useCallback(
    (currentY: number): number => {
      if (currentY <= collapseThreshold) return 0
      if (currentY >= collapseThreshold + collapseDistance) return 1
      return (currentY - collapseThreshold) / collapseDistance
    },
    [collapseThreshold, collapseDistance],
  )

  // Listen to scroll changes using Framer Motion's optimized event system
  useMotionValueEvent(scrollY, 'change', (currentY) => {
    if (!enabled) return

    // Clear forced state when user scrolls
    if (forcedState.current !== null) {
      forcedState.current = null
    }

    const prevY = prevScrollY.current
    const direction = currentY > prevY ? 'down' : currentY < prevY ? 'up' : 'idle'
    const isAtTop = currentY < collapseThreshold
    const collapseProgress = calculateCollapseProgress(currentY)

    // Quick-return pattern: track when scrolling up starts
    if (direction === 'up' && scrollUpStartY.current === null) {
      scrollUpStartY.current = currentY
    } else if (direction === 'down') {
      scrollUpStartY.current = null
    }

    // Determine visibility based on scroll direction and position
    let isVisible = state.isVisible

    if (isAtTop) {
      // Always show header at top
      isVisible = true
    } else if (direction === 'down') {
      // Hide when scrolling down (past threshold)
      isVisible = currentY < collapseThreshold
    } else if (direction === 'up' && scrollUpStartY.current !== null) {
      // Quick-return: show header when scrolling up past threshold
      const scrollUpDistance = scrollUpStartY.current - currentY
      if (scrollUpDistance >= quickReturnThreshold) {
        isVisible = true
      }
    }

    // Determine collapsed state
    const isCollapsed = !isAtTop && collapseProgress > 0.5

    setState({
      isVisible,
      isCollapsed,
      scrollY: currentY,
      scrollDirection: direction,
      isAtTop,
      collapseProgress,
    })

    prevScrollY.current = currentY
  })

  // Reset to initial state
  const reset = useCallback(() => {
    forcedState.current = null
    scrollUpStartY.current = null
    setState({
      isVisible: true,
      isCollapsed: false,
      scrollY: 0,
      scrollDirection: 'idle',
      isAtTop: true,
      collapseProgress: 0,
    })
  }, [])

  // Force show header
  const show = useCallback(() => {
    forcedState.current = 'show'
    setState((prev) => ({ ...prev, isVisible: true }))
  }, [])

  // Force hide header
  const hide = useCallback(() => {
    forcedState.current = 'hide'
    setState((prev) => ({ ...prev, isVisible: false }))
  }, [])

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      reset()
    }
  }, [enabled, reset])

  return {
    ...state,
    reset,
    show,
    hide,
    scrollYProgress,
  }
}

export default useCollapsingHeader
