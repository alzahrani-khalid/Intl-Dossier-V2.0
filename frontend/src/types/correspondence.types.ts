// Correspondence types for multi-party correspondence tracking
// These types support the correspondence participants and direction features

// ============================================================================
// Direction and Action Category Enums
// ============================================================================

export type CorrespondenceDirection = 'inbound' | 'outbound' | 'internal'

export type ActionCategory =
  | 'information'
  | 'action_required'
  | 'response_required'
  | 'approval_required'
  | 'deadline_response'
  | 'nomination'
  | 'event_booking'
  | 'internal_coordination'

export type DeadlineType = 'internal' | 'external' | 'both'

export type ParticipantType =
  | 'sender'
  | 'recipient'
  | 'cc'
  | 'bcc'
  | 'relay'
  | 'router'
  | 'action_owner'
  | 'stakeholder'
  | 'originator'

export type ParticipantEntityType = 'organization' | 'person' | 'department' | 'country'

// ============================================================================
// External Reference Types
// ============================================================================

export interface ExternalReference {
  type: 'telegram' | 'memo' | 'letter' | 'note_verbale' | 'circular' | 'other'
  number?: string
  date_hijri?: string
  date_gregorian?: string
  source?: string
  reference?: string
  title?: string
}

// ============================================================================
// Correspondence Participant Types
// ============================================================================

export interface CorrespondenceParticipant {
  id: string
  correspondence_id: string
  participant_type: ParticipantType
  entity_type: ParticipantEntityType
  entity_id: string
  role_en?: string | null
  role_ar?: string | null
  sequence_order: number
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export interface CorrespondenceParticipantWithEntity extends CorrespondenceParticipant {
  entity_name_en?: string
  entity_name_ar?: string
}

export interface CreateParticipantRequest {
  correspondence_id: string
  participant_type: ParticipantType
  entity_type: ParticipantEntityType
  entity_id: string
  role_en?: string
  role_ar?: string
  sequence_order?: number
  notes?: string
}

export interface UpdateParticipantRequest {
  participant_type?: ParticipantType
  role_en?: string
  role_ar?: string
  sequence_order?: number
  notes?: string
}

// ============================================================================
// Correspondence Chain Types
// ============================================================================

export interface CorrespondenceChainItem {
  participant_id: string
  participant_type: ParticipantType
  entity_type: ParticipantEntityType
  entity_id: string
  entity_name_en?: string
  entity_name_ar?: string
  role_en?: string
  role_ar?: string
  sequence_order: number
}

export interface CorrespondenceChain {
  correspondence_id: string
  ticket_number: string
  title: string
  direction?: CorrespondenceDirection
  participants: CorrespondenceChainItem[]
}

// ============================================================================
// Enhanced Intake Ticket Types (extending existing)
// ============================================================================

export interface CorrespondenceMetadata {
  direction?: CorrespondenceDirection
  action_category?: ActionCategory
  external_deadline?: string
  external_deadline_source?: string
  deadline_type?: DeadlineType
  external_references?: ExternalReference[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CorrespondenceParticipantListResponse {
  data: CorrespondenceParticipantWithEntity[]
  total: number
}

export interface FindCorrespondenceByParticipantParams {
  entity_type: ParticipantEntityType
  entity_id: string
  participant_type?: ParticipantType
  limit?: number
  offset?: number
}

export interface CorrespondenceSearchResult {
  correspondence_id: string
  ticket_number: string
  title: string
  participant_type: ParticipantType
  direction?: CorrespondenceDirection
  created_at: string
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CorrespondenceFilters {
  direction?: CorrespondenceDirection
  action_category?: ActionCategory
  has_external_deadline?: boolean
  deadline_before?: string
  deadline_after?: string
}
