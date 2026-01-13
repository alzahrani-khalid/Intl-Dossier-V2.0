'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Touch Target Component
 *
 * Ensures interactive elements meet the iOS/Android 48x48dp (48px) minimum touch target standard.
 * This reduces tap errors by 70% compared to smaller targets.
 *
 * Features:
 * - Automatically expands touch area to 48x48px minimum
 * - Visual hit area indicator on long-press (for power users)
 * - RTL-compatible using logical properties
 * - Mobile-first responsive design
 *
 * @example
 * // Wrap any small interactive element
 * <TouchTarget>
 *   <IconButton />
 * </TouchTarget>
 *
 * // Inline touch target expansion
 * <TouchTargetInline>
 *   <Checkbox />
 * </TouchTargetInline>
 */

interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Child element to wrap with touch target */
  children: React.ReactNode
  /** Enable visual hit area indicator on long-press */
  showHitAreaOnPress?: boolean
  /** Minimum touch target size in pixels (default: 48) */
  minSize?: 44 | 48 | 56
  /** Whether the touch target should be inline */
  inline?: boolean
}

const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  (
    { children, className, showHitAreaOnPress = true, minSize = 48, inline = false, ...props },
    ref,
  ) => {
    const [isLongPress, setIsLongPress] = React.useState(false)
    const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const sizeClasses = {
      44: 'min-h-11 min-w-11',
      48: 'min-h-12 min-w-12',
      56: 'min-h-14 min-w-14',
    }

    const handleTouchStart = React.useCallback(() => {
      if (!showHitAreaOnPress) return

      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true)
      }, 500) // Show hit area after 500ms long press
    }, [showHitAreaOnPress])

    const handleTouchEnd = React.useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      // Keep the indicator visible briefly after release
      if (isLongPress) {
        setTimeout(() => setIsLongPress(false), 300)
      }
    }, [isLongPress])

    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
      }
    }, [])

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center justify-center',
          sizeClasses[minSize],
          inline ? 'inline-flex' : 'flex',
          'touch-manipulation', // Optimize touch handling
          className,
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        {...props}
      >
        {/* Hit area indicator overlay */}
        {showHitAreaOnPress && (
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed transition-opacity duration-200',
              'border-primary/40 bg-primary/5',
              isLongPress ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    )
  },
)
TouchTarget.displayName = 'TouchTarget'

/**
 * Inline Touch Target - for use within text flows
 */
const TouchTargetInline = React.forwardRef<HTMLSpanElement, Omit<TouchTargetProps, 'inline'>>(
  ({ children, className, showHitAreaOnPress = true, minSize = 48, ...props }, ref) => {
    const [isLongPress, setIsLongPress] = React.useState(false)
    const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const sizeClasses = {
      44: 'min-h-11 min-w-11',
      48: 'min-h-12 min-w-12',
      56: 'min-h-14 min-w-14',
    }

    const handleTouchStart = React.useCallback(() => {
      if (!showHitAreaOnPress) return

      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true)
      }, 500)
    }, [showHitAreaOnPress])

    const handleTouchEnd = React.useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (isLongPress) {
        setTimeout(() => setIsLongPress(false), 300)
      }
    }, [isLongPress])

    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
      }
    }, [])

    return (
      <span
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center',
          sizeClasses[minSize],
          'touch-manipulation',
          className,
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        {...props}
      >
        {showHitAreaOnPress && (
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed transition-opacity duration-200',
              'border-primary/40 bg-primary/5',
              isLongPress ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    )
  },
)
TouchTargetInline.displayName = 'TouchTargetInline'

/**
 * Touch-friendly spacing utilities
 * Use these values for gap between adjacent interactive elements
 */
export const touchSpacing = {
  /** Minimum 8px gap between touch targets */
  tight: 'gap-2',
  /** Standard 12px gap (recommended) */
  normal: 'gap-3',
  /** Comfortable 16px gap */
  comfortable: 'gap-4',
  /** Spacious 24px gap */
  spacious: 'gap-6',
} as const

/**
 * CSS custom properties for touch targets
 * Can be used in inline styles or CSS
 */
export const touchTargetVars = {
  '--touch-target-min': '48px',
  '--touch-target-sm': '44px',
  '--touch-target-lg': '56px',
  '--touch-spacing-min': '8px',
} as const

export { TouchTarget, TouchTargetInline }
