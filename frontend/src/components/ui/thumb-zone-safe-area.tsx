/**
 * ThumbZoneSafeArea Component
 *
 * A utility component that provides safe area padding for mobile devices,
 * ensuring content doesn't overlap with iOS bottom notch/home indicator.
 *
 * This is especially important for:
 * - Full-screen modals/sheets
 * - Pages with sticky bottom action bars
 * - Bottom navigation areas
 *
 * Uses CSS env() for device-specific safe area insets.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ThumbZoneSafeAreaProps {
  children?: React.ReactNode
  className?: string
  /**
   * Which safe areas to apply
   * @default 'bottom'
   */
  position?: 'bottom' | 'top' | 'both' | 'all'
  /**
   * Minimum padding to apply even on devices without notches
   * @default true
   */
  includeMinPadding?: boolean
  /**
   * Render as a specific element
   * @default 'div'
   */
  as?: React.ElementType
}

/**
 * ThumbZoneSafeArea - Wrapper for content that needs safe area awareness
 */
export function ThumbZoneSafeArea({
  children,
  className,
  position = 'bottom',
  includeMinPadding = true,
  as: Component = 'div',
}: ThumbZoneSafeAreaProps) {
  const safeAreaStyles = cn(
    // Bottom safe area
    (position === 'bottom' || position === 'both' || position === 'all') && [
      includeMinPadding
        ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
        : 'pb-[env(safe-area-inset-bottom)]',
    ],
    // Top safe area
    (position === 'top' || position === 'both' || position === 'all') && [
      includeMinPadding
        ? 'pt-[max(1rem,env(safe-area-inset-top))]'
        : 'pt-[env(safe-area-inset-top)]',
    ],
    // Side safe areas (for landscape mode)
    position === 'all' && ['ps-[env(safe-area-inset-left)]', 'pe-[env(safe-area-inset-right)]'],
    className,
  )

  return <Component className={safeAreaStyles}>{children}</Component>
}

/**
 * Hook to detect if device has bottom safe area (iOS notch)
 * Returns true if the device needs extra bottom padding
 */
export function useHasBottomSafeArea(): boolean {
  const [hasBottomSafeArea, setHasBottomSafeArea] = React.useState(false)

  React.useEffect(() => {
    // Check if CSS env() is supported and has a value
    const testElement = document.createElement('div')
    testElement.style.paddingBottom = 'env(safe-area-inset-bottom)'
    document.body.appendChild(testElement)

    const computedStyle = window.getComputedStyle(testElement)
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0

    document.body.removeChild(testElement)
    setHasBottomSafeArea(paddingBottom > 0)
  }, [])

  return hasBottomSafeArea
}

/**
 * CSS custom properties for safe areas that can be used in inline styles
 * These fallback to 0 if not supported
 */
export const safeAreaInsets = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const

/**
 * Utility CSS classes for quick safe area application
 */
export const safeAreaClasses = {
  // Bottom safe area (most common for action bars)
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  bottomWithMin: 'pb-[max(1rem,env(safe-area-inset-bottom))]',

  // Top safe area (for full-screen modals)
  top: 'pt-[env(safe-area-inset-top)]',
  topWithMin: 'pt-[max(1rem,env(safe-area-inset-top))]',

  // All sides
  all: 'p-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]',
} as const

export default ThumbZoneSafeArea
