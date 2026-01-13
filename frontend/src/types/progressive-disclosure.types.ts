/**
 * Progressive Disclosure Type Definitions
 *
 * Type system for progressive hint disclosure that adapts to user
 * experience level and tracks interactions to avoid repetition.
 */

/**
 * Hint interaction status
 */
export type HintInteractionStatus = 'shown' | 'dismissed' | 'expanded' | 'action_taken'

/**
 * Context types for hints
 */
export type HintContextType =
  | 'empty_state'
  | 'first_interaction'
  | 'feature_discovery'
  | 'keyboard_shortcut'
  | 'advanced_feature'
  | 'form_field'
  | 'navigation'

/**
 * User experience level
 */
export type UserExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/**
 * Hint definition for progressive disclosure
 */
export interface HintDefinition {
  /** Unique identifier for the hint */
  id: string
  /** Context type for the hint */
  contextType: HintContextType
  /** Page context (e.g., 'dossiers', 'engagements') */
  pageContext?: string
  /** Minimum experience level required to show this hint */
  minExperienceLevel?: UserExperienceLevel
  /** Maximum experience level (don't show to more experienced users) */
  maxExperienceLevel?: UserExperienceLevel
  /** Translation key for the hint title */
  titleKey: string
  /** Translation key for the hint content */
  contentKey: string
  /** Translation key for expanded content (shown on hover/click) */
  expandedContentKey?: string
  /** Associated action (for action_taken tracking) */
  actionKey?: string
  /** Keyboard shortcut (for keyboard_shortcut context) */
  shortcut?: string
  /** Icon name from Lucide */
  iconName?: string
  /** Priority for display order (higher = show first) */
  priority?: number
  /** Number of days before re-showing after dismissal */
  reshowIntervalDays?: number
  /** Whether to auto-dismiss after a timeout */
  autoDismissMs?: number
}

/**
 * User's interaction with a hint
 */
export interface HintInteraction {
  /** Hint ID */
  hintId: string
  /** Context type */
  hintContext: HintContextType
  /** Page context */
  pageContext?: string
  /** Current status */
  status: HintInteractionStatus
  /** Number of times shown */
  shownCount: number
  /** Number of times expanded */
  expandedCount: number
  /** First shown timestamp */
  firstShownAt: string
  /** Last shown timestamp */
  lastShownAt: string
  /** Dismissed timestamp */
  dismissedAt?: string
  /** Expanded timestamp */
  expandedAt?: string
  /** Action taken timestamp */
  actionTakenAt?: string
  /** When to re-show after dismissal */
  shouldReshowAfter?: string
  /** Re-show interval in days */
  reshowIntervalDays: number
}

/**
 * User's progressive disclosure preferences
 */
export interface DisclosurePreferences {
  /** User ID */
  userId: string
  /** Experience level */
  experienceLevel: UserExperienceLevel
  /** Whether experience level is auto-calculated */
  experienceLevelAutoCalculated: boolean
  /** Global hints enabled */
  hintsEnabled: boolean
  /** Show keyboard shortcuts */
  showKeyboardShortcuts: boolean
  /** Show advanced features */
  showAdvancedFeatures: boolean
  /** Hint delay in milliseconds */
  hintDelayMs: number
  /** Auto-dismiss timeout in seconds */
  autoDismissSeconds?: number
  /** Max hints per session */
  maxHintsPerSession: number
  /** Cooldown between hints in minutes */
  hintCooldownMinutes: number
  /** Total visits */
  totalVisits: number
  /** Total interactions */
  totalInteractions: number
  /** First visit timestamp */
  firstVisitAt: string
  /** Last visit timestamp */
  lastVisitAt: string
  /** Interactions needed for intermediate level */
  intermediateUnlockInteractions: number
  /** Interactions needed for advanced level */
  advancedUnlockInteractions: number
  /** Interactions needed for expert level */
  expertUnlockInteractions: number
}

/**
 * Session hint tracking
 */
export interface SessionHintTracking {
  /** Session ID */
  sessionId: string
  /** Hints shown this session */
  hintsShown: number
  /** Hints dismissed this session */
  hintsDismissed: number
  /** Hints expanded this session */
  hintsExpanded: number
  /** Session start timestamp */
  sessionStartedAt: string
  /** Last hint shown timestamp */
  lastHintAt?: string
}

/**
 * Progressive disclosure state
 */
export interface ProgressiveDisclosureState {
  /** User's preferences */
  preferences: DisclosurePreferences | null
  /** Hint interactions map (hintId -> interaction) */
  interactions: Record<string, HintInteraction>
  /** Current session tracking */
  session: SessionHintTracking | null
  /** Whether data is loading */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Session ID */
  sessionId: string
}

/**
 * Result from shouldShowHint check
 */
export interface ShouldShowHintResult {
  /** Whether to show the hint */
  shouldShow: boolean
  /** Reason for the decision */
  reason:
    | 'show_new'
    | 'show_reshow'
    | 'hidden_dismissed'
    | 'hidden_action_taken'
    | 'hidden_disabled'
    | 'hidden_experience_level'
    | 'hidden_session_limit'
    | 'hidden_cooldown'
  /** Previous interaction if exists */
  interaction?: HintInteraction
}

/**
 * Hint tier for progressive levels
 */
export interface HintTier {
  /** Tier level */
  level: 'basic' | 'intermediate' | 'advanced'
  /** Hints in this tier */
  hints: HintDefinition[]
  /** Unlock condition */
  unlockCondition: 'initial' | 'first_interaction' | 'subsequent_visit'
}

/**
 * Progressive hint set for a page/feature
 */
export interface ProgressiveHintSet {
  /** Page/feature identifier */
  id: string
  /** Translation key for the feature name */
  featureKey: string
  /** Tiers of hints */
  tiers: HintTier[]
}

/**
 * Props for ProgressiveHint component
 */
export interface ProgressiveHintProps {
  /** Hint definition or hint ID */
  hint: HintDefinition | string
  /** Variant of the hint display */
  variant?: 'tooltip' | 'inline' | 'expandable' | 'card'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Position for tooltip variant */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Show dismiss button */
  showDismiss?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Callback when expanded */
  onExpand?: () => void
  /** Callback when action is taken */
  onAction?: () => void
  /** Children to wrap (for tooltip variant) */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Override delay (ms) */
  delayMs?: number
}

/**
 * Props for ProgressiveEmptyState component
 */
export interface ProgressiveEmptyStateProps {
  /** Page context for hints */
  pageContext: string
  /** Entity type for context-specific messaging */
  entityType?: string
  /** Main title */
  title: string
  /** Description */
  description: string
  /** Icon from Lucide */
  icon: React.ComponentType<{ className?: string }>
  /** Primary action */
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
  }
  /** Progressive hints to show */
  hints?: ProgressiveHintSet
  /** Variant */
  variant?: 'default' | 'card' | 'compact'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * Database row for user_hint_interactions
 */
export interface UserHintInteractionRow {
  id: string
  user_id: string
  hint_id: string
  hint_context: HintContextType
  page_context: string | null
  status: HintInteractionStatus
  shown_count: number
  expanded_count: number
  first_shown_at: string
  last_shown_at: string
  dismissed_at: string | null
  expanded_at: string | null
  action_taken_at: string | null
  should_reshow_after: string | null
  reshow_interval_days: number
  created_at: string
  updated_at: string
}

/**
 * Database row for user_disclosure_preferences
 */
export interface UserDisclosurePreferencesRow {
  id: string
  user_id: string
  experience_level: UserExperienceLevel
  experience_level_auto_calculated: boolean
  hints_enabled: boolean
  show_keyboard_shortcuts: boolean
  show_advanced_features: boolean
  hint_delay_ms: number
  auto_dismiss_seconds: number | null
  max_hints_per_session: number
  hint_cooldown_minutes: number
  total_visits: number
  total_interactions: number
  first_visit_at: string
  last_visit_at: string
  intermediate_unlock_interactions: number
  advanced_unlock_interactions: number
  expert_unlock_interactions: number
  created_at: string
  updated_at: string
}

/**
 * API request for recording hint interaction
 */
export interface RecordHintInteractionRequest {
  hintId: string
  hintContext: HintContextType
  pageContext?: string
  status: HintInteractionStatus
}

/**
 * API response for hint interaction
 */
export interface HintInteractionResponse {
  success: boolean
  data?: HintInteraction
  error?: string
}

/**
 * API response for disclosure preferences
 */
export interface DisclosurePreferencesResponse {
  success: boolean
  data?: {
    preferences: DisclosurePreferences
    interactions: HintInteraction[]
    session: SessionHintTracking
  }
  error?: string
}
