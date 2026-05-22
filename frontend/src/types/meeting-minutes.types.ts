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

// D-58-06-A-02: STATUS palette → muted (draft, archived) / accent (in_progress) /
// warning (review) / success (approved). No D-07 collision (blue only).
export const STATUS_COLORS: Record<
  MeetingMinutesStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: 'bg-muted/5 dark:bg-muted/20',
    text: 'text-muted-foreground',
    border: 'border-muted/20 dark:border-muted/80',
  },
  in_progress: {
    bg: 'bg-accent/5 dark:bg-accent/20',
    text: 'text-accent',
    border: 'border-accent/20 dark:border-accent/80',
  },
  review: {
    bg: 'bg-warning/5 dark:bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/20 dark:border-warning/80',
  },
  approved: {
    bg: 'bg-success/5 dark:bg-success/20',
    text: 'text-success',
    border: 'border-success/20 dark:border-success/80',
  },
  archived: {
    bg: 'bg-muted/5 dark:bg-muted/20',
    text: 'text-muted-foreground',
    border: 'border-muted/20 dark:border-muted/80',
  },
}

// D-58-06-A-02: PRIORITY palette → success / warning / warning-step / destructive.
export const PRIORITY_COLORS: Record<ActionItemPriority, { bg: string; text: string }> = {
  low: {
    bg: 'bg-success/10 dark:bg-success/30',
    text: 'text-success',
  },
  medium: {
    bg: 'bg-warning/10 dark:bg-warning/30',
    text: 'text-warning',
  },
  high: {
    bg: 'bg-warning/20 dark:bg-warning/40',
    text: 'text-warning',
  },
  urgent: {
    bg: 'bg-destructive/10 dark:bg-destructive/30',
    text: 'text-destructive',
  },
}

// D-58-06-A-02: ACTION_ITEM_STATUS palette — D-07 collision (blue + purple):
//   in_progress=accent (blue), deferred=secondary (purple).
export const ACTION_ITEM_STATUS_COLORS: Record<ActionItemStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-muted/10 dark:bg-muted/30',
    text: 'text-muted-foreground',
  },
  in_progress: {
    bg: 'bg-accent/10 dark:bg-accent/30',
    text: 'text-accent',
  },
  completed: {
    bg: 'bg-success/10 dark:bg-success/30',
    text: 'text-success',
  },
  cancelled: {
    bg: 'bg-destructive/10 dark:bg-destructive/30',
    text: 'text-destructive',
  },
  deferred: {
    bg: 'bg-secondary/10 dark:bg-secondary/30',
    text: 'text-secondary-foreground',
  },
}

// D-58-06-A-02: ATTENDANCE_STATUS palette — D-07 collision (blue + purple):
//   remote=accent (blue), left_early=secondary (purple).
//   late=warning-step (orange) sibling of excused=warning (yellow).
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string }> = {
  present: {
    bg: 'bg-success/10 dark:bg-success/30',
    text: 'text-success',
  },
  absent: {
    bg: 'bg-destructive/10 dark:bg-destructive/30',
    text: 'text-destructive',
  },
  excused: {
    bg: 'bg-warning/10 dark:bg-warning/30',
    text: 'text-warning',
  },
  late: {
    bg: 'bg-warning/20 dark:bg-warning/40',
    text: 'text-warning',
  },
  left_early: {
    bg: 'bg-secondary/10 dark:bg-secondary/30',
    text: 'text-secondary-foreground',
  },
  remote: {
    bg: 'bg-accent/10 dark:bg-accent/30',
    text: 'text-accent',
  },
}
