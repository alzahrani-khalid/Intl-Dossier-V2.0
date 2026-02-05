// Extended forum types for agenda items, side events, and logistics
// These types extend the existing forum functionality

// ============================================================================
// Forum Agenda Item Types
// ============================================================================

export type AgendaItemType =
  | 'discussion'
  | 'decision'
  | 'information'
  | 'election'
  | 'procedural'
  | 'report'
  | 'adoption'

export type AgendaItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'deferred'
  | 'withdrawn'
  | 'adopted'
  | 'rejected'

export type AgendaItemPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface AgendaItemDocument {
  title: string
  url: string
  type: string
}

export interface AgendaItemSpeaker {
  name_en: string
  name_ar?: string
  organization?: string
  role?: string
}

export interface ForumAgendaItem {
  id: string
  session_id: string
  item_number: string
  sequence_order: number
  title_en: string
  title_ar: string
  description_en?: string | null
  description_ar?: string | null
  item_type: AgendaItemType
  parent_item_id?: string | null
  level: number
  time_allocation_minutes?: number | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  status: AgendaItemStatus
  outcome_en?: string | null
  outcome_ar?: string | null
  resolution_reference?: string | null
  documents: AgendaItemDocument[]
  background_notes_en?: string | null
  background_notes_ar?: string | null
  speakers: AgendaItemSpeaker[]
  tags: string[]
  priority: AgendaItemPriority
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface ForumAgendaItemWithStats extends ForumAgendaItem {
  assignments_count?: number
  lead_assignee_name?: string
  children?: ForumAgendaItemWithStats[]
}

export interface CreateAgendaItemRequest {
  session_id: string
  item_number: string
  sequence_order: number
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  item_type: AgendaItemType
  parent_item_id?: string
  time_allocation_minutes?: number
  scheduled_start_time?: string
  scheduled_end_time?: string
  documents?: AgendaItemDocument[]
  background_notes_en?: string
  background_notes_ar?: string
  speakers?: AgendaItemSpeaker[]
  tags?: string[]
  priority?: AgendaItemPriority
}

export interface UpdateAgendaItemRequest
  extends Partial<Omit<CreateAgendaItemRequest, 'session_id'>> {
  status?: AgendaItemStatus
  outcome_en?: string
  outcome_ar?: string
  resolution_reference?: string
}

// ============================================================================
// Agenda Item Assignment Types
// ============================================================================

export type AssigneeType = 'department' | 'organization' | 'person' | 'working_group'

export type AssignmentRole =
  | 'lead'
  | 'support'
  | 'observer'
  | 'presenter'
  | 'rapporteur'
  | 'coordinator'

export type AssignmentStatus =
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'completed'
  | 'pending_review'
  | 'declined'

export interface AgendaItemAssignment {
  id: string
  agenda_item_id: string
  assignee_type: AssigneeType
  assignee_id: string
  assignee_name_en?: string | null
  assignee_name_ar?: string | null
  role: AssignmentRole
  instructions_en?: string | null
  instructions_ar?: string | null
  deadline?: string | null
  status: AssignmentStatus
  response_en?: string | null
  response_ar?: string | null
  response_documents: AgendaItemDocument[]
  responded_at?: string | null
  assigned_at: string
  assigned_by?: string | null
  updated_at: string
}

export interface CreateAssignmentRequest {
  agenda_item_id: string
  assignee_type: AssigneeType
  assignee_id: string
  assignee_name_en?: string
  assignee_name_ar?: string
  role: AssignmentRole
  instructions_en?: string
  instructions_ar?: string
  deadline?: string
}

export interface UpdateAssignmentRequest {
  status?: AssignmentStatus
  response_en?: string
  response_ar?: string
  response_documents?: AgendaItemDocument[]
}

// ============================================================================
// Side Event Types
// ============================================================================

export type SideEventType =
  | 'bilateral_meeting'
  | 'multilateral_meeting'
  | 'reception'
  | 'exhibition'
  | 'workshop'
  | 'press_conference'
  | 'signing_ceremony'
  | 'cultural_event'
  | 'networking'
  | 'breakfast_meeting'
  | 'lunch_meeting'
  | 'dinner_meeting'
  | 'other'

export type SideEventStatus =
  | 'planned'
  | 'confirmed'
  | 'tentative'
  | 'cancelled'
  | 'postponed'
  | 'completed'

export type SideEventPriority = 'low' | 'normal' | 'high' | 'vip'

export type OrganizerType = 'organization' | 'country' | 'person' | 'delegation'

export interface EventParticipant {
  type: 'country' | 'organization' | 'person'
  id: string
  name_en: string
  name_ar?: string
  role?: string
}

export interface EventMaterial {
  title: string
  url: string
  type: string
}

export interface SideEvent {
  id: string
  session_id: string
  event_type: SideEventType
  title_en: string
  title_ar: string
  description_en?: string | null
  description_ar?: string | null
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  all_day: boolean
  venue_en?: string | null
  venue_ar?: string | null
  venue_address_en?: string | null
  venue_address_ar?: string | null
  room_name?: string | null
  is_offsite: boolean
  capacity?: number | null
  expected_attendance?: number | null
  registration_required: boolean
  invitation_only: boolean
  organizer_type?: OrganizerType | null
  organizer_id?: string | null
  organizer_name_en?: string | null
  organizer_name_ar?: string | null
  host_country_id?: string | null
  participants: EventParticipant[]
  status: SideEventStatus
  cancellation_reason?: string | null
  agenda_url?: string | null
  materials: EventMaterial[]
  notes_en?: string | null
  notes_ar?: string | null
  internal_notes?: string | null
  priority: SideEventPriority
  is_public: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface SideEventWithStats extends SideEvent {
  attendee_count?: number
  confirmed_count?: number
  logistics_status?: {
    total: number
    pending: number
    confirmed: number
  }
}

export interface CreateSideEventRequest {
  session_id: string
  event_type: SideEventType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  scheduled_date: string
  start_time?: string
  end_time?: string
  all_day?: boolean
  venue_en?: string
  venue_ar?: string
  venue_address_en?: string
  venue_address_ar?: string
  room_name?: string
  is_offsite?: boolean
  capacity?: number
  expected_attendance?: number
  registration_required?: boolean
  invitation_only?: boolean
  organizer_type?: OrganizerType
  organizer_id?: string
  organizer_name_en?: string
  organizer_name_ar?: string
  host_country_id?: string
  participants?: EventParticipant[]
  agenda_url?: string
  materials?: EventMaterial[]
  notes_en?: string
  notes_ar?: string
  internal_notes?: string
  priority?: SideEventPriority
  is_public?: boolean
}

export interface UpdateSideEventRequest
  extends Partial<Omit<CreateSideEventRequest, 'session_id'>> {
  status?: SideEventStatus
  cancellation_reason?: string
}

// ============================================================================
// Event Logistics Types
// ============================================================================

export type LogisticsType =
  | 'catering'
  | 'av_equipment'
  | 'interpretation'
  | 'security'
  | 'transportation'
  | 'accommodation'
  | 'decoration'
  | 'photography'
  | 'printing'
  | 'registration'
  | 'signage'
  | 'gifts'
  | 'protocol'
  | 'other'

export type LogisticsStatus =
  | 'pending'
  | 'requested'
  | 'quoted'
  | 'approved'
  | 'booked'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export interface EventLogistics {
  id: string
  event_id: string
  logistics_type: LogisticsType
  provider_name?: string | null
  provider_contact?: string | null
  provider_email?: string | null
  provider_phone?: string | null
  requirements_en?: string | null
  requirements_ar?: string | null
  quantity?: number | null
  specifications: Record<string, unknown>
  estimated_cost?: number | null
  actual_cost?: number | null
  currency: string
  budget_code?: string | null
  status: LogisticsStatus
  deadline?: string | null
  booked_at?: string | null
  confirmed_at?: string | null
  notes?: string | null
  internal_notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface CreateLogisticsRequest {
  event_id: string
  logistics_type: LogisticsType
  provider_name?: string
  provider_contact?: string
  provider_email?: string
  provider_phone?: string
  requirements_en?: string
  requirements_ar?: string
  quantity?: number
  specifications?: Record<string, unknown>
  estimated_cost?: number
  currency?: string
  budget_code?: string
  deadline?: string
  notes?: string
  internal_notes?: string
}

export interface UpdateLogisticsRequest extends Partial<Omit<CreateLogisticsRequest, 'event_id'>> {
  status?: LogisticsStatus
  actual_cost?: number
  booked_at?: string
  confirmed_at?: string
}

// ============================================================================
// Event Attendee Types
// ============================================================================

export type AttendeeRole =
  | 'host'
  | 'co_host'
  | 'speaker'
  | 'moderator'
  | 'panelist'
  | 'vip_guest'
  | 'attendee'
  | 'observer'
  | 'staff'
  | 'interpreter'

export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'tentative' | 'no_response'

export type RepresentingType = 'country' | 'organization' | 'self'

export interface SideEventAttendee {
  id: string
  event_id: string
  person_id?: string | null
  external_name_en?: string | null
  external_name_ar?: string | null
  external_title_en?: string | null
  external_title_ar?: string | null
  representing_type?: RepresentingType | null
  representing_id?: string | null
  representing_name_en?: string | null
  representing_name_ar?: string | null
  role: AttendeeRole
  invitation_sent: boolean
  invitation_sent_at?: string | null
  rsvp_status: RsvpStatus
  rsvp_at?: string | null
  attended?: boolean | null
  attendance_notes?: string | null
  dietary_requirements?: string | null
  accessibility_requirements?: string | null
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export interface SideEventAttendeeWithPerson extends SideEventAttendee {
  name_en?: string
  name_ar?: string
  title_en?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SessionAgendaResponse {
  data: ForumAgendaItemWithStats[]
  session_id: string
}

export interface SessionResponseStatus {
  total_items: number
  total_assignments: number
  assignments_completed: number
  assignments_pending: number
  assignments_in_progress: number
  completion_percentage: number
}

export interface SessionSideEventsResponse {
  data: SideEventWithStats[]
  session_id: string
}

export interface LogisticsDashboardItem {
  event_id: string
  event_title_en: string
  event_date: string
  total_logistics: number
  pending_logistics: number
  confirmed_logistics: number
  total_estimated_cost: number
  total_actual_cost: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface AgendaFilters {
  session_id: string
  item_type?: AgendaItemType
  status?: AgendaItemStatus
  priority?: AgendaItemPriority
}

export interface SideEventFilters {
  session_id: string
  date?: string
  event_type?: SideEventType
  status?: SideEventStatus
  is_public?: boolean
}

export interface AssignmentFilters {
  assignee_type?: AssigneeType
  assignee_id?: string
  status?: AssignmentStatus
  role?: AssignmentRole
}
