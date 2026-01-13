/**
 * Onboarding Checklist Type Definitions
 *
 * Type system for role-specific onboarding checklists that guide users
 * through essential setup steps with progress tracking and milestones.
 */

/**
 * User roles that have specific onboarding paths
 */
export type UserRole = 'admin' | 'editor' | 'viewer' | 'analyst' | 'manager'

/**
 * Entity types that can be tracked in onboarding
 */
export type OnboardingEntityType =
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'document'
  | 'relationship'
  | 'notification'
  | 'brief'
  | 'position'
  | 'mou'
  | 'person'
  | 'forum'
  | 'working_group'
  | 'calendar_event'

/**
 * Individual checklist item definition
 */
export interface OnboardingChecklistItem {
  /** Unique identifier for the item */
  id: string
  /** Entity type this item relates to (for automatic completion tracking) */
  entityType?: OnboardingEntityType
  /** Translation key for title */
  titleKey: string
  /** Translation key for description */
  descriptionKey: string
  /** Translation key for hint/tip (optional) */
  hintKey?: string
  /** Route to navigate when clicking the item */
  route?: string
  /** Action to perform (alternative to route) */
  action?: 'create' | 'configure' | 'explore' | 'learn'
  /** Order in the checklist */
  order: number
  /** Whether this item is required for onboarding completion */
  isRequired?: boolean
  /** Icon name from Lucide */
  iconName: string
  /** Estimated time to complete (in minutes) */
  estimatedMinutes?: number
  /** Prerequisite item IDs that must be completed first */
  prerequisites?: string[]
}

/**
 * Role-specific checklist definition
 */
export interface RoleChecklist {
  /** User role this checklist is for */
  role: UserRole
  /** Checklist items for this role */
  items: OnboardingChecklistItem[]
  /** Milestone thresholds (percentage completion for celebration) */
  milestones: number[]
}

/**
 * User's progress on a checklist item
 */
export interface ChecklistItemProgress {
  /** Checklist item ID */
  itemId: string
  /** Whether the item is completed */
  isCompleted: boolean
  /** Timestamp when completed */
  completedAt?: string
  /** Whether the item was skipped */
  wasSkipped?: boolean
  /** Timestamp when skipped */
  skippedAt?: string
}

/**
 * User's overall onboarding progress
 */
export interface OnboardingProgress {
  /** User ID */
  userId: string
  /** Current user role */
  role: UserRole
  /** Progress on individual items */
  items: Record<string, ChecklistItemProgress>
  /** Milestone achievements */
  milestones: MilestoneAchievement[]
  /** Whether onboarding is fully completed */
  isCompleted: boolean
  /** Timestamp when onboarding was completed */
  completedAt?: string
  /** Whether user dismissed/skipped onboarding */
  isDismissed: boolean
  /** Timestamp when dismissed */
  dismissedAt?: string
  /** Last updated timestamp */
  updatedAt: string
  /** Created timestamp */
  createdAt: string
}

/**
 * Milestone achievement record
 */
export interface MilestoneAchievement {
  /** Milestone percentage (e.g., 25, 50, 75, 100) */
  percentage: number
  /** Timestamp when achieved */
  achievedAt: string
  /** Whether celebration was shown */
  celebrationShown: boolean
}

/**
 * Celebration configuration for milestones
 */
export interface MilestoneCelebration {
  /** Milestone percentage */
  percentage: number
  /** Translation key for title */
  titleKey: string
  /** Translation key for message */
  messageKey: string
  /** Animation type to show */
  animationType: 'confetti' | 'sparkle' | 'fireworks' | 'checkmark'
  /** Duration of celebration (in ms) */
  duration: number
  /** Optional badge/icon to show */
  badgeIcon?: string
}

/**
 * Onboarding state for context/provider
 */
export interface OnboardingState {
  /** User's progress data */
  progress: OnboardingProgress | null
  /** Current role's checklist definition */
  checklist: RoleChecklist | null
  /** Whether data is loading */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Active celebration (shown on milestone) */
  activeCelebration: MilestoneCelebration | null
}

/**
 * Onboarding context actions
 */
export interface OnboardingActions {
  /** Mark an item as completed */
  completeItem: (itemId: string) => Promise<void>
  /** Skip an item */
  skipItem: (itemId: string) => Promise<void>
  /** Reset progress (start over) */
  resetProgress: () => Promise<void>
  /** Dismiss onboarding entirely */
  dismissOnboarding: () => Promise<void>
  /** Show onboarding again after dismissal */
  resumeOnboarding: () => Promise<void>
  /** Mark celebration as shown */
  markCelebrationShown: (percentage: number) => Promise<void>
  /** Trigger celebration manually (for testing) */
  triggerCelebration: (celebration: MilestoneCelebration) => void
  /** Clear active celebration */
  clearCelebration: () => void
  /** Refresh progress from server */
  refreshProgress: () => Promise<void>
  /** Check if item is completed */
  isItemCompleted: (itemId: string) => boolean
  /** Get completion percentage */
  getCompletionPercentage: () => number
  /** Get next uncompleted item */
  getNextItem: () => OnboardingChecklistItem | null
}

/**
 * Combined onboarding context value
 */
export interface OnboardingContextValue extends OnboardingState, OnboardingActions {}

/**
 * Props for OnboardingChecklist component
 */
export interface OnboardingChecklistProps {
  /** Variant of the checklist display */
  variant?: 'full' | 'compact' | 'inline' | 'card'
  /** Whether to show progress bar */
  showProgress?: boolean
  /** Whether to show estimated time */
  showEstimatedTime?: boolean
  /** Whether to show skip option */
  allowSkip?: boolean
  /** Whether to show dismiss option */
  allowDismiss?: boolean
  /** Maximum items to show (compact/inline only) */
  maxItems?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when item is clicked */
  onItemClick?: (item: OnboardingChecklistItem) => void
  /** Callback when onboarding is dismissed */
  onDismiss?: () => void
  /** Callback when onboarding is completed */
  onComplete?: () => void
}

/**
 * Props for MilestonesCelebration component
 */
export interface MilestonesCelebrationProps {
  /** Active celebration data */
  celebration: MilestoneCelebration
  /** Callback when celebration ends */
  onComplete?: () => void
  /** Whether to auto-dismiss after duration */
  autoDismiss?: boolean
}

/**
 * Props for empty state with onboarding integration
 */
export interface OnboardingEmptyStateProps {
  /** Entity type for context-specific messaging */
  entityType: OnboardingEntityType
  /** Whether to show onboarding checklist */
  showChecklist?: boolean
  /** Checklist variant */
  checklistVariant?: 'compact' | 'inline'
  /** Callback to create new item */
  onCreate?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Database table structure for user_onboarding_progress
 */
export interface UserOnboardingProgressRow {
  id: string
  user_id: string
  role: UserRole
  items_progress: Record<string, ChecklistItemProgress>
  milestones_achieved: MilestoneAchievement[]
  is_completed: boolean
  completed_at: string | null
  is_dismissed: boolean
  dismissed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * API request for updating progress
 */
export interface UpdateProgressRequest {
  itemId: string
  action: 'complete' | 'skip' | 'uncomplete'
}

/**
 * API response for onboarding endpoints
 */
export interface OnboardingResponse {
  success: boolean
  data?: OnboardingProgress
  error?: string
}
