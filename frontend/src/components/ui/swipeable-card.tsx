/**
 * SwipeableCard Component
 *
 * A wrapper component that adds swipe gestures to any card content.
 * Features:
 * - Swipe right to favorite/pin
 * - Swipe left to archive/delete
 * - Long-press for contextual menu
 * - Haptic feedback for each gesture
 * - RTL support with automatic direction adjustment
 * - Mobile-first responsive design
 *
 * @example
 * <SwipeableCard
 *   onSwipeRight={() => handleFavorite()}
 *   onSwipeLeft={() => handleArchive()}
 *   onLongPress={() => setContextMenuOpen(true)}
 *   rightActionIcon={<Star />}
 *   leftActionIcon={<Archive />}
 * >
 *   <YourCardContent />
 * </SwipeableCard>
 */

import { forwardRef, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Archive, Trash2, Pin, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSwipeGesture, type SwipeGestureConfig } from '@/hooks/useSwipeGesture'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'

export type SwipeAction = 'favorite' | 'pin' | 'archive' | 'delete' | 'custom'

export interface SwipeActionConfig {
  /** Action type */
  type: SwipeAction
  /** Custom icon (overrides default) */
  icon?: React.ReactNode
  /** Background color class */
  colorClass?: string
  /** Action label for accessibility */
  label: string
  /** Callback when action is triggered */
  onAction: () => void
}

export interface ContextMenuItem {
  /** Unique key for the item */
  key: string
  /** Label text */
  label: string
  /** Icon component */
  icon?: React.ReactNode
  /** Whether this is a destructive action */
  destructive?: boolean
  /** Callback when selected */
  onSelect: () => void
}

export interface SwipeableCardProps {
  /** Card content to wrap */
  children: React.ReactNode
  /** Additional class names */
  className?: string
  /** Right swipe action config (favorite/pin) */
  rightAction?: SwipeActionConfig
  /** Left swipe action config (archive/delete) */
  leftAction?: SwipeActionConfig
  /** Context menu items for long-press */
  contextMenuItems?: ContextMenuItem[]
  /** Legacy: Right swipe callback */
  onSwipeRight?: () => void
  /** Legacy: Left swipe callback */
  onSwipeLeft?: () => void
  /** Legacy: Long-press callback */
  onLongPress?: () => void
  /** Legacy: Right action icon */
  rightActionIcon?: React.ReactNode
  /** Legacy: Left action icon */
  leftActionIcon?: React.ReactNode
  /** Legacy: Right action label */
  rightActionLabel?: string
  /** Legacy: Left action label */
  leftActionLabel?: string
  /** Swipe gesture configuration */
  swipeConfig?: Partial<SwipeGestureConfig>
  /** Disable swipe gestures */
  disabled?: boolean
  /** Test ID for testing */
  'data-testid'?: string
}

// Default action icons
const DEFAULT_ICONS: Record<SwipeAction, React.ReactNode> = {
  favorite: <Star className="h-5 w-5" />,
  pin: <Pin className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
  delete: <Trash2 className="h-5 w-5" />,
  custom: <MoreVertical className="h-5 w-5" />,
}

// Default action colors
const DEFAULT_COLORS: Record<SwipeAction, string> = {
  favorite: 'bg-yellow-500',
  pin: 'bg-blue-500',
  archive: 'bg-gray-500',
  delete: 'bg-red-500',
  custom: 'bg-purple-500',
}

export const SwipeableCard = forwardRef<HTMLDivElement, SwipeableCardProps>(function SwipeableCard(
  {
    children,
    className,
    rightAction,
    leftAction,
    contextMenuItems,
    onSwipeRight,
    onSwipeLeft,
    onLongPress,
    rightActionIcon,
    leftActionIcon,
    rightActionLabel,
    leftActionLabel,
    swipeConfig = {},
    disabled = false,
    'data-testid': testId,
  },
  ref,
) {
  const { t, i18n } = useTranslation('swipe-gestures')
  const isRTL = i18n.language === 'ar'
  const haptic = useHapticFeedback()
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false)

  // Normalize action configs (support legacy props)
  const normalizedRightAction = useMemo<SwipeActionConfig | undefined>(() => {
    if (rightAction) return rightAction
    if (onSwipeRight) {
      return {
        type: 'favorite',
        icon: rightActionIcon,
        label: rightActionLabel || t('actions.favorite'),
        onAction: onSwipeRight,
      }
    }
    return undefined
  }, [rightAction, onSwipeRight, rightActionIcon, rightActionLabel, t])

  const normalizedLeftAction = useMemo<SwipeActionConfig | undefined>(() => {
    if (leftAction) return leftAction
    if (onSwipeLeft) {
      return {
        type: 'archive',
        icon: leftActionIcon,
        label: leftActionLabel || t('actions.archive'),
        onAction: onSwipeLeft,
      }
    }
    return undefined
  }, [leftAction, onSwipeLeft, leftActionIcon, leftActionLabel, t])

  // Handle swipe actions with haptic feedback
  const handleSwipeRight = useCallback(() => {
    if (normalizedRightAction) {
      haptic.success()
      normalizedRightAction.onAction()
    }
  }, [normalizedRightAction, haptic])

  const handleSwipeLeft = useCallback(() => {
    if (normalizedLeftAction) {
      haptic.impact()
      normalizedLeftAction.onAction()
    }
  }, [normalizedLeftAction, haptic])

  const handleLongPress = useCallback(() => {
    haptic.selection()
    if (contextMenuItems?.length) {
      setContextMenuOpen(true)
    } else {
      onLongPress?.()
    }
  }, [haptic, contextMenuItems, onLongPress])

  // Swipe gesture hook
  const { handlers, state } = useSwipeGesture({
    ...swipeConfig,
    enabled: !disabled,
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    onLongPress: handleLongPress,
    onSwipeStart: () => setHasTriggeredHaptic(false),
  })

  // Trigger haptic when crossing threshold
  if (state.isActive && !hasTriggeredHaptic) {
    haptic.selection()
    setHasTriggeredHaptic(true)
  }

  // Get action icon
  const getActionIcon = (action: SwipeActionConfig | undefined) => {
    if (!action) return null
    return action.icon || DEFAULT_ICONS[action.type]
  }

  // Get action color
  const getActionColor = (action: SwipeActionConfig | undefined) => {
    if (!action) return ''
    return action.colorClass || DEFAULT_COLORS[action.type]
  }

  // Calculate opacity based on progress
  const actionOpacity = Math.min(state.progress * 1.5, 1)

  // Animation variants
  const cardVariants = {
    idle: { x: 0 },
    swiping: { x: state.offsetX },
    swiped: { x: state.offsetX > 0 ? 200 : -200, opacity: 0 },
  }

  const cardContent = (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Background action indicators */}
      <AnimatePresence>
        {state.state === 'swiping' && (
          <>
            {/* Right action background (visible when swiping right in LTR) */}
            {state.offsetX > 0 && normalizedRightAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: actionOpacity }}
                exit={{ opacity: 0 }}
                className={cn(
                  'absolute inset-y-0 start-0 flex items-center justify-start ps-4',
                  'w-full rounded-xl',
                  getActionColor(normalizedRightAction),
                )}
                aria-hidden="true"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: state.isActive ? 1.2 : 1 }}
                  className="text-white"
                >
                  {getActionIcon(normalizedRightAction)}
                </motion.div>
                {state.isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ms-2 text-sm font-medium text-white"
                  >
                    {normalizedRightAction.label}
                  </motion.span>
                )}
              </motion.div>
            )}

            {/* Left action background (visible when swiping left in LTR) */}
            {state.offsetX < 0 && normalizedLeftAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: actionOpacity }}
                exit={{ opacity: 0 }}
                className={cn(
                  'absolute inset-y-0 end-0 flex items-center justify-end pe-4',
                  'w-full rounded-xl',
                  getActionColor(normalizedLeftAction),
                )}
                aria-hidden="true"
              >
                {state.isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="me-2 text-sm font-medium text-white"
                  >
                    {normalizedLeftAction.label}
                  </motion.span>
                )}
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: state.isActive ? 1.2 : 1 }}
                  className="text-white"
                >
                  {getActionIcon(normalizedLeftAction)}
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Card content with swipe transform */}
      <motion.div
        ref={ref}
        className="relative z-10 bg-card"
        variants={cardVariants}
        animate={
          state.state === 'swiped' ? 'swiped' : state.state === 'swiping' ? 'swiping' : 'idle'
        }
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        style={{
          touchAction: 'pan-y', // Allow vertical scrolling
          userSelect: 'none',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid={testId}
        data-swipe-state={state.state}
        data-swipe-direction={state.direction}
        data-swipe-active={state.isActive}
        {...handlers}
      >
        {children}
      </motion.div>
    </div>
  )

  // Wrap with context menu if items provided
  if (contextMenuItems?.length) {
    return (
      <ContextMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
        <ContextMenuContent className="w-56" dir={isRTL ? 'rtl' : 'ltr'}>
          {contextMenuItems.map((item, index) => (
            <ContextMenuItem
              key={item.key}
              onClick={() => {
                haptic.selection()
                item.onSelect()
              }}
              className={cn(
                'flex items-center gap-2',
                item.destructive && 'text-destructive focus:text-destructive',
              )}
            >
              {item.icon}
              {item.label}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return cardContent
})

SwipeableCard.displayName = 'SwipeableCard'

export default SwipeableCard
