/**
 * Contextual Suggestion Types
 * Feature: intelligent-empty-states
 *
 * Types for displaying contextually relevant suggestions in empty states
 * based on current date, upcoming events, and organizational calendar.
 */

// ============================================================================
// Suggestion Category Types
// ============================================================================

/**
 * Categories of contextual suggestions
 */
export type SuggestionCategory =
  | 'upcoming_event' // Upcoming events requiring preparation
  | 'expiring_mou' // MOUs approaching expiration
  | 'overdue_commitment' // Commitments past deadline
  | 'pending_task' // Tasks requiring attention
  | 'seasonal' // Time-based seasonal suggestions
  | 'anniversary' // Important date anniversaries
  | 'quick_action' // Quick actions to get started

/**
 * Priority level for suggestions
 */
export type SuggestionPriority = 'high' | 'medium' | 'low'

/**
 * Context type where suggestion applies
 */
export type SuggestionContext =
  | 'dashboard'
  | 'calendar'
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'document'
  | 'global'

// ============================================================================
// Suggestion Interfaces
// ============================================================================

/**
 * Base contextual suggestion
 */
export interface ContextualSuggestion {
  id: string
  category: SuggestionCategory
  priority: SuggestionPriority
  context: SuggestionContext[]

  // Display text
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string

  // Action configuration
  action_label_en: string
  action_label_ar: string
  action_route?: string
  action_params?: Record<string, string>

  // Time relevance
  relevant_until?: string // ISO date
  days_until_event?: number

  // Related entity
  related_entity_type?: 'engagement' | 'mou' | 'commitment' | 'dossier' | 'forum'
  related_entity_id?: string
  related_entity_name_en?: string
  related_entity_name_ar?: string

  // Visual
  icon?: string
  badge_text_en?: string
  badge_text_ar?: string
  badge_variant?: 'default' | 'warning' | 'danger' | 'success'
}

/**
 * Upcoming event suggestion
 */
export interface UpcomingEventSuggestion extends ContextualSuggestion {
  category: 'upcoming_event'
  event_date: string
  event_type: string
  location_en?: string
  location_ar?: string
}

/**
 * Expiring MOU suggestion
 */
export interface ExpiringMouSuggestion extends ContextualSuggestion {
  category: 'expiring_mou'
  expiration_date: string
  mou_id: string
  counterparty_en: string
  counterparty_ar: string
}

/**
 * Overdue commitment suggestion
 */
export interface OverdueCommitmentSuggestion extends ContextualSuggestion {
  category: 'overdue_commitment'
  deadline: string
  days_overdue: number
  commitment_id: string
}

/**
 * Seasonal suggestion (UN General Assembly, annual reviews, etc.)
 */
export interface SeasonalSuggestion extends ContextualSuggestion {
  category: 'seasonal'
  season_type:
    | 'un_general_assembly'
    | 'annual_review'
    | 'budget_cycle'
    | 'quarterly_report'
    | 'custom'
  season_start: string
  season_end: string
}

/**
 * Anniversary suggestion (bilateral relations, MOU signings, etc.)
 */
export interface AnniversarySuggestion extends ContextualSuggestion {
  category: 'anniversary'
  anniversary_date: string
  years_since: number
  anniversary_type: 'bilateral_relations' | 'mou_signing' | 'organization_membership' | 'custom'
}

/**
 * Quick action suggestion for getting started
 */
export interface QuickActionSuggestion extends ContextualSuggestion {
  category: 'quick_action'
  action_type:
    | 'create_dossier'
    | 'add_engagement'
    | 'upload_document'
    | 'add_contact'
    | 'review_commitments'
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Request params for contextual suggestions API
 */
export interface ContextualSuggestionsParams {
  /** Page context for filtering suggestions */
  context?: SuggestionContext
  /** Entity type if within a specific entity page */
  entity_type?: string
  /** Entity ID if within a specific entity page */
  entity_id?: string
  /** Maximum number of suggestions to return */
  limit?: number
  /** Include low priority suggestions */
  include_low_priority?: boolean
  /** Custom reference date (defaults to today) */
  reference_date?: string
}

/**
 * Response from contextual suggestions API
 */
export interface ContextualSuggestionsResponse {
  suggestions: ContextualSuggestion[]
  metadata: {
    generated_at: string
    reference_date: string
    total_available: number
    context: SuggestionContext
    upcoming_events_count: number
    expiring_mous_count: number
    overdue_commitments_count: number
  }
}

// ============================================================================
// Calendar Events for Suggestions
// ============================================================================

/**
 * Known organizational calendar events used for seasonal suggestions
 */
export const ORGANIZATIONAL_CALENDAR_EVENTS = {
  UN_GENERAL_ASSEMBLY: {
    name_en: 'UN General Assembly',
    name_ar: 'الجمعية العامة للأمم المتحدة',
    month: 9, // September
    preparation_days: 30,
  },
  G20_SUMMIT: {
    name_en: 'G20 Summit',
    name_ar: 'قمة مجموعة العشرين',
    month: 11, // November (varies)
    preparation_days: 45,
  },
  ANNUAL_BILATERAL_REVIEW: {
    name_en: 'Annual Bilateral Review',
    name_ar: 'المراجعة الثنائية السنوية',
    month: 1, // January
    preparation_days: 30,
  },
  QUARTERLY_COMMITMENT_REVIEW: {
    name_en: 'Quarterly Commitment Review',
    name_ar: 'مراجعة الالتزامات الفصلية',
    months: [3, 6, 9, 12], // End of quarters
    preparation_days: 14,
  },
  BUDGET_PLANNING_CYCLE: {
    name_en: 'Budget Planning Cycle',
    name_ar: 'دورة تخطيط الميزانية',
    month: 10, // October
    preparation_days: 60,
  },
} as const

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Union type of all suggestion types
 */
export type AnySuggestion =
  | UpcomingEventSuggestion
  | ExpiringMouSuggestion
  | OverdueCommitmentSuggestion
  | SeasonalSuggestion
  | AnniversarySuggestion
  | QuickActionSuggestion

/**
 * Type guard for upcoming event suggestion
 */
export function isUpcomingEventSuggestion(
  suggestion: ContextualSuggestion,
): suggestion is UpcomingEventSuggestion {
  return suggestion.category === 'upcoming_event'
}

/**
 * Type guard for expiring MOU suggestion
 */
export function isExpiringMouSuggestion(
  suggestion: ContextualSuggestion,
): suggestion is ExpiringMouSuggestion {
  return suggestion.category === 'expiring_mou'
}

/**
 * Type guard for overdue commitment suggestion
 */
export function isOverdueCommitmentSuggestion(
  suggestion: ContextualSuggestion,
): suggestion is OverdueCommitmentSuggestion {
  return suggestion.category === 'overdue_commitment'
}

/**
 * Type guard for seasonal suggestion
 */
export function isSeasonalSuggestion(
  suggestion: ContextualSuggestion,
): suggestion is SeasonalSuggestion {
  return suggestion.category === 'seasonal'
}

/**
 * Type guard for anniversary suggestion
 */
export function isAnniversarySuggestion(
  suggestion: ContextualSuggestion,
): suggestion is AnniversarySuggestion {
  return suggestion.category === 'anniversary'
}

/**
 * Type guard for quick action suggestion
 */
export function isQuickActionSuggestion(
  suggestion: ContextualSuggestion,
): suggestion is QuickActionSuggestion {
  return suggestion.category === 'quick_action'
}
