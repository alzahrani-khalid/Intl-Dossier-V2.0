/**
 * FloatingActionButton (FAB) Component
 *
 * A mobile-optimized floating action button positioned in the thumb-zone
 * (bottom-right for LTR, bottom-left for RTL) for easy one-handed access.
 *
 * Features:
 * - Thumb-zone positioning (bottom corner)
 * - RTL-aware (flips position automatically)
 * - Safe area padding for iOS devices
 * - Touch-friendly 56x56px size (larger than minimum 44px)
 * - Optional extended FAB with label
 * - Scroll-aware: can hide on scroll
 * - Smooth enter/exit animations
 * - Accessibility compliant (WCAG AA)
 *
 * Usage:
 * ```tsx
 * <FloatingActionButton
 *   icon={Plus}
 *   label="Create"
 *   onClick={() => setDialogOpen(true)}
 * />
 * ```
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface FloatingActionButtonProps extends Omit<ButtonProps, 'size' | 'asChild'> {
  /**
   * Icon to display in the FAB
   */
  icon: LucideIcon
  /**
   * Optional label for extended FAB (shows on hover/tap or always)
   */
  label?: string
  /**
   * When to show the label
   * - 'hover': Show on hover/focus (default)
   * - 'always': Always show
   * - 'never': Never show (icon-only FAB)
   * @default 'hover'
   */
  labelDisplay?: 'hover' | 'always' | 'never'
  /**
   * Hide FAB when scrolling down, show when scrolling up
   * @default false
   */
  hideOnScroll?: boolean
  /**
   * Custom position (overrides RTL-aware default)
   */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  /**
   * Distance from edge (includes safe area)
   * @default 'md'
   */
  inset?: 'sm' | 'md' | 'lg'
  /**
   * Visibility state (for manual control)
   * @default true
   */
  visible?: boolean
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg'
}

export function FloatingActionButton({
  icon: Icon,
  label,
  labelDisplay = 'hover',
  hideOnScroll = false,
  position,
  inset = 'md',
  visible = true,
  size = 'default',
  className,
  ...props
}: FloatingActionButtonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [isScrollingDown, setIsScrollingDown] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const lastScrollY = React.useRef(0)

  // Handle scroll direction detection
  React.useEffect(() => {
    if (!hideOnScroll) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isDown = currentScrollY > lastScrollY.current && currentScrollY > 100

      if (isDown !== isScrollingDown) {
        setIsScrollingDown(isDown)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hideOnScroll, isScrollingDown])

  // Determine position based on RTL
  const resolvedPosition = position || (isRTL ? 'bottom-left' : 'bottom-right')

  // Position classes
  const positionClasses = cn(
    'fixed z-50',
    // Bottom safe area
    'bottom-[max(1rem,env(safe-area-inset-bottom))]',
    // Horizontal position
    resolvedPosition === 'bottom-right' && 'end-4 sm:end-6',
    resolvedPosition === 'bottom-left' && 'start-4 sm:start-6',
    resolvedPosition === 'bottom-center' && 'start-1/2 -translate-x-1/2',
    // Additional inset
    inset === 'sm' && 'bottom-[max(0.5rem,env(safe-area-inset-bottom))]',
    inset === 'lg' && 'bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))]',
  )

  // Size classes
  const sizeClasses = cn(
    size === 'sm' && 'h-12 w-12 min-w-12',
    size === 'default' && 'h-14 w-14 min-w-14',
    size === 'lg' && 'h-16 w-16 min-w-16',
  )

  const iconSizeClasses = cn(
    size === 'sm' && 'h-5 w-5',
    size === 'default' && 'h-6 w-6',
    size === 'lg' && 'h-7 w-7',
  )

  // Extended FAB (with label) size
  const extendedClasses = cn(
    (labelDisplay === 'always' || (labelDisplay === 'hover' && isHovered)) &&
      label && [
        'w-auto px-4 gap-2',
        size === 'sm' && 'h-12',
        size === 'default' && 'h-14',
        size === 'lg' && 'h-16',
      ],
  )

  const isVisible = visible && (!hideOnScroll || !isScrollingDown)
  const showLabel = label && (labelDisplay === 'always' || (labelDisplay === 'hover' && isHovered))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={positionClasses}
        >
          <Button
            {...props}
            size="lg"
            className={cn(
              // Base FAB styles
              'rounded-full shadow-lg hover:shadow-xl',
              'transition-all duration-200',
              // Size
              sizeClasses,
              // Extended FAB
              extendedClasses,
              className,
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >
            <Icon className={cn(iconSizeClasses, 'shrink-0')} />
            <AnimatePresence mode="wait">
              {showLabel && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook to detect if mobile FAB should be shown
 * Returns true on mobile viewports (< 640px)
 */
export function useShowMobileFAB(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default FloatingActionButton
