/**
 * Calendar Conflict Types
 * Feature: event-conflict-resolution
 *
 * Type definitions for calendar conflict detection and resolution
 */

// Conflict type categories
export type ConflictType =
  | 'venue'
  | 'participant'
  | 'organizer'
  | 'holiday'
  | 'resource'
  | 'travel_time'

// Conflict severity levels
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'

// Conflict resolution status
export type ConflictResolutionStatus =
  | 'pending'
  | 'auto_resolved'
  | 'manually_resolved'
  | 'ignored'
  | 'escalated'

// What-if scenario status
export type ScenarioStatus = 'draft' | 'analyzing' | 'ready' | 'applied' | 'discarded'

/**
 * Conflict check request parameters
 */
export interface ConflictCheckRequest {
  event_id?: string
  start_datetime: string
  end_datetime: string
  venue_en?: string
  venue_ar?: string
  participant_ids?: string[]
  check_travel_time?: boolean
}

/**
 * Individual conflict details
 */
export interface EventConflict {
  id?: string
  conflict_type: ConflictType
  severity: ConflictSeverity
  conflicting_event_id?: string
  conflicting_event?: {
    id: string
    title_en?: string
    title_ar?: string
    start_datetime: string
    end_datetime: string
  }
  overlap_start?: string
  overlap_end?: string
  overlap_minutes?: number
  message_en: string
  message_ar?: string
  affected_participant_ids?: string[]
  affected_resources?: string[]
  resolution_status?: ConflictResolutionStatus
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  ai_suggestion?: AISuggestion
  ai_confidence_score?: number
  created_at?: string
}

/**
 * Conflict check response
 */
export interface ConflictCheckResponse {
  has_conflicts: boolean
  conflicts: EventConflict[]
  warnings: string[]
  severity_summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  total_conflicts: number
}

/**
 * AI-generated suggestion
 */
export interface AISuggestion {
  action: 'reschedule' | 'move_venue' | 'reduce_duration' | 'split_event'
  confidence: number
  reason_en: string
  reason_ar?: string
}

/**
 * Rescheduling suggestion
 */
export interface ReschedulingSuggestion {
  id: string
  conflict_id: string
  event_id: string
  suggested_start: string
  suggested_end: string
  availability_score: number
  priority_score: number
  travel_feasibility_score: number
  overall_score: number
  reason_en?: string
  reason_ar?: string
  participant_availability?: Record<string, boolean>
  alternative_venue_en?: string
  alternative_venue_ar?: string
  is_accepted: boolean
  accepted_by?: string
  accepted_at?: string
  created_at: string
}

/**
 * Request to generate rescheduling suggestions
 */
export interface ReschedulingSuggestionRequest {
  event_id: string
  conflict_id?: string
  preferred_dates?: string[]
  preferred_hours?: number[]
  duration_minutes?: number
  must_include_participants?: string[]
}

/**
 * Response from suggestion generation
 */
export interface ReschedulingSuggestionResponse {
  event_id: string
  suggestions: Omit<
    ReschedulingSuggestion,
    'id' | 'conflict_id' | 'event_id' | 'is_accepted' | 'created_at'
  >[]
  search_range: {
    start: string
    end: string
  }
  duration_minutes: number
}

/**
 * What-if scenario proposed change
 */
export interface ProposedChange {
  event_id: string
  new_start?: string
  new_end?: string
  new_venue_en?: string
  new_venue_ar?: string
  original_start?: string
  original_end?: string
}

/**
 * What-if scenario
 */
export interface WhatIfScenario {
  id: string
  created_by: string
  name_en: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  affected_event_ids: string[]
  proposed_changes: ProposedChange[]
  status: ScenarioStatus
  conflicts_before: number
  conflicts_after: number
  impact_summary: {
    events_affected: number
    conflicts_reduced: number
    recommendation: 'positive' | 'negative' | 'neutral'
  }
  ai_analysis?: Record<string, unknown>
  ai_recommendation_en?: string
  ai_recommendation_ar?: string
  analyzed_at?: string
  applied_at?: string
  created_at: string
  updated_at: string
}

/**
 * Request to create a what-if scenario
 */
export interface CreateScenarioRequest {
  name_en: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  proposed_changes: ProposedChange[]
}

/**
 * Bulk reschedule request
 */
export interface BulkRescheduleRequest {
  event_ids: string[]
  target_date_range: {
    start: string
    end: string
  }
  constraints?: {
    avoid_weekends?: boolean
    preferred_hours?: number[]
    maintain_relative_order?: boolean
  }
}

/**
 * Bulk reschedule response
 */
export interface BulkRescheduleResponse {
  scenario_id?: string
  proposed_changes: ProposedChange[]
  events_count: number
}

/**
 * Conflict resolution request
 */
export interface ResolveConflictRequest {
  conflict_id: string
  resolution_status?: ConflictResolutionStatus
  resolution_notes?: string
  accepted_suggestion_id?: string
}

/**
 * Participant availability
 */
export interface ParticipantAvailability {
  id: string
  participant_id: string
  participant_type: 'user' | 'person_dossier' | 'external_contact'
  available_from: string
  available_to: string
  availability_status: 'available' | 'busy' | 'tentative' | 'out_of_office'
  location_en?: string
  location_ar?: string
  timezone: string
  source: 'manual' | 'calendar_sync' | 'ai_inferred'
  confidence: number
}

/**
 * Venue/resource information
 */
export interface VenueResource {
  id: string
  name_en: string
  name_ar?: string
  resource_type: 'room' | 'equipment' | 'service' | 'venue'
  capacity?: number
  features?: Record<string, unknown>
  building_en?: string
  building_ar?: string
  floor?: string
  is_active: boolean
  booking_lead_time_hours: number
}

/**
 * Travel logistics between locations
 */
export interface TravelLogistics {
  id: string
  from_location: string
  to_location: string
  estimated_travel_minutes: number
  travel_mode: 'walking' | 'driving' | 'public_transit' | 'flight'
  recommended_buffer_minutes: number
  last_updated: string
  data_source: string
}

/**
 * Conflict list query filters
 */
export interface ConflictListFilters {
  event_id?: string
  status?: ConflictResolutionStatus
  severity?: ConflictSeverity
  page?: number
  page_size?: number
}

/**
 * Paginated conflicts response
 */
export interface ConflictsListResponse {
  conflicts: EventConflict[]
  total_count: number
  page: number
  page_size: number
}

/**
 * Severity badge color mapping
 */
export const SEVERITY_COLORS: Record<
  ConflictSeverity,
  { bg: string; text: string; border: string }
> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  low: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
}

/**
 * Conflict type icons mapping
 */
export const CONFLICT_TYPE_ICONS: Record<ConflictType, string> = {
  venue: 'Building2',
  participant: 'Users',
  organizer: 'UserCog',
  holiday: 'Calendar',
  resource: 'Package',
  travel_time: 'Clock',
}
