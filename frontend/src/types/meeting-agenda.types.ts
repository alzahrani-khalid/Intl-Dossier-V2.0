/**
 * Meeting Agenda Types
 * Feature: meeting-agenda-builder
 *
 * TypeScript interfaces for building meeting agendas with time-boxed topics,
 * assigned presenters, linked entities, and document attachments.
 * Supports PDF generation and actual vs planned timing tracking.
 */

// ============================================
// Status & Enum Types
// ============================================

export const AGENDA_STATUSES = ['draft', 'finalized', 'in_meeting', 'completed'] as const
export type AgendaStatus = (typeof AGENDA_STATUSES)[number]

export const AGENDA_ITEM_TYPES = [
  'opening',
  'approval',
  'discussion',
  'presentation',
  'decision',
  'action_review',
  'break',
  'closing',
  'other',
] as const
export type AgendaItemType = (typeof AGENDA_ITEM_TYPES)[number]

export const AGENDA_ITEM_STATUSES = [
  'pending',
  'in_progress',
  'discussed',
  'deferred',
  'skipped',
] as const
export type AgendaItemStatus = (typeof AGENDA_ITEM_STATUSES)[number]

export const TIMING_STATUSES = [
  'not_started',
  'on_time',
  'running_over',
  'completed_early',
  'completed_late',
  'skipped',
] as const
export type TimingStatus = (typeof TIMING_STATUSES)[number]

export const PARTICIPANT_TYPES = [
  'user',
  'person_dossier',
  'external_contact',
  'organization',
] as const
export type ParticipantType = (typeof PARTICIPANT_TYPES)[number]

export const PARTICIPANT_ROLES = [
  'chair',
  'co_chair',
  'secretary',
  'presenter',
  'required',
  'optional',
  'observer',
] as const
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number]

export const RSVP_STATUSES = ['pending', 'accepted', 'declined', 'tentative'] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export const PRESENTER_TYPES = ['user', 'person_dossier', 'external', 'organization'] as const
export type PresenterType = (typeof PRESENTER_TYPES)[number]

export const AGENDA_DOCUMENT_TYPES = [
  'attachment',
  'presentation',
  'reference',
  'handout',
  'supporting_document',
  'agenda_pdf',
] as const
export type AgendaDocumentType = (typeof AGENDA_DOCUMENT_TYPES)[number]

export const TIMING_SNAPSHOT_TYPES = [
  'meeting_start',
  'meeting_end',
  'item_start',
  'item_end',
  'break_start',
  'break_end',
  'pause',
  'resume',
] as const
export type TimingSnapshotType = (typeof TIMING_SNAPSHOT_TYPES)[number]

// ============================================
// Core Interfaces
// ============================================

/**
 * Main meeting agenda entity
 */
export interface MeetingAgenda {
  id: string
  organization_id: string
  calendar_event_id?: string
  meeting_minutes_id?: string
  dossier_id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  meeting_url?: string
  planned_start_time?: string
  planned_end_time?: string
  actual_start_time?: string
  actual_end_time?: string
  timezone: string
  status: AgendaStatus
  pdf_storage_path?: string
  pdf_generated_at?: string
  pdf_version: number
  is_template: boolean
  template_name?: string
  template_description?: string
  is_public: boolean
  shared_with_participants: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * Individual agenda item with time boxing
 */
export interface AgendaItem {
  id: string
  agenda_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  notes_en?: string
  notes_ar?: string
  sort_order: number
  parent_item_id?: string
  indent_level: number
  planned_duration_minutes: number
  planned_start_time?: string
  planned_end_time?: string
  actual_start_time?: string
  actual_end_time?: string
  actual_duration_minutes?: number
  timing_status: TimingStatus
  item_type: AgendaItemType
  presenter_type?: PresenterType
  presenter_user_id?: string
  presenter_person_id?: string
  presenter_org_id?: string
  presenter_name_en?: string
  presenter_name_ar?: string
  presenter_title_en?: string
  presenter_title_ar?: string
  linked_dossier_id?: string
  linked_commitment_id?: string
  linked_entity_type?: string
  linked_entity_id?: string
  status: AgendaItemStatus
  outcome_en?: string
  outcome_ar?: string
  decision_made: boolean
  action_items_created: number
  ai_suggested: boolean
  ai_suggested_duration?: number
  created_at: string
  updated_at: string
}

/**
 * Agenda participant with RSVP tracking
 */
export interface AgendaParticipant {
  id: string
  agenda_id: string
  participant_type: ParticipantType
  user_id?: string
  person_dossier_id?: string
  organization_id?: string
  name_en?: string
  name_ar?: string
  email?: string
  title_en?: string
  title_ar?: string
  organization_name_en?: string
  organization_name_ar?: string
  role: ParticipantRole
  rsvp_status: RsvpStatus
  rsvp_at?: string
  rsvp_notes?: string
  notify_on_changes: boolean
  notify_before_meeting: boolean
  created_at: string
  updated_at: string
}

/**
 * Document attached to agenda or agenda item
 */
export interface AgendaDocument {
  id: string
  agenda_id: string
  agenda_item_id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  storage_path: string
  file_name: string
  file_type: string
  file_size_bytes?: number
  mime_type?: string
  document_type: AgendaDocumentType
  is_public: boolean
  shared_before_meeting: boolean
  version: number
  uploaded_by?: string
  created_at: string
  updated_at: string
}

/**
 * Timing snapshot for historical tracking
 */
export interface TimingSnapshot {
  id: string
  agenda_id: string
  agenda_item_id?: string
  snapshot_type: TimingSnapshotType
  timestamp: string
  planned_time?: string
  variance_minutes?: number
  notes?: string
  recorded_by?: string
  created_at: string
}

/**
 * Agenda statistics
 */
export interface AgendaStats {
  item_count: number
  total_planned_minutes: number
  participant_count: number
  accepted_count: number
  document_count: number
  completed_items: number
  presenter_count: number
}

/**
 * Complete agenda with all related data
 */
export interface AgendaFull {
  agenda: MeetingAgenda
  items: AgendaItem[]
  participants: AgendaParticipant[]
  documents: AgendaDocument[]
  stats: AgendaStats
}

/**
 * Agenda timing calculation result
 */
export interface AgendaTiming {
  agenda_id: string
  total_planned_minutes: number
  total_actual_minutes: number
  variance_minutes: number
  variance_percentage: number
  meeting_started: boolean
  meeting_ended: boolean
  actual_start_time?: string
  actual_end_time?: string
  items: AgendaItemTiming[]
}

/**
 * Individual item timing data
 */
export interface AgendaItemTiming {
  id: string
  title_en: string
  sort_order: number
  planned_minutes: number
  actual_minutes?: number
  variance_minutes: number
  timing_status: TimingStatus
  status: AgendaItemStatus
}

// ============================================
// Input Types
// ============================================

/**
 * Input for creating a meeting agenda
 */
export interface CreateAgendaInput {
  calendar_event_id?: string
  dossier_id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  planned_start_time?: string
  planned_end_time?: string
  timezone?: string
  is_template?: boolean
  template_name?: string
  template_description?: string
  is_public?: boolean
  shared_with_participants?: boolean
}

/**
 * Input for updating a meeting agenda
 */
export interface UpdateAgendaInput {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date?: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  planned_start_time?: string
  planned_end_time?: string
  timezone?: string
  status?: AgendaStatus
  is_public?: boolean
  shared_with_participants?: boolean
}

/**
 * Input for creating an agenda item
 */
export interface CreateAgendaItemInput {
  agenda_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  sort_order?: number
  parent_item_id?: string
  indent_level?: number
  planned_duration_minutes: number
  planned_start_time?: string
  planned_end_time?: string
  item_type: AgendaItemType
  presenter_type?: PresenterType
  presenter_user_id?: string
  presenter_person_id?: string
  presenter_org_id?: string
  presenter_name_en?: string
  presenter_name_ar?: string
  presenter_title_en?: string
  presenter_title_ar?: string
  linked_dossier_id?: string
  linked_commitment_id?: string
  linked_entity_type?: string
  linked_entity_id?: string
}

/**
 * Input for updating an agenda item
 */
export interface UpdateAgendaItemInput {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  notes_en?: string
  notes_ar?: string
  sort_order?: number
  parent_item_id?: string
  indent_level?: number
  planned_duration_minutes?: number
  planned_start_time?: string
  planned_end_time?: string
  item_type?: AgendaItemType
  presenter_type?: PresenterType
  presenter_user_id?: string
  presenter_person_id?: string
  presenter_org_id?: string
  presenter_name_en?: string
  presenter_name_ar?: string
  presenter_title_en?: string
  presenter_title_ar?: string
  linked_dossier_id?: string
  linked_commitment_id?: string
  status?: AgendaItemStatus
  outcome_en?: string
  outcome_ar?: string
  decision_made?: boolean
}

/**
 * Input for adding a participant
 */
export interface AddParticipantInput {
  agenda_id: string
  participant_type: ParticipantType
  user_id?: string
  person_dossier_id?: string
  organization_id?: string
  name_en?: string
  name_ar?: string
  email?: string
  title_en?: string
  title_ar?: string
  organization_name_en?: string
  organization_name_ar?: string
  role: ParticipantRole
  notify_on_changes?: boolean
  notify_before_meeting?: boolean
}

/**
 * Input for updating participant RSVP
 */
export interface UpdateRsvpInput {
  rsvp_status: RsvpStatus
  rsvp_notes?: string
}

/**
 * Input for adding a document
 */
export interface AddDocumentInput {
  agenda_id: string
  agenda_item_id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  storage_path: string
  file_name: string
  file_type: string
  file_size_bytes?: number
  mime_type?: string
  document_type: AgendaDocumentType
  is_public?: boolean
  shared_before_meeting?: boolean
}

/**
 * Input for completing an agenda item
 */
export interface CompleteItemInput {
  outcome_en?: string
  outcome_ar?: string
  decision_made?: boolean
}

/**
 * Input for reordering items
 */
export interface ReorderItemsInput {
  id: string
  sort_order: number
}

/**
 * Input for creating from template
 */
export interface CreateFromTemplateInput {
  template_id: string
  meeting_date: string
  title_en: string
  title_ar?: string
  dossier_id?: string
  calendar_event_id?: string
}

// ============================================
// Filter & Query Types
// ============================================

/**
 * Filters for agenda list
 */
export interface AgendaFilters {
  search?: string
  status?: AgendaStatus
  dossier_id?: string
  from_date?: string
  to_date?: string
  is_template?: boolean
  created_by?: string
}

/**
 * Agenda list item (search result)
 */
export interface AgendaListItem {
  id: string
  title_en: string
  title_ar?: string
  meeting_date: string
  location_en?: string
  is_virtual: boolean
  status: AgendaStatus
  item_count: number
  total_duration_minutes: number
  participant_count: number
  is_template: boolean
  dossier_id?: string
  dossier_name_en?: string
  created_by?: string
  created_at: string
}

/**
 * Paginated response
 */
export interface AgendaListResponse {
  items: AgendaListItem[]
  hasMore: boolean
  limit: number
  offset: number
}

// ============================================
// TanStack Query Keys
// ============================================

export const agendaKeys = {
  all: ['agendas'] as const,
  lists: () => [...agendaKeys.all, 'list'] as const,
  list: (filters?: AgendaFilters) => [...agendaKeys.lists(), filters] as const,
  templates: () => [...agendaKeys.all, 'templates'] as const,
  details: () => [...agendaKeys.all, 'detail'] as const,
  detail: (id: string) => [...agendaKeys.details(), id] as const,
  items: (agendaId: string) => [...agendaKeys.all, 'items', agendaId] as const,
  participants: (agendaId: string) => [...agendaKeys.all, 'participants', agendaId] as const,
  documents: (agendaId: string) => [...agendaKeys.all, 'documents', agendaId] as const,
  timing: (agendaId: string) => [...agendaKeys.all, 'timing', agendaId] as const,
}

// ============================================
// Color Maps for UI
// ============================================

export const AGENDA_STATUS_COLORS: Record<
  AgendaStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  finalized: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  in_meeting: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
}

export const ITEM_STATUS_COLORS: Record<AgendaItemStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  discussed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  deferred: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  skipped: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

export const TIMING_STATUS_COLORS: Record<TimingStatus, { bg: string; text: string }> = {
  not_started: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  on_time: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  running_over: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  completed_early: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  completed_late: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  skipped: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
}

export const RSVP_STATUS_COLORS: Record<RsvpStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  accepted: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  declined: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  tentative: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
}

export const ITEM_TYPE_COLORS: Record<AgendaItemType, { bg: string; text: string; icon: string }> =
  {
    opening: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: 'Play',
    },
    approval: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: 'CheckCircle',
    },
    discussion: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'MessageSquare',
    },
    presentation: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      icon: 'Presentation',
    },
    decision: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'Scale',
    },
    action_review: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-700 dark:text-cyan-300',
      icon: 'ClipboardCheck',
    },
    break: {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-700 dark:text-gray-300',
      icon: 'Coffee',
    },
    closing: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-300',
      icon: 'Flag',
    },
    other: {
      bg: 'bg-slate-100 dark:bg-slate-900/30',
      text: 'text-slate-700 dark:text-slate-300',
      icon: 'MoreHorizontal',
    },
  }

// ============================================
// Utility Functions
// ============================================

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

/**
 * Calculate planned times for all items based on start time
 */
export function calculateItemTimes(
  items: AgendaItem[],
  meetingStartTime: string,
): Array<AgendaItem & { calculated_start: string; calculated_end: string }> {
  let currentTime = meetingStartTime
  return items
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const start = currentTime
      const end = calculateEndTime(currentTime, item.planned_duration_minutes)
      currentTime = end
      return {
        ...item,
        calculated_start: start,
        calculated_end: end,
      }
    })
}

/**
 * Get timing variance color class
 */
export function getVarianceColor(varianceMinutes: number): string {
  if (varianceMinutes <= -5) return 'text-blue-600' // Completed early
  if (varianceMinutes <= 2) return 'text-green-600' // On time
  if (varianceMinutes <= 5) return 'text-yellow-600' // Slightly over
  return 'text-red-600' // Running over
}
