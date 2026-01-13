// Core empty state component
export {
  EmptyState,
  type EmptyStateProps,
  type EmptyStateVariant,
  type EmptyStateSize,
  type QuickAction,
} from './EmptyState'

// Specialized empty state components
export { SearchEmptyState, type SearchEmptyStateType } from './SearchEmptyState'

export { IntelligentSearchSuggestions } from './IntelligentSearchSuggestions'

export { FilterPresetsSection } from './FilterPresetsSection'

export { ListEmptyState, type EntityType } from './ListEmptyState'

export { DashboardEmptyState, type DashboardWidgetType } from './DashboardEmptyState'

// Intake role-specific empty state
export {
  IntakeRoleEmptyState,
  type IntakeRoleEmptyStateProps,
  type IntakeUserRole,
} from './IntakeRoleEmptyState'

// Tour-integrated empty state
export {
  TourableEmptyState,
  getTourIdForEntity,
  type TourableEntityType,
} from './TourableEmptyState'

// Video tutorial components
export {
  VideoTutorial,
  type VideoTutorialProps,
  type TranscriptSegment,
  type VideoTranscriptSegment,
} from './VideoTutorial'

export {
  TutorialEmptyState,
  type TutorialEmptyStateProps,
  type TutorialVideo,
} from './TutorialEmptyState'

// Re-export common icons for convenience
export { Plus, Upload, Search, HelpCircle } from './EmptyState'

// Re-export onboarding-integrated empty state
export { OnboardingEmptyState } from '@/components/onboarding/OnboardingEmptyState'

// Contextual suggestions for intelligent empty states
export {
  ContextualSuggestions,
  type ContextualSuggestionsProps,
  type ContextualSuggestionsVariant,
  type ContextualSuggestionsSize,
} from './ContextualSuggestions'

// Team collaboration empty state
export {
  CollaborativeEmptyState,
  type CollaborativeEmptyStateProps,
} from './CollaborativeEmptyState'

export { TeamInvitationDialog, type TeamInvitationDialogProps } from './TeamInvitationDialog'

// Progressive disclosure empty states
export { ProgressiveEmptyState, ProgressiveHint } from '@/components/progressive-disclosure'

// Notification preview timeline
export {
  NotificationPreviewTimeline,
  type NotificationPreviewTimelineProps,
  type PreviewNotification,
} from './NotificationPreviewTimeline'
