/**
 * Context-Aware Floating Action Button (FAB) with Speed Dial
 *
 * A mobile-optimized FAB that changes its primary action based on the current
 * screen context and supports expanding into a speed dial menu on long-press.
 *
 * Features:
 * - Context-aware: Changes icon/action based on current route
 * - Speed dial: Long-press expands into related quick actions
 * - RTL-aware positioning
 * - Mobile-first design with thumb-zone optimization
 * - Safe area padding for iOS devices
 * - Smooth animations via Framer Motion
 * - Accessibility compliant (WCAG AA)
 *
 * Usage:
 * ```tsx
 * <ContextAwareFAB
 *   contextActions={{
 *     '/dossiers': { icon: Plus, label: 'Create Dossier', onClick: () => {} },
 *     '/dossiers/:id': { icon: Edit, label: 'Edit', onClick: () => {} },
 *   }}
 *   speedDialActions={[
 *     { icon: FileText, label: 'New Brief', onClick: () => {} },
 *     { icon: Calendar, label: 'Schedule', onClick: () => {} },
 *   ]}
 * />
 * ```
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  LucideIcon,
  Plus,
  X,
  Edit,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  FolderOpen,
  Search,
  LayoutDashboard,
  Settings,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

export interface FABAction {
  /** Icon to display */
  icon: LucideIcon
  /** Translated label for the action */
  label: string
  /** Click handler */
  onClick: () => void
  /** Optional variant for styling */
  variant?: 'default' | 'secondary' | 'destructive'
  /** Whether action is disabled */
  disabled?: boolean
  /** Aria label override */
  ariaLabel?: string
}

export interface SpeedDialAction extends FABAction {
  /** Optional color for the mini FAB */
  color?: string
}

export interface ContextAwareFABProps {
  /**
   * Map of route patterns to primary FAB actions
   * Supports exact matches and patterns with wildcards
   */
  contextActions?: Record<string, FABAction>
  /**
   * Speed dial actions shown on long-press/expansion
   */
  speedDialActions?: SpeedDialAction[]
  /**
   * Default action when no context match found
   */
  defaultAction?: FABAction
  /**
   * Current route path (if not using automatic detection)
   */
  currentRoute?: string
  /**
   * Hide FAB when scrolling down
   * @default false
   */
  hideOnScroll?: boolean
  /**
   * Position of the FAB
   */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg'
  /**
   * Visibility state (for manual control)
   * @default true
   */
  visible?: boolean
  /**
   * Long-press duration in ms to trigger speed dial
   * @default 400
   */
  longPressDuration?: number
  /**
   * Callback when speed dial opens/closes
   */
  onSpeedDialChange?: (isOpen: boolean) => void
  /**
   * Additional class names
   */
  className?: string
}

// ============================================================================
// Hook: useContextualFABAction
// ============================================================================

/**
 * Hook to determine the current FAB action based on route
 */
export function useContextualFABAction(
  contextActions: Record<string, FABAction> | undefined,
  defaultAction: FABAction | undefined,
  currentRoute?: string,
): FABAction | undefined {
  const [action, setAction] = React.useState<FABAction | undefined>(defaultAction)

  React.useEffect(() => {
    if (!contextActions) {
      setAction(defaultAction)
      return
    }

    // Get current path from window if not provided
    const path = currentRoute || window.location.pathname

    // Try exact match first
    if (contextActions[path]) {
      setAction(contextActions[path])
      return
    }

    // Try pattern matching (e.g., /dossiers/:id matches /dossiers/123)
    for (const [pattern, patternAction] of Object.entries(contextActions)) {
      const regex = new RegExp(
        '^' +
          pattern
            .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
            .replace(/\*/g, '.*') + // Replace * with wildcard
          '$',
      )
      if (regex.test(path)) {
        setAction(patternAction)
        return
      }
    }

    // Fallback to default
    setAction(defaultAction)
  }, [contextActions, defaultAction, currentRoute])

  return action
}

// ============================================================================
// Component: SpeedDialItem
// ============================================================================

interface SpeedDialItemProps {
  action: SpeedDialAction
  index: number
  totalItems: number
  isOpen: boolean
  isRTL: boolean
  size: 'default' | 'sm' | 'lg'
  onClose: () => void
}

function SpeedDialItem({
  action,
  index,
  totalItems,
  isOpen,
  isRTL,
  size,
  onClose,
}: SpeedDialItemProps) {
  const Icon = action.icon

  // Calculate staggered animation delay
  const delay = isOpen ? index * 0.05 : (totalItems - index - 1) * 0.03

  // Size classes for mini FABs
  const sizeClasses = cn(
    size === 'sm' && 'h-10 w-10 min-w-10',
    size === 'default' && 'h-11 w-11 min-w-11',
    size === 'lg' && 'h-12 w-12 min-w-12',
  )

  const iconSizeClasses = cn(
    size === 'sm' && 'h-4 w-4',
    size === 'default' && 'h-5 w-5',
    size === 'lg' && 'h-6 w-6',
  )

  // Distance from main FAB (increases per item)
  const distanceFromMain = 64 + index * 56

  const handleClick = () => {
    action.onClick()
    onClose()
  }

  return (
    <motion.div
      className="absolute flex items-center gap-2"
      style={{
        bottom: distanceFromMain,
        // RTL: items go to start side, LTR: items go to end side
        [isRTL ? 'left' : 'right']: 0,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : 20,
        scale: isOpen ? 1 : 0.8,
      }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{
        duration: 0.2,
        delay,
        ease: 'easeOut',
      }}
    >
      {/* Label - positioned before button in RTL, after in LTR */}
      <motion.span
        className={cn(
          'rounded-md bg-popover px-2 py-1 text-sm font-medium text-popover-foreground shadow-md',
          'whitespace-nowrap',
          isRTL ? 'order-2' : 'order-1',
        )}
        initial={{ opacity: 0, x: isRTL ? -8 : 8 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          x: isOpen ? 0 : isRTL ? -8 : 8,
        }}
        transition={{ duration: 0.15, delay: delay + 0.05 }}
      >
        {action.label}
      </motion.span>

      {/* Mini FAB */}
      <Button
        variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
        className={cn(
          'rounded-full shadow-md hover:shadow-lg',
          'transition-shadow duration-200',
          sizeClasses,
          isRTL ? 'order-1' : 'order-2',
        )}
        onClick={handleClick}
        disabled={action.disabled}
        aria-label={action.ariaLabel || action.label}
      >
        <Icon className={iconSizeClasses} />
      </Button>
    </motion.div>
  )
}

// ============================================================================
// Component: ContextAwareFAB
// ============================================================================

export function ContextAwareFAB({
  contextActions,
  speedDialActions = [],
  defaultAction,
  currentRoute,
  hideOnScroll = false,
  position,
  size = 'default',
  visible = true,
  longPressDuration = 400,
  onSpeedDialChange,
  className,
}: ContextAwareFABProps) {
  const { t, i18n } = useTranslation('fab')
  const isRTL = i18n.language === 'ar'

  // State
  const [isScrollingDown, setIsScrollingDown] = React.useState(false)
  const [isSpeedDialOpen, setIsSpeedDialOpen] = React.useState(false)
  const [isLongPressing, setIsLongPressing] = React.useState(false)
  const lastScrollY = React.useRef(0)
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null)

  // Get current action based on context
  const currentAction = useContextualFABAction(contextActions, defaultAction, currentRoute)

  // Animation values for long-press feedback
  const pressProgress = useMotionValue(0)
  const ringOpacity = useTransform(pressProgress, [0, 1], [0, 0.3])
  const ringScale = useTransform(pressProgress, [0, 1], [1, 1.3])

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

  // Notify parent of speed dial state changes
  React.useEffect(() => {
    onSpeedDialChange?.(isSpeedDialOpen)
  }, [isSpeedDialOpen, onSpeedDialChange])

  // Close speed dial on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSpeedDialOpen) {
        setIsSpeedDialOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSpeedDialOpen])

  // Long-press handlers
  const handlePressStart = React.useCallback(() => {
    if (speedDialActions.length === 0) return

    setIsLongPressing(true)

    // Animate the progress ring
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / longPressDuration, 1)
      pressProgress.set(progress)

      if (progress < 1 && isLongPressing) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)

    longPressTimer.current = setTimeout(() => {
      setIsSpeedDialOpen(true)
      setIsLongPressing(false)
      pressProgress.set(0)
      // Haptic feedback on mobile if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }, longPressDuration)
  }, [speedDialActions.length, longPressDuration, pressProgress, isLongPressing])

  const handlePressEnd = React.useCallback(() => {
    setIsLongPressing(false)
    pressProgress.set(0)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [pressProgress])

  // Click handler - toggle speed dial if open, otherwise execute primary action
  const handleClick = React.useCallback(() => {
    if (isSpeedDialOpen) {
      setIsSpeedDialOpen(false)
      return
    }

    // If long press was interrupted, don't trigger action
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Execute primary action
    currentAction?.onClick()
  }, [isSpeedDialOpen, currentAction])

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
  )

  // Size classes for main FAB
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

  const isVisible = visible && (!hideOnScroll || !isScrollingDown)

  // Get the icon to display
  const CurrentIcon = isSpeedDialOpen ? X : currentAction?.icon || Plus

  return (
    <>
      {/* Backdrop overlay when speed dial is open */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSpeedDialOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Main FAB container */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(positionClasses, className)}
          >
            {/* Speed dial items */}
            <AnimatePresence>
              {isSpeedDialOpen &&
                speedDialActions.map((action, index) => (
                  <SpeedDialItem
                    key={action.label}
                    action={action}
                    index={index}
                    totalItems={speedDialActions.length}
                    isOpen={isSpeedDialOpen}
                    isRTL={isRTL}
                    size={size}
                    onClose={() => setIsSpeedDialOpen(false)}
                  />
                ))}
            </AnimatePresence>

            {/* Long-press progress ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none"
              style={{
                opacity: ringOpacity,
                scale: ringScale,
              }}
            />

            {/* Main FAB button */}
            <Button
              variant={currentAction?.variant === 'destructive' ? 'destructive' : 'default'}
              className={cn(
                'rounded-full shadow-lg hover:shadow-xl',
                'transition-all duration-200',
                'touch-manipulation',
                sizeClasses,
              )}
              onClick={handleClick}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchCancel={handlePressEnd}
              disabled={currentAction?.disabled}
              aria-label={
                isSpeedDialOpen
                  ? t('closeSpeedDial')
                  : currentAction?.ariaLabel || currentAction?.label || t('actions')
              }
              aria-expanded={isSpeedDialOpen}
              aria-haspopup={speedDialActions.length > 0 ? 'menu' : undefined}
            >
              <motion.div
                animate={{ rotate: isSpeedDialOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentIcon className={cn(iconSizeClasses, 'shrink-0')} />
              </motion.div>
            </Button>

            {/* Long-press hint (shows briefly for first-time users) */}
            {speedDialActions.length > 0 && !isSpeedDialOpen && (
              <motion.div
                className={cn(
                  'absolute bottom-full mb-2 whitespace-nowrap',
                  'rounded-md bg-popover px-2 py-1 text-xs text-muted-foreground shadow-sm',
                  'pointer-events-none',
                  isRTL ? 'start-0' : 'end-0',
                )}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {t('longPressHint')}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// Hook: useShowMobileFAB
// ============================================================================

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

// ============================================================================
// Exports
// ============================================================================

export default ContextAwareFAB

// Re-export icons for convenience
export {
  Plus,
  Edit,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  FolderOpen,
  Search,
  LayoutDashboard,
  Settings,
  Bell,
}
