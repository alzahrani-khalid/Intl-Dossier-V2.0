/**
 * Work Item Types - Central Type Definitions
 * Feature: 034-unified-kanban
 *
 * Single source of truth for work item types used across:
 * - Unified Kanban board
 * - My Work dashboard
 * - Work item mutations
 * - API responses
 */

// ============================================
// Enum Constants (Single Source of Truth)
// ============================================

export const WORK_SOURCES = ['commitment', 'task', 'intake'] as const
export type WorkSource = (typeof WORK_SOURCES)[number]

export const WORK_STATUSES = ['pending', 'in_progress', 'review', 'completed', 'cancelled'] as const
export type WorkStatus = (typeof WORK_STATUSES)[number]

export const TRACKING_TYPES = ['delivery', 'follow_up', 'sla'] as const
export type TrackingType = (typeof TRACKING_TYPES)[number]

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const WORKFLOW_STAGES = ['todo', 'in_progress', 'review', 'done', 'cancelled'] as const
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number]

// ============================================
// Kanban-Specific Types
// ============================================

export const KANBAN_CONTEXT_TYPES = ['personal', 'dossier', 'engagement'] as const
export type KanbanContextType = (typeof KANBAN_CONTEXT_TYPES)[number]

export const KANBAN_COLUMN_MODES = ['status', 'priority', 'tracking_type'] as const
export type KanbanColumnMode = (typeof KANBAN_COLUMN_MODES)[number]

// ============================================
// Core Work Item Interface
// ============================================

/**
 * Assignee information for a work item
 */
export interface WorkItemAssignee {
  id: string
  name: string
  name_ar?: string
  avatar_url: string | null
  email?: string
}

/**
 * Central WorkItem shape - matches RPC/Edge response
 */
export interface WorkItem {
  id: string
  source: WorkSource
  title: string
  title_ar?: string
  description: string | null
  priority: Priority
  status: WorkStatus
  workflow_stage: WorkflowStage | null // Tasks only
  column_key: string // Computed for current column mode
  tracking_type: TrackingType
  deadline: string | null
  is_overdue: boolean
  days_until_due: number | null
  assignee: WorkItemAssignee | null
  dossier_id: string | null
  engagement_id: string | null
  created_at: string
  updated_at: string
  metadata: WorkItemMetadata
}

/**
 * Source-specific metadata
 */
export interface WorkItemMetadata {
  // Commitment-specific
  proof_required?: boolean
  proof_url?: string | null
  evidence_submitted_at?: string | null
  tracking_mode?: string
  after_action_id?: string | null

  // Task-specific
  type?: string
  engagement_id?: string | null
  work_item_type?: string | null
  work_item_id?: string | null

  // Intake-specific
  ticket_number?: string
  request_type?: string
  urgency?: string
  sensitivity?: string
  assigned_unit?: string | null
}

// ============================================
// Kanban Column Types
// ============================================

/**
 * Column definition for Kanban board
 */
export interface KanbanColumn {
  key: string
  title: string
  titleAr: string
  color: string
  bgColor: string
  sortOrder: number
  allowedSources?: WorkSource[] // Which sources can appear in this column
}

/**
 * Kanban board data structure
 */
export interface KanbanData {
  columns: Record<string, WorkItem[]>
  columnOrder: string[]
  totalCount: number
  hasMore: Record<string, boolean>
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Request parameters for fetching Kanban data
 */
export interface KanbanRequest {
  action: 'list' | 'update-status'

  // For 'list' action
  context_type?: KanbanContextType
  context_id?: string
  column_mode?: KanbanColumnMode
  source_filter?: WorkSource[]
  limit_per_column?: number // default 50

  // For 'update-status' action
  item_id?: string
  source?: WorkSource
  new_status?: WorkStatus
  new_workflow_stage?: WorkflowStage
}

/**
 * Successful list response
 */
export interface KanbanListResponse {
  success: true
  data: {
    columns: Record<string, WorkItem[]>
    column_counts: Record<string, number>
    total_count: number
    has_more: Record<string, boolean>
  }
}

/**
 * Successful update response
 */
export interface KanbanUpdateResponse {
  success: true
  data: {
    item: WorkItem
    previous_column: string
    new_column: string
  }
}

/**
 * Error codes for Kanban operations
 */
export type KanbanErrorCode =
  | 'INVALID_TRANSITION'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'

/**
 * Error response
 */
export interface KanbanErrorResponse {
  success: false
  error: {
    code: KanbanErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

export type KanbanResponse = KanbanListResponse | KanbanUpdateResponse | KanbanErrorResponse

// ============================================
// Status Transition Types
// ============================================

/**
 * Valid status transitions per source type
 */
export interface StatusTransitionRules {
  task: Record<WorkflowStage, WorkflowStage[]>
  commitment: Record<WorkStatus, WorkStatus[]>
  intake: Record<string, string[]>
}

/**
 * Status update mutation variables
 */
export interface StatusUpdateVariables {
  itemId: string
  source: WorkSource
  newStatus: string
  newWorkflowStage?: WorkflowStage
}

// ============================================
// Filter & Sort Types
// ============================================

/**
 * Filter state for Kanban board
 */
export interface KanbanFilters {
  sources?: WorkSource[]
  statuses?: string[]
  priorities?: Priority[]
  isOverdue?: boolean
  searchQuery?: string
}

/**
 * Sort options
 */
export type KanbanSortBy = 'deadline' | 'created_at' | 'priority'
export type SortOrder = 'asc' | 'desc'

/**
 * URL state for Kanban board
 */
export interface KanbanUrlState {
  mode?: KanbanColumnMode
  sources?: WorkSource[]
  search?: string
  sortBy?: KanbanSortBy
  sortOrder?: SortOrder
}

// ============================================
// Realtime Event Types
// ============================================

/**
 * Realtime event for work item changes
 */
export type WorkItemRealtimeEvent =
  | { type: 'INSERT'; payload: WorkItem }
  | { type: 'UPDATE'; payload: Partial<WorkItem> & { id: string } }
  | { type: 'DELETE'; payload: { id: string } }

// ============================================
// Swimlane Types
// ============================================

export const SWIMLANE_MODES = ['none', 'assignee', 'priority'] as const
export type SwimlaneMode = (typeof SWIMLANE_MODES)[number]

/**
 * Swimlane definition
 */
export interface Swimlane {
  id: string
  title: string
  titleAr?: string
  items: WorkItem[]
  collapsed?: boolean
}

/**
 * WIP (Work In Progress) limits per column
 */
export interface WipLimits {
  [columnKey: string]: number
}

/**
 * Default WIP limits
 */
export const DEFAULT_WIP_LIMITS: WipLimits = {
  in_progress: 5,
  review: 3,
}

// ============================================
// Bulk Operations Types
// ============================================

/**
 * Bulk action types
 */
export type BulkActionType = 'move' | 'assign' | 'delete' | 'updatePriority'

/**
 * Bulk operation payload
 */
export interface BulkOperationPayload {
  itemIds: string[]
  action: BulkActionType
  targetValue?: string // column key, assignee id, priority, etc.
}

/**
 * Selected items state
 */
export interface SelectionState {
  selectedIds: Set<string>
  isSelecting: boolean
  lastSelectedId: string | null
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props for UnifiedKanbanBoard component
 */
export interface UnifiedKanbanBoardProps {
  contextType: KanbanContextType
  contextId?: string
  columnMode?: KanbanColumnMode
  sourceFilter?: WorkSource[]
  showFilters?: boolean
  showModeSwitch?: boolean
  onItemClick?: (item: WorkItem) => void
  className?: string
  // Enhanced features
  swimlaneMode?: SwimlaneMode
  wipLimits?: WipLimits
  enableBulkOperations?: boolean
  enableWipWarnings?: boolean
}

/**
 * Props for UnifiedKanbanColumn component
 */
export interface UnifiedKanbanColumnProps {
  column: KanbanColumn
  items: WorkItem[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

/**
 * Props for UnifiedKanbanCard component
 */
export interface UnifiedKanbanCardProps {
  item: WorkItem
  isDragging?: boolean
  onClick?: (item: WorkItem) => void
}

// ============================================
// Utility Types
// ============================================

/**
 * Map source to its primary status field
 */
export type SourceStatusField = {
  task: 'workflow_stage'
  commitment: 'status'
  intake: 'status'
}

/**
 * Get the status type for a given source
 */
export type StatusForSource<S extends WorkSource> = S extends 'task'
  ? WorkflowStage
  : S extends 'commitment'
    ? WorkStatus
    : string
