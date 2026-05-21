/**
 * Availability Polling Types
 * Feature: participant-availability-polling
 *
 * Type definitions for Doodle-style availability polling
 */

// =============================================================================
// ENUMS
// =============================================================================

/** Poll status */
export type PollStatus = 'draft' | 'active' | 'closed' | 'scheduled' | 'cancelled'

/** Voting rule for determining the best slot */
export type VotingRule = 'simple_majority' | 'consensus' | 'unanimous' | 'organizer_decides'

/** Individual response type */
export type PollResponseType = 'available' | 'unavailable' | 'maybe'

/** Participant type (polymorphic) */
export type PollParticipantType = 'user' | 'external_contact' | 'person_dossier'

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Availability Poll - main entity
 */
export interface AvailabilityPoll {
  id: string
  created_by: string
  dossier_id?: string

  // Meeting info (bilingual)
  meeting_title_en: string
  meeting_title_ar?: string
  description_en?: string
  description_ar?: string

  // Poll settings
  deadline: string
  status: PollStatus
  min_participants_required: number
  voting_rule: VotingRule

  // Duration
  meeting_duration_minutes: number

  // Location (bilingual)
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  virtual_link?: string

  // Result tracking
  selected_slot_id?: string
  scheduled_event_id?: string

  // Internal notes
  organizer_notes?: string

  // Metadata
  created_at: string
  updated_at: string

  // Related data (optional, depending on query)
  slots?: PollSlot[]
  participants?: PollParticipant[]
  creator?: {
    id: string
    email: string
    full_name?: string
  }
}

/**
 * Poll Time Slot
 */
export interface PollSlot {
  id: string
  poll_id: string

  // Time range
  slot_start: string
  slot_end: string
  timezone: string

  // Venue (bilingual)
  venue_suggestion_en?: string
  venue_suggestion_ar?: string

  // Organizer preference (0-1)
  organizer_preference_score: number

  // Display order
  position: number

  // Response counts (computed by trigger)
  available_count: number
  unavailable_count: number
  maybe_count: number

  // Metadata
  created_at: string

  // Related data
  responses?: PollResponse[]
}

/**
 * Poll Participant (invited to vote)
 */
export interface PollParticipant {
  id: string
  poll_id: string

  // Polymorphic reference
  participant_type: PollParticipantType
  participant_id: string

  // Display info
  display_name_en?: string
  display_name_ar?: string
  email?: string

  // Invitation tracking
  is_required: boolean
  invited_at: string
  reminder_sent_at?: string

  // Metadata
  created_at: string

  // Related data
  user?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  has_responded?: boolean
}

/**
 * Poll Response (vote)
 */
export interface PollResponse {
  id: string
  poll_id: string
  slot_id: string

  // Voter
  participant_id?: string
  respondent_user_id?: string

  // Response
  response: PollResponseType
  notes?: string

  // Metadata
  submitted_at: string
  updated_at: string

  // Related data
  participant?: PollParticipant
  respondent?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Create poll request
 */
export interface CreatePollRequest {
  meeting_title_en: string
  meeting_title_ar?: string
  description_en?: string
  description_ar?: string
  deadline: string
  voting_rule?: VotingRule
  min_participants_required?: number
  meeting_duration_minutes?: number
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  virtual_link?: string
  organizer_notes?: string
  dossier_id?: string

  // Initial slots
  slots?: CreatePollSlotRequest[]

  // Initial participants
  participants?: CreatePollParticipantRequest[]
}

/**
 * Create slot request
 */
export interface CreatePollSlotRequest {
  slot_start: string
  slot_end: string
  timezone?: string
  venue_suggestion_en?: string
  venue_suggestion_ar?: string
  organizer_preference_score?: number
  position?: number
}

/**
 * Create participant request
 */
export interface CreatePollParticipantRequest {
  participant_type: PollParticipantType
  participant_id: string
  display_name_en?: string
  display_name_ar?: string
  email?: string
  is_required?: boolean
}

/**
 * Update poll request
 */
export interface UpdatePollRequest {
  meeting_title_en?: string
  meeting_title_ar?: string
  description_en?: string
  description_ar?: string
  deadline?: string
  voting_rule?: VotingRule
  min_participants_required?: number
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  virtual_link?: string
  organizer_notes?: string
}

/**
 * Submit vote request
 */
export interface SubmitVoteRequest {
  slot_id: string
  response: PollResponseType
  notes?: string
}

/**
 * Poll list filters
 */
export interface PollListFilters {
  status?: PollStatus
  created_by?: string
  dossier_id?: string
  participant_id?: string
  deadline_before?: string
  deadline_after?: string
  page?: number
  page_size?: number
}

/**
 * Poll list response
 */
export interface PollListResponse {
  polls: AvailabilityPoll[]
  total_count: number
  page: number
  page_size: number
}

/**
 * Poll details response
 */
export interface PollDetailsResponse {
  poll: AvailabilityPoll
  slots: PollSlot[]
  participants: PollParticipant[]
  my_responses: PollResponse[]
  completion_status: PollCompletionStatus
  optimal_slots: OptimalSlot[]
}

/**
 * Poll completion status
 */
export interface PollCompletionStatus {
  can_close: boolean
  total_participants: number
  responded_participants: number
  required_participants: number
  response_rate: number
}

/**
 * Optimal slot (result of get_optimal_poll_slots function)
 */
export interface OptimalSlot {
  slot_id: string
  slot_start: string
  slot_end: string
  venue_suggestion_en?: string
  venue_suggestion_ar?: string
  available_count: number
  unavailable_count: number
  maybe_count: number
  organizer_preference_score: number
  total_score: number
  rank: number
}

/**
 * Auto-schedule response
 */
export interface AutoScheduleResponse {
  success: boolean
  event_id: string
  event: {
    id: string
    title_en: string
    title_ar?: string
    start_datetime: string
    end_datetime: string
    location_en?: string
    location_ar?: string
  }
}

// =============================================================================
// UI HELPER TYPES
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

// D-58-06-A-06: RESPONSE palette → success / destructive / warning. No D-07.
export const RESPONSE_COLORS: Record<
  PollResponseType,
  { bg: string; text: string; border: string }
> = {
  available: {
    bg: 'bg-success/10 dark:bg-success/30',
    text: 'text-success',
    border: 'border-success/20 dark:border-success/80',
  },
  unavailable: {
    bg: 'bg-destructive/10 dark:bg-destructive/30',
    text: 'text-destructive',
    border: 'border-destructive/20 dark:border-destructive/80',
  },
  maybe: {
    bg: 'bg-warning/10 dark:bg-warning/30',
    text: 'text-warning',
    border: 'border-warning/20 dark:border-warning/80',
  },
}

// D-58-06-A-06: POLL_STATUS palette — D-07 collision (blue + purple):
//   active=accent (blue), closed=secondary (purple).
export const POLL_STATUS_COLORS: Record<PollStatus, { bg: string; text: string; border: string }> =
  {
    draft: {
      bg: 'bg-muted/10 dark:bg-muted/30',
      text: 'text-muted-foreground',
      border: 'border-muted/20 dark:border-muted/70',
    },
    active: {
      bg: 'bg-accent/10 dark:bg-accent/30',
      text: 'text-accent',
      border: 'border-accent/20 dark:border-accent/80',
    },
    closed: {
      bg: 'bg-secondary/10 dark:bg-secondary/30',
      text: 'text-secondary-foreground',
      border: 'border-secondary/20 dark:border-secondary/80',
    },
    scheduled: {
      bg: 'bg-success/10 dark:bg-success/30',
      text: 'text-success',
      border: 'border-success/20 dark:border-success/80',
    },
    cancelled: {
      bg: 'bg-destructive/10 dark:bg-destructive/30',
      text: 'text-destructive',
      border: 'border-destructive/20 dark:border-destructive/80',
    },
  }

/** Default meeting durations (in minutes) */
export const DEFAULT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]

/** Default timezone */
export const DEFAULT_TIMEZONE = 'Asia/Riyadh'
