/**
 * Swipeable Components
 *
 * Mobile-first swipe gesture components for entity cards.
 * Features:
 * - Swipe right to favorite/pin
 * - Swipe left to archive/delete
 * - Long-press for contextual menu
 * - Haptic feedback for each gesture
 * - RTL support with automatic direction adjustment
 */

// Core hooks
export { useSwipeGesture } from '@/hooks/useSwipeGesture'
export type {
  SwipeDirection,
  SwipeState,
  SwipeGestureConfig,
  SwipeGestureState,
  SwipeGestureHandlers,
  SwipeGestureResult,
} from '@/hooks/useSwipeGesture'

export { useHapticFeedback } from '@/hooks/useHapticFeedback'
export type {
  HapticIntensity,
  HapticPattern,
  HapticFeedbackOptions,
  HapticFeedbackResult,
} from '@/hooks/useHapticFeedback'

// Core component
export { SwipeableCard } from '@/components/ui/swipeable-card'
export type {
  SwipeAction,
  SwipeActionConfig,
  ContextMenuItem,
  SwipeableCardProps,
} from '@/components/ui/swipeable-card'

// Entity-specific swipeable cards
export { DossierCardSwipeable } from '@/components/DossierCardSwipeable'
export type { DossierCardSwipeableProps } from '@/components/DossierCardSwipeable'

export { PersonCardSwipeable } from '@/components/Dossier/PersonCardSwipeable'
export type { PersonCardSwipeableProps } from '@/components/Dossier/PersonCardSwipeable'
