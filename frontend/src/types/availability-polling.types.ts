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
 * Batch submit votes request (multiple slots at once)
 */
export interface BatchSubmitVotesRequest {
  poll_id: string
  votes: SubmitVoteRequest[]
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
 * Close poll request
 */
export interface ClosePollRequest {
  selected_slot_id?: string
}

/**
 * Auto-schedule request
 */
export interface AutoScheduleRequest {
  poll_id: string
  slot_id?: string // If not provided, uses best slot
  event_type?: string
  additional_participants?: CreatePollParticipantRequest[]
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

/**
 * Slot with user's response for UI
 */
export interface SlotWithResponse extends PollSlot {
  my_response?: PollResponseType
  my_notes?: string
  response_summary: {
    available: number
    unavailable: number
    maybe: number
    total: number
    percentage: number
  }
  is_best: boolean
  is_selected: boolean
}

/**
 * Participant with response status for UI
 */
export interface ParticipantWithStatus extends PollParticipant {
  response_count: number
  total_slots: number
  has_completed: boolean
}

/**
 * Vote matrix cell for grid display
 */
export interface VoteMatrixCell {
  slot_id: string
  participant_id: string
  response?: PollResponseType
  notes?: string
}

/**
 * Vote matrix row (participant)
 */
export interface VoteMatrixRow {
  participant: PollParticipant
  votes: Map<string, PollResponseType | undefined>
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Response type colors for UI */
export const RESPONSE_COLORS: Record<
  PollResponseType,
  { bg: string; text: string; border: string }
> = {
  available: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  unavailable: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  maybe: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
}

/** Poll status colors for UI */
export const POLL_STATUS_COLORS: Record<PollStatus, { bg: string; text: string; border: string }> =
  {
    draft: {
      bg: 'bg-gray-100 dark:bg-gray-800/30',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
    },
    active: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    closed: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    scheduled: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
    },
    cancelled: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
    },
  }

/** Voting rule icons */
export const VOTING_RULE_ICONS: Record<VotingRule, string> = {
  simple_majority: 'Vote',
  consensus: 'Users',
  unanimous: 'CheckCircle2',
  organizer_decides: 'UserCog',
}

/** Response type icons */
export const RESPONSE_TYPE_ICONS: Record<PollResponseType, string> = {
  available: 'Check',
  unavailable: 'X',
  maybe: 'HelpCircle',
}

/** Default meeting durations (in minutes) */
export const DEFAULT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]

/** Default timezone */
export const DEFAULT_TIMEZONE = 'Asia/Riyadh'
