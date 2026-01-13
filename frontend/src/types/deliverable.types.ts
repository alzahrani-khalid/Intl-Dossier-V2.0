/**
 * Deliverable Types
 * Feature: commitment-deliverables
 *
 * TypeScript interfaces for MoU deliverable management with milestones,
 * status tracking, health scoring, and document linkage.
 */

/**
 * Deliverable status values
 * Note: 'delayed' is auto-applied by the backend when due_date is past
 */
export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'cancelled'
  | 'not_started'
  | 'at_risk'

/**
 * Deliverable priority levels
 */
export type DeliverablePriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Milestone status values
 */
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

/**
 * Responsible party type
 */
export type ResponsiblePartyType = 'internal' | 'external'

/**
 * Full deliverable entity from mou_deliverables table
 */
export interface Deliverable {
  id: string
  mou_id: string

  // Core fields (bilingual)
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null

  // Tracking fields
  status: DeliverableStatus
  priority: DeliverablePriority
  progress: number

  // Dates
  due_date: string
  started_at: string | null
  completed_at: string | null

  // Responsible party
  responsible_party_type: ResponsiblePartyType
  responsible_user_id: string | null
  responsible_contact_name: string | null
  responsible_contact_email: string | null

  // Health scoring
  health_score: number | null
  last_health_calculation: string | null

  // Notes
  notes: string | null
  completion_notes: string | null

  // Sort order
  sort_order: number

  // Audit fields
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Deliverable with computed properties for UI display
 */
export interface DeliverableWithComputedProps extends Deliverable {
  isOverdue: boolean
  daysOverdue: number
  daysUntilDue: number
  responsibleName?: string
  mouTitle?: string
  milestoneCount?: number
  completedMilestoneCount?: number
}

/**
 * Deliverable with joined relations
 */
export interface DeliverableWithRelations extends Deliverable {
  mou?: {
    id: string
    title: string
    title_ar: string
    reference_number: string
  }
  responsible_user?: {
    id: string
    full_name: string
    email: string
  }
  milestones?: Milestone[]
  documents?: DeliverableDocument[]
}

/**
 * Milestone entity from deliverable_milestones table
 */
export interface Milestone {
  id: string
  deliverable_id: string

  // Core fields (bilingual)
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null

  // Tracking
  status: MilestoneStatus
  due_date: string | null
  completed_at: string | null

  // Weight for progress calculation
  weight: number

  // Sort order
  sort_order: number

  // Audit
  created_at: string
  updated_at: string | null
}

/**
 * Deliverable status history entry for audit trail
 */
export interface DeliverableStatusHistory {
  id: string
  deliverable_id: string
  old_status: DeliverableStatus | null
  new_status: DeliverableStatus
  old_progress: number | null
  new_progress: number | null
  changed_by: string
  changed_at: string
  notes: string | null

  // Joined data for display
  changed_by_name?: string
}

/**
 * Deliverable document entity
 */
export interface DeliverableDocument {
  id: string
  deliverable_id: string
  document_url: string
  document_name: string
  file_size_bytes: number
  mime_type: string
  uploaded_by: string
  uploaded_at: string
  description: string | null

  // Joined data for display
  uploaded_by_name?: string
}

/**
 * Filter parameters for deliverable queries
 */
export interface DeliverableFilters {
  // Entity filters
  mouId?: string
  responsibleUserId?: string
  responsiblePartyType?: ResponsiblePartyType

  // Status filters
  status?: DeliverableStatus[]
  priority?: DeliverablePriority[]
  overdue?: boolean

  // Health filters
  healthScoreMin?: number
  healthScoreMax?: number

  // Date range filters
  dueDateFrom?: string
  dueDateTo?: string

  // Search
  search?: string
}

/**
 * Pagination cursor for infinite scroll
 */
export interface DeliverablePaginationCursor {
  due_date: string
  id: string
}

/**
 * Paginated response for deliverable list
 */
export interface DeliverablesListResponse {
  deliverables: DeliverableWithRelations[]
  totalCount: number
  nextCursor: DeliverablePaginationCursor | null
  hasMore: boolean
}

/**
 * Input for creating a new deliverable
 */
export interface CreateDeliverableInput {
  mou_id: string

  // Required fields
  title_en: string
  title_ar: string
  due_date: string
  responsible_party_type: ResponsiblePartyType

  // Optional fields
  description_en?: string | null
  description_ar?: string | null
  priority?: DeliverablePriority
  status?: DeliverableStatus
  notes?: string | null

  // Responsible party (one of these based on responsible_party_type)
  responsible_user_id?: string | null
  responsible_contact_name?: string | null
  responsible_contact_email?: string | null

  // Sort order
  sort_order?: number
}

/**
 * Input for updating an existing deliverable
 */
export interface UpdateDeliverableInput {
  title_en?: string
  title_ar?: string
  description_en?: string | null
  description_ar?: string | null
  due_date?: string
  priority?: DeliverablePriority
  status?: DeliverableStatus
  progress?: number
  responsible_party_type?: ResponsiblePartyType
  responsible_user_id?: string | null
  responsible_contact_name?: string | null
  responsible_contact_email?: string | null
  notes?: string | null
  completion_notes?: string | null
  sort_order?: number
}

/**
 * Input for creating a new milestone
 */
export interface CreateMilestoneInput {
  deliverable_id: string

  // Required fields
  title_en: string
  title_ar: string

  // Optional fields
  description_en?: string | null
  description_ar?: string | null
  due_date?: string | null
  weight?: number
  sort_order?: number
}

/**
 * Input for updating a milestone
 */
export interface UpdateMilestoneInput {
  title_en?: string
  title_ar?: string
  description_en?: string | null
  description_ar?: string | null
  status?: MilestoneStatus
  due_date?: string | null
  weight?: number
  sort_order?: number
}

/**
 * Input for bulk status update
 */
export interface BulkStatusUpdateInput {
  deliverable_ids: string[]
  status: DeliverableStatus
  notes?: string
}

/**
 * Response from bulk status update
 */
export interface BulkStatusUpdateResponse {
  updated_count: number
  failed_ids: string[]
}

/**
 * MoU deliverables health summary
 */
export interface MouDeliverablesHealth {
  total_deliverables: number
  completed_count: number
  delayed_count: number
  on_track_count: number
  avg_progress: number
  avg_health_score: number
  overall_health_score: number | null
}

/**
 * Document upload input
 */
export interface UploadDeliverableDocumentInput {
  deliverable_id: string
  file: File
  description?: string
}

/**
 * Document upload response
 */
export interface UploadDeliverableDocumentResponse {
  id: string
  document_url: string
  document_name: string
  file_size_bytes: number
  mime_type: string
  uploaded_at: string
}

/**
 * TanStack Query key factory for deliverable queries
 */
export const deliverableKeys = {
  all: ['deliverables'] as const,
  lists: () => [...deliverableKeys.all, 'list'] as const,
  list: (filters?: DeliverableFilters) => [...deliverableKeys.lists(), filters] as const,
  byMou: (mouId: string) => [...deliverableKeys.all, 'mou', mouId] as const,
  details: () => [...deliverableKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliverableKeys.details(), id] as const,
  milestones: (deliverableId: string) =>
    [...deliverableKeys.all, 'milestones', deliverableId] as const,
  history: (deliverableId: string) => [...deliverableKeys.all, 'history', deliverableId] as const,
  documents: (deliverableId: string) =>
    [...deliverableKeys.all, 'documents', deliverableId] as const,
  health: (mouId: string) => [...deliverableKeys.all, 'health', mouId] as const,
}

/**
 * Valid status transitions for deliverables
 */
export const VALID_DELIVERABLE_STATUS_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> =
  {
    pending: ['in_progress', 'cancelled'],
    not_started: ['in_progress', 'cancelled'],
    in_progress: ['pending', 'completed', 'cancelled', 'at_risk'],
    at_risk: ['in_progress', 'completed', 'cancelled', 'delayed'],
    delayed: ['in_progress', 'completed', 'cancelled'],
    completed: [], // Cannot change without admin
    cancelled: [], // Cannot change
  }

/**
 * Check if a status transition is valid
 */
export function isValidDeliverableStatusTransition(
  from: DeliverableStatus,
  to: DeliverableStatus,
): boolean {
  return VALID_DELIVERABLE_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Status color mapping for UI
 */
export const DELIVERABLE_STATUS_COLORS: Record<
  DeliverableStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  not_started: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  in_progress: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  at_risk: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  delayed: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  cancelled: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800',
  },
}

/**
 * Priority color mapping for UI
 */
export const DELIVERABLE_PRIORITY_COLORS: Record<
  DeliverablePriority,
  { bg: string; text: string }
> = {
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

/**
 * Milestone status color mapping
 */
export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  skipped: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-500 dark:text-gray-400',
  },
}

/**
 * Health score color thresholds
 */
export function getHealthScoreColor(score: number | null): { bg: string; text: string } {
  if (score === null) {
    return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-500 dark:text-gray-400' }
  }
  if (score >= 80) {
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' }
  }
  if (score >= 60) {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
    }
  }
  if (score >= 40) {
    return {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
    }
  }
  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' }
}

/**
 * Allowed file types for document upload
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

/**
 * Maximum document file size in bytes (50MB)
 */
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20
