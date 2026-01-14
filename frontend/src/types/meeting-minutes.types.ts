/**
 * Meeting Minutes Types
 * Feature: meeting-minutes-capture
 *
 * TypeScript interfaces for meeting minutes management with attendees,
 * action items, voice memos, and AI summarization support.
 */

// ============================================
// Status & Enum Types
// ============================================

export const MEETING_MINUTES_STATUSES = [
  'draft',
  'in_progress',
  'review',
  'approved',
  'archived',
] as const
export type MeetingMinutesStatus = (typeof MEETING_MINUTES_STATUSES)[number]

export const ATTENDEE_TYPES = [
  'user',
  'person_dossier',
  'external_contact',
  'organization',
] as const
export type AttendeeType = (typeof ATTENDEE_TYPES)[number]

export const ATTENDEE_ROLES = [
  'chair',
  'co_chair',
  'secretary',
  'presenter',
  'attendee',
  'observer',
  'guest',
] as const
export type AttendeeRole = (typeof ATTENDEE_ROLES)[number]

export const ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'excused',
  'late',
  'left_early',
  'remote',
] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const ACTION_ITEM_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type ActionItemPriority = (typeof ACTION_ITEM_PRIORITIES)[number]

export const ACTION_ITEM_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'deferred',
] as const
export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number]

export const AGENDA_ITEM_STATUSES = ['pending', 'discussed', 'skipped'] as const
export type AgendaItemStatus = (typeof AGENDA_ITEM_STATUSES)[number]

export const DECISION_TYPES = ['resolution', 'action', 'deferral', 'approval', 'rejection'] as const
export type DecisionType = (typeof DECISION_TYPES)[number]

// ============================================
// Core Interfaces
// ============================================

/**
 * Agenda item for meeting
 */
export interface AgendaItem {
  id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  order: number
  status?: AgendaItemStatus
  presenter_name?: string
  duration_minutes?: number
}

/**
 * Discussion point recorded during meeting
 */
export interface DiscussionPoint {
  id?: string
  topic_en: string
  topic_ar?: string
  summary_en?: string
  summary_ar?: string
  agenda_item_id?: string
  speaker_name?: string
  recorded_at?: string
}

/**
 * Decision made during meeting
 */
export interface Decision {
  id?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  decision_type: DecisionType
  passed?: boolean
  votes_for?: number
  votes_against?: number
  abstentions?: number
}

/**
 * Meeting attendee
 */
export interface MeetingAttendee {
  id: string
  meeting_minutes_id: string
  attendee_type: AttendeeType
  user_id?: string
  person_dossier_id?: string
  external_contact_id?: string
  organization_id?: string
  name_en?: string
  name_ar?: string
  email?: string
  title_en?: string
  title_ar?: string
  organization_name_en?: string
  organization_name_ar?: string
  role: AttendeeRole
  attendance_status: AttendanceStatus
  arrived_at?: string
  departed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * Action item from meeting
 */
export interface MeetingActionItem {
  id: string
  meeting_minutes_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  assignee_type?: AttendeeType
  assignee_user_id?: string
  assignee_person_id?: string
  assignee_org_id?: string
  assignee_name_en?: string
  assignee_name_ar?: string
  priority: ActionItemPriority
  status: ActionItemStatus
  due_date?: string
  completed_at?: string
  ai_extracted: boolean
  ai_confidence?: number
  source_text?: string
  linked_commitment_id?: string
  linked_task_id?: string
  auto_created_work_item: boolean
  sort_order: number
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Voice memo attached to meeting
 */
export interface MeetingVoiceMemo {
  id: string
  title?: string
  duration_seconds: number
  status: string
  transcription?: string
  recorded_at: string
}

/**
 * Main meeting minutes entity
 */
export interface MeetingMinutes {
  id: string
  organization_id: string
  calendar_event_id?: string
  engagement_id?: string
  working_group_meeting_id?: string
  dossier_id?: string
  title_en: string
  title_ar?: string
  meeting_date: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  meeting_url?: string
  summary_en?: string
  summary_ar?: string
  agenda_items: AgendaItem[]
  discussion_points: DiscussionPoint[]
  decisions: Decision[]
  ai_summary_en?: string
  ai_summary_ar?: string
  ai_generated_at?: string
  ai_model_version?: string
  ai_confidence?: number
  status: MeetingMinutesStatus
  approved_by?: string
  approved_at?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * Meeting minutes with all related data
 */
export interface MeetingMinutesFull {
  minutes: MeetingMinutes
  attendees: MeetingAttendee[]
  action_items: MeetingActionItem[]
  voice_memos: MeetingVoiceMemo[]
  stats: MeetingMinutesStats
}

/**
 * Meeting minutes statistics
 */
export interface MeetingMinutesStats {
  attendee_count: number
  present_count: number
  action_item_count: number
  completed_action_items: number
  voice_memo_count: number
}

// ============================================
// Input Types
// ============================================

/**
 * Input for creating meeting minutes
 */
export interface CreateMeetingMinutesInput {
  calendar_event_id?: string
  engagement_id?: string
  working_group_meeting_id?: string
  dossier_id?: string
  title_en: string
  title_ar?: string
  meeting_date: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  summary_en?: string
  summary_ar?: string
  agenda_items?: AgendaItem[]
  discussion_points?: DiscussionPoint[]
  decisions?: Decision[]
  status?: MeetingMinutesStatus
}

/**
 * Input for updating meeting minutes
 */
export interface UpdateMeetingMinutesInput {
  title_en?: string
  title_ar?: string
  meeting_date?: string
  meeting_end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  summary_en?: string
  summary_ar?: string
  agenda_items?: AgendaItem[]
  discussion_points?: DiscussionPoint[]
  decisions?: Decision[]
  status?: MeetingMinutesStatus
}

/**
 * Input for adding attendee
 */
export interface AddAttendeeInput {
  meeting_minutes_id: string
  attendee_type: AttendeeType
  user_id?: string
  person_dossier_id?: string
  external_contact_id?: string
  organization_id?: string
  name_en?: string
  name_ar?: string
  email?: string
  title_en?: string
  title_ar?: string
  organization_name_en?: string
  organization_name_ar?: string
  role?: AttendeeRole
  attendance_status?: AttendanceStatus
}

/**
 * Input for adding action item
 */
export interface AddActionItemInput {
  meeting_minutes_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  assignee_type?: AttendeeType
  assignee_user_id?: string
  assignee_person_id?: string
  assignee_org_id?: string
  assignee_name_en?: string
  assignee_name_ar?: string
  priority?: ActionItemPriority
  due_date?: string
  ai_extracted?: boolean
  ai_confidence?: number
  source_text?: string
}

/**
 * Input for updating action item
 */
export interface UpdateActionItemInput {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  assignee_type?: AttendeeType
  assignee_user_id?: string
  assignee_person_id?: string
  assignee_org_id?: string
  assignee_name_en?: string
  assignee_name_ar?: string
  priority?: ActionItemPriority
  status?: ActionItemStatus
  due_date?: string
}

// ============================================
// Filter & Query Types
// ============================================

/**
 * Filters for meeting minutes list
 */
export interface MeetingMinutesFilters {
  search?: string
  status?: MeetingMinutesStatus
  dossier_id?: string
  engagement_id?: string
  from_date?: string
  to_date?: string
  created_by?: string
}

/**
 * Search result item
 */
export interface MeetingMinutesListItem {
  id: string
  title_en: string
  title_ar?: string
  meeting_date: string
  location_en?: string
  is_virtual: boolean
  status: MeetingMinutesStatus
  attendee_count: number
  action_item_count: number
  ai_summary_en?: string
  dossier_id?: string
  dossier_name_en?: string
  engagement_id?: string
  created_by?: string
  created_at: string
}

/**
 * Paginated response
 */
export interface MeetingMinutesListResponse {
  items: MeetingMinutesListItem[]
  hasMore: boolean
  limit: number
  offset: number
}

// ============================================
// TanStack Query Keys
// ============================================

export const meetingMinutesKeys = {
  all: ['meeting-minutes'] as const,
  lists: () => [...meetingMinutesKeys.all, 'list'] as const,
  list: (filters?: MeetingMinutesFilters) => [...meetingMinutesKeys.lists(), filters] as const,
  details: () => [...meetingMinutesKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingMinutesKeys.details(), id] as const,
  attendees: (minutesId: string) => [...meetingMinutesKeys.all, 'attendees', minutesId] as const,
  actionItems: (minutesId: string) =>
    [...meetingMinutesKeys.all, 'action-items', minutesId] as const,
}

// ============================================
// Color Maps for UI
// ============================================

export const STATUS_COLORS: Record<
  MeetingMinutesStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  in_progress: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  review: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  approved: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  archived: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-800',
  },
}

export const PRIORITY_COLORS: Record<ActionItemPriority, { bg: string; text: string }> = {
  low: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  urgent: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

export const ACTION_ITEM_STATUS_COLORS: Record<ActionItemStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  deferred: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string }> = {
  present: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  absent: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  excused: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  late: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  left_early: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  remote: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
}
