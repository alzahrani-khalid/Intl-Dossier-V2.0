/**
 * Progressive Disclosure Components
 *
 * Components for progressively revealing helpful content to users
 * based on their experience level and interaction history.
 */

export { ProgressiveHint } from './ProgressiveHint'
export { ProgressiveEmptyState } from './ProgressiveEmptyState'

// Re-export types for convenience
export type {
  HintDefinition,
  HintContextType,
  HintInteractionStatus,
  UserExperienceLevel,
  ProgressiveHintProps,
  ProgressiveEmptyStateProps,
  ProgressiveHintSet,
  HintTier,
} from '@/types/progressive-disclosure.types'
