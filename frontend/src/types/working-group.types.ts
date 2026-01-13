/**
 * TypeScript types for Working Groups Entity Management
 *
 * Feature: working-groups-entity-management
 *
 * Supports committees, task forces, and collaborative bodies with
 * membership tracking, mandate management, and deliverable coordination.
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type WorkingGroupType =
  | 'committee'
  | 'task_force'
  | 'advisory_board'
  | 'technical_group'
  | 'steering_committee'

export type WorkingGroupStatus = 'active' | 'suspended' | 'disbanded'

export type MeetingFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'biannually'
  | 'annually'
  | 'as_needed'

export type MemberType = 'organization' | 'person'

export type MemberRole =
  | 'chair'
  | 'co_chair'
  | 'vice_chair'
  | 'secretary'
  | 'member'
  | 'observer'
  | 'advisor'
  | 'liaison'

export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'deferred'

export type DeliverablePriority = 'low' | 'medium' | 'high' | 'urgent'

export type DeliverableType =
  | 'document'
  | 'report'
  | 'recommendation'
  | 'standard'
  | 'guideline'
  | 'framework'
  | 'action_plan'
  | 'other'

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'

export type DecisionType =
  | 'resolution'
  | 'recommendation'
  | 'action'
  | 'policy'
  | 'procedural'
  | 'other'

export type DecisionStatus =
  | 'proposed'
  | 'under_review'
  | 'adopted'
  | 'implemented'
  | 'superseded'
  | 'withdrawn'

// Labels for UI display
export const WORKING_GROUP_TYPE_LABELS: Record<WorkingGroupType, { en: string; ar: string }> = {
  committee: { en: 'Committee', ar: 'لجنة' },
  task_force: { en: 'Task Force', ar: 'فريق عمل' },
  advisory_board: { en: 'Advisory Board', ar: 'مجلس استشاري' },
  technical_group: { en: 'Technical Group', ar: 'مجموعة فنية' },
  steering_committee: { en: 'Steering Committee', ar: 'لجنة توجيهية' },
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, { en: string; ar: string }> = {
  chair: { en: 'Chair', ar: 'رئيس' },
  co_chair: { en: 'Co-Chair', ar: 'رئيس مشارك' },
  vice_chair: { en: 'Vice Chair', ar: 'نائب الرئيس' },
  secretary: { en: 'Secretary', ar: 'أمين السر' },
  member: { en: 'Member', ar: 'عضو' },
  observer: { en: 'Observer', ar: 'مراقب' },
  advisor: { en: 'Advisor', ar: 'مستشار' },
  liaison: { en: 'Liaison', ar: 'ضابط اتصال' },
}

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  review: { en: 'Under Review', ar: 'قيد المراجعة' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
  deferred: { en: 'Deferred', ar: 'مؤجل' },
}

export const MEETING_FREQUENCY_LABELS: Record<MeetingFrequency, { en: string; ar: string }> = {
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  biweekly: { en: 'Bi-weekly', ar: 'كل أسبوعين' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  quarterly: { en: 'Quarterly', ar: 'ربع سنوي' },
  biannually: { en: 'Bi-annually', ar: 'نصف سنوي' },
  annually: { en: 'Annually', ar: 'سنوي' },
  as_needed: { en: 'As Needed', ar: 'حسب الحاجة' },
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface WorkingGroup {
  id: string
  // From dossiers table
  name_en: string
  name_ar: string
  summary_en?: string
  summary_ar?: string
  status: 'active' | 'inactive' | 'archived'
  sensitivity_level: 'low' | 'medium' | 'high'
  tags?: string[]
  // From working_groups extension
  wg_status: WorkingGroupStatus
  wg_type: WorkingGroupType
  mandate_en?: string
  mandate_ar?: string
  description_en?: string
  description_ar?: string
  meeting_frequency?: MeetingFrequency
  next_meeting_date?: string
  established_date?: string
  disbandment_date?: string
  // Related entities
  parent_forum_id?: string
  parent_forum_name_en?: string
  parent_forum_name_ar?: string
  lead_org_id?: string
  lead_org_name_en?: string
  lead_org_name_ar?: string
  chair_person_id?: string
  secretary_person_id?: string
  objectives?: string[]
  // Stats
  active_member_count?: number
  total_deliverables?: number
  completed_deliverables?: number
  // Audit
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface WorkingGroupMember {
  id: string
  working_group_id: string
  member_type: MemberType
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  person_id?: string
  person_name_en?: string
  person_name_ar?: string
  role: MemberRole
  status: MemberStatus
  joined_date?: string
  left_date?: string
  representing_country_id?: string
  country_name_en?: string
  country_name_ar?: string
  representing_organization_id?: string
  can_vote: boolean
  can_propose: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface WorkingGroupDeliverable {
  id: string
  working_group_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status: DeliverableStatus
  priority: DeliverablePriority
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  due_date?: string
  assigned_to_member_id?: string
  assigned_to_member_name?: string
  assigned_to_org_id?: string
  assigned_to_org_name?: string
  progress_percentage: number
  milestones?: DeliverableMilestone[]
  deliverable_type: DeliverableType
  document_url?: string
  related_commitment_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DeliverableMilestone {
  id: string
  title: string
  due_date?: string
  completed: boolean
  completed_at?: string
}

export interface WorkingGroupMeeting {
  id: string
  working_group_id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date: string
  end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  meeting_url?: string
  status: MeetingStatus
  agenda_url?: string
  minutes_url?: string
  expected_attendees?: number
  actual_attendees?: number
  attendance_record?: AttendanceRecord[]
  decisions?: string[]
  action_items?: ActionItem[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  member_id: string
  member_name: string
  attended: boolean
  represented_by?: string
  notes?: string
}

export interface ActionItem {
  id: string
  description: string
  assigned_to?: string
  due_date?: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface WorkingGroupDecision {
  id: string
  working_group_id: string
  meeting_id?: string
  decision_number?: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  decision_type: DecisionType
  status: DecisionStatus
  voting_result?: VotingResult
  requires_follow_up: boolean
  follow_up_deadline?: string
  related_deliverable_id?: string
  notes?: string
  decision_date: string
  created_at: string
  updated_at: string
}

export interface VotingResult {
  in_favor: number
  against: number
  abstained: number
  total_votes: number
  passed: boolean
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface WorkingGroupCreateRequest {
  name_en: string
  name_ar: string
  summary_en?: string
  summary_ar?: string
  sensitivity_level?: 'low' | 'medium' | 'high'
  tags?: string[]
  wg_type: WorkingGroupType
  wg_status?: WorkingGroupStatus
  mandate_en?: string
  mandate_ar?: string
  description_en?: string
  description_ar?: string
  meeting_frequency?: MeetingFrequency
  established_date?: string
  parent_forum_id?: string
  lead_org_id?: string
  chair_person_id?: string
  secretary_person_id?: string
  objectives?: string[]
}

export interface WorkingGroupUpdateRequest {
  name_en?: string
  name_ar?: string
  summary_en?: string
  summary_ar?: string
  status?: 'active' | 'inactive' | 'archived'
  sensitivity_level?: 'low' | 'medium' | 'high'
  tags?: string[]
  wg_type?: WorkingGroupType
  wg_status?: WorkingGroupStatus
  mandate_en?: string
  mandate_ar?: string
  description_en?: string
  description_ar?: string
  meeting_frequency?: MeetingFrequency
  next_meeting_date?: string
  disbandment_date?: string
  parent_forum_id?: string | null
  lead_org_id?: string | null
  chair_person_id?: string | null
  secretary_person_id?: string | null
  objectives?: string[]
}

export interface WorkingGroupMemberCreateRequest {
  member_type: MemberType
  organization_id?: string
  person_id?: string
  role: MemberRole
  status?: MemberStatus
  joined_date?: string
  representing_country_id?: string
  representing_organization_id?: string
  can_vote?: boolean
  can_propose?: boolean
  notes?: string
}

export interface WorkingGroupMemberUpdateRequest {
  role?: MemberRole
  status?: MemberStatus
  left_date?: string
  representing_country_id?: string | null
  representing_organization_id?: string | null
  can_vote?: boolean
  can_propose?: boolean
  notes?: string
}

export interface WorkingGroupDeliverableCreateRequest {
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status?: DeliverableStatus
  priority?: DeliverablePriority
  planned_start_date?: string
  planned_end_date?: string
  due_date?: string
  assigned_to_member_id?: string
  assigned_to_org_id?: string
  deliverable_type: DeliverableType
  document_url?: string
  related_commitment_id?: string
  notes?: string
}

export interface WorkingGroupDeliverableUpdateRequest {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status?: DeliverableStatus
  priority?: DeliverablePriority
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  due_date?: string
  assigned_to_member_id?: string | null
  assigned_to_org_id?: string | null
  progress_percentage?: number
  milestones?: DeliverableMilestone[]
  deliverable_type?: DeliverableType
  document_url?: string
  related_commitment_id?: string | null
  notes?: string
}

export interface WorkingGroupMeetingCreateRequest {
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date: string
  end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  agenda_url?: string
  expected_attendees?: number
  notes?: string
}

export interface WorkingGroupMeetingUpdateRequest {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  meeting_date?: string
  end_date?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean
  meeting_url?: string
  status?: MeetingStatus
  agenda_url?: string
  minutes_url?: string
  expected_attendees?: number
  actual_attendees?: number
  attendance_record?: AttendanceRecord[]
  decisions?: string[]
  action_items?: ActionItem[]
  notes?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface Pagination {
  page: number
  limit: number
  total: number | null
  totalPages: number
  has_more: boolean
}

export interface WorkingGroupListResponse {
  data: WorkingGroup[]
  pagination: Pagination
}

export interface WorkingGroupFullResponse {
  working_group: WorkingGroup
  members: WorkingGroupMember[]
  deliverables: WorkingGroupDeliverable[]
  upcoming_meetings: WorkingGroupMeeting[]
  recent_decisions: WorkingGroupDecision[]
  stats: {
    active_members: number
    total_deliverables: number
    completed_deliverables: number
    total_meetings: number
    total_decisions: number
  }
}

export interface WorkingGroupSearchParams {
  search?: string
  status?: 'active' | 'inactive' | 'archived'
  wg_type?: WorkingGroupType
  wg_status?: WorkingGroupStatus
  parent_forum_id?: string
  lead_org_id?: string
  page?: number
  limit?: number
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export interface WorkingGroupFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive' | 'archived'
  wg_status?: 'all' | WorkingGroupStatus
  wg_type?: 'all' | WorkingGroupType
  parent_forum_id?: string
  lead_org_id?: string
  page?: number
  limit?: number
}
