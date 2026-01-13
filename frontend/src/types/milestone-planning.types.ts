/**
 * Milestone Planning Types
 *
 * Type definitions for the milestone planning tool that allows users
 * to project future events, set reminders, and plan engagement activities
 * for entities with no existing timeline events.
 */

import type { TimelinePriority } from './timeline.types'

/**
 * Types of planned milestones
 */
export type MilestoneType =
  | 'engagement' // Planned engagement/meeting
  | 'policy_deadline' // Policy-related deadline
  | 'relationship_review' // Scheduled relationship review
  | 'document_due' // Document submission deadline
  | 'follow_up' // Follow-up action
  | 'renewal' // Renewal (MOU, agreement)
  | 'custom' // User-defined milestone

/**
 * Milestone status
 */
export type MilestoneStatus =
  | 'planned' // Initial state
  | 'in_progress' // Work started
  | 'completed' // Successfully completed
  | 'postponed' // Moved to later date
  | 'cancelled' // No longer needed

/**
 * Reminder frequency options
 */
export type ReminderFrequency =
  | 'once' // Single reminder
  | 'daily' // Daily until milestone
  | 'weekly' // Weekly until milestone
  | 'custom' // Custom intervals

/**
 * Reminder delivery channel
 */
export type ReminderChannel = 'in_app' | 'email' | 'push'

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  id: string
  enabled: boolean
  remind_before_days: number // Days before milestone to send reminder
  remind_before_hours?: number // Hours before milestone (for same-day)
  frequency: ReminderFrequency
  channels: ReminderChannel[]
  custom_message_en?: string
  custom_message_ar?: string
  last_sent_at?: string // ISO 8601 datetime
  next_reminder_at?: string // ISO 8601 datetime
}

/**
 * Planned milestone structure
 */
export interface PlannedMilestone {
  id: string
  dossier_id: string
  dossier_type:
    | 'Country'
    | 'Organization'
    | 'Person'
    | 'Engagement'
    | 'Forum'
    | 'WorkingGroup'
    | 'Topic'

  // Core milestone info
  milestone_type: MilestoneType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string

  // Timing
  target_date: string // ISO 8601 date
  target_time?: string // Optional time (HH:mm)
  end_date?: string // For multi-day milestones
  timezone?: string // IANA timezone

  // Classification
  priority: TimelinePriority
  status: MilestoneStatus

  // Related entities
  related_entity_id?: string // Link to related dossier
  related_entity_type?: string // Type of related entity

  // Visual customization
  color?: string // Tailwind color class
  icon?: string // Lucide icon name

  // Reminders
  reminders: ReminderConfig[]

  // Notes and context
  notes_en?: string
  notes_ar?: string
  expected_outcome_en?: string
  expected_outcome_ar?: string

  // Conversion tracking (when milestone converts to actual event)
  converted_to_event?: boolean
  converted_event_id?: string
  converted_at?: string

  // Metadata
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Quick add milestone templates
 */
export interface MilestoneTemplate {
  id: string
  type: MilestoneType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  default_priority: TimelinePriority
  default_reminder_days: number
  icon: string
  color: string
}

/**
 * Milestone planning state for a dossier
 */
export interface MilestonePlanningState {
  milestones: PlannedMilestone[]
  is_planning_mode: boolean
  selected_milestone_id?: string
  filter_type?: MilestoneType
  filter_status?: MilestoneStatus
  sort_by: 'target_date' | 'priority' | 'created_at'
  sort_direction: 'asc' | 'desc'
}

/**
 * Create milestone request
 */
export interface CreateMilestoneRequest {
  dossier_id: string
  dossier_type: PlannedMilestone['dossier_type']
  milestone_type: MilestoneType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  target_date: string
  target_time?: string
  end_date?: string
  priority: TimelinePriority
  reminders?: Omit<ReminderConfig, 'id' | 'last_sent_at' | 'next_reminder_at'>[]
  notes_en?: string
  notes_ar?: string
  expected_outcome_en?: string
  expected_outcome_ar?: string
  related_entity_id?: string
  related_entity_type?: string
  color?: string
  icon?: string
}

/**
 * Update milestone request
 */
export interface UpdateMilestoneRequest {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  target_date?: string
  target_time?: string
  end_date?: string
  priority?: TimelinePriority
  status?: MilestoneStatus
  reminders?: ReminderConfig[]
  notes_en?: string
  notes_ar?: string
  expected_outcome_en?: string
  expected_outcome_ar?: string
  color?: string
  icon?: string
}

/**
 * Convert milestone to event request
 */
export interface ConvertMilestoneRequest {
  milestone_id: string
  event_type: 'calendar' | 'commitment' | 'decision'
  additional_details?: Record<string, any>
}

/**
 * Milestone statistics
 */
export interface MilestoneStats {
  total: number
  by_status: Record<MilestoneStatus, number>
  by_type: Record<MilestoneType, number>
  upcoming_this_week: number
  upcoming_this_month: number
  overdue: number
}

/**
 * Hook return type for milestone planning
 */
export interface UseMilestonePlanningReturn {
  milestones: PlannedMilestone[]
  stats: MilestoneStats | null
  isLoading: boolean
  error: Error | null
  createMilestone: (data: CreateMilestoneRequest) => Promise<PlannedMilestone>
  updateMilestone: (id: string, data: UpdateMilestoneRequest) => Promise<PlannedMilestone>
  deleteMilestone: (id: string) => Promise<void>
  convertToEvent: (request: ConvertMilestoneRequest) => Promise<void>
  refetch: () => void
}

/**
 * Default milestone templates
 */
export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    id: 'engagement',
    type: 'engagement',
    title_en: 'Planned Engagement',
    title_ar: 'مشاركة مخططة',
    default_priority: 'medium',
    default_reminder_days: 7,
    icon: 'Users',
    color: 'blue',
  },
  {
    id: 'policy_deadline',
    type: 'policy_deadline',
    title_en: 'Policy Deadline',
    title_ar: 'موعد نهائي للسياسة',
    default_priority: 'high',
    default_reminder_days: 14,
    icon: 'FileText',
    color: 'orange',
  },
  {
    id: 'relationship_review',
    type: 'relationship_review',
    title_en: 'Relationship Review',
    title_ar: 'مراجعة العلاقة',
    default_priority: 'medium',
    default_reminder_days: 30,
    icon: 'RefreshCw',
    color: 'green',
  },
  {
    id: 'document_due',
    type: 'document_due',
    title_en: 'Document Due',
    title_ar: 'استحقاق المستند',
    default_priority: 'high',
    default_reminder_days: 3,
    icon: 'FileCheck',
    color: 'purple',
  },
  {
    id: 'follow_up',
    type: 'follow_up',
    title_en: 'Follow-up',
    title_ar: 'متابعة',
    default_priority: 'medium',
    default_reminder_days: 1,
    icon: 'ArrowRight',
    color: 'cyan',
  },
  {
    id: 'renewal',
    type: 'renewal',
    title_en: 'Renewal Due',
    title_ar: 'موعد التجديد',
    default_priority: 'high',
    default_reminder_days: 30,
    icon: 'RotateCcw',
    color: 'amber',
  },
]

/**
 * Get icon for milestone type
 */
export function getMilestoneIcon(type: MilestoneType): string {
  const template = MILESTONE_TEMPLATES.find((t) => t.type === type)
  return template?.icon || 'Flag'
}

/**
 * Get color for milestone type
 */
export function getMilestoneColor(type: MilestoneType): string {
  const template = MILESTONE_TEMPLATES.find((t) => t.type === type)
  return template?.color || 'gray'
}
