/**
 * Column Definitions for Unified Kanban Board
 * Feature: 034-unified-kanban
 *
 * Defines column configurations for each column mode:
 * - Status mode: Groups by workflow status
 * - Priority mode: Groups by priority level
 * - Tracking Type mode: Groups by tracking type
 *
 * Columns are neutral (bg-muted) — no per-column color coding.
 */

import type { KanbanColumn, KanbanColumnMode, WorkSource } from '@/types/work-item.types'

// ============================================
// Status Mode Columns
// ============================================

export const STATUS_COLUMNS: KanbanColumn[] = [
  {
    key: 'todo',
    title: 'To Do',
    titleAr: 'للتنفيذ',
    sortOrder: 1,
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    titleAr: 'قيد التنفيذ',
    sortOrder: 2,
  },
  {
    key: 'review',
    title: 'Review',
    titleAr: 'مراجعة',
    sortOrder: 3,
    allowedSources: ['task'],
  },
  {
    key: 'done',
    title: 'Done',
    titleAr: 'مكتمل',
    sortOrder: 4,
  },
  {
    key: 'cancelled',
    title: 'Cancelled',
    titleAr: 'ملغى',
    sortOrder: 5,
  },
]

// ============================================
// Priority Mode Columns
// ============================================

export const PRIORITY_COLUMNS: KanbanColumn[] = [
  {
    key: 'urgent',
    title: 'Urgent',
    titleAr: 'عاجل',
    sortOrder: 1,
  },
  {
    key: 'high',
    title: 'High',
    titleAr: 'عالي',
    sortOrder: 2,
  },
  {
    key: 'medium',
    title: 'Medium',
    titleAr: 'متوسط',
    sortOrder: 3,
  },
  {
    key: 'low',
    title: 'Low',
    titleAr: 'منخفض',
    sortOrder: 4,
  },
]

// ============================================
// Tracking Type Mode Columns
// ============================================

export const TRACKING_TYPE_COLUMNS: KanbanColumn[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    titleAr: 'تسليم',
    sortOrder: 1,
  },
  {
    key: 'follow_up',
    title: 'Follow-up',
    titleAr: 'متابعة',
    sortOrder: 2,
  },
  {
    key: 'sla',
    title: 'SLA',
    titleAr: 'اتفاقية الخدمة',
    sortOrder: 3,
  },
]

// ============================================
// Column Retrieval Functions
// ============================================

/**
 * Get columns for a specific mode
 */
export function getColumnsForMode(mode: KanbanColumnMode): KanbanColumn[] {
  switch (mode) {
    case 'status':
      return STATUS_COLUMNS
    case 'priority':
      return PRIORITY_COLUMNS
    case 'tracking_type':
      return TRACKING_TYPE_COLUMNS
    default:
      return STATUS_COLUMNS
  }
}

/**
 * Get column order (keys) for a specific mode
 * Optionally reverse for RTL
 */
export function getColumnOrder(mode: KanbanColumnMode, isRTL = false): string[] {
  const columns = getColumnsForMode(mode)
  // B-37: copy before sorting — getColumnsForMode returns the shared constant
  // array (STATUS_COLUMNS, …), and Array.prototype.sort mutates in place, which
  // would permanently reorder the module-level definition.
  const order = [...columns].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.key)
  return isRTL ? [...order].reverse() : order
}

/**
 * Get a specific column by key
 */
export function getColumnByKey(mode: KanbanColumnMode, key: string): KanbanColumn | undefined {
  return getColumnsForMode(mode).find((c) => c.key === key)
}

/**
 * Check if a source can appear in a column
 */
export function canSourceAppearInColumn(
  source: WorkSource,
  columnKey: string,
  mode: KanbanColumnMode,
): boolean {
  const column = getColumnByKey(mode, columnKey)
  if (!column) return false

  // If no allowedSources specified, all sources are allowed
  if (!column.allowedSources) return true

  return column.allowedSources.includes(source)
}

// ============================================
// Status Mapping Functions
// ============================================

/**
 * Valid ticket_status enum values from database
 * @see supabase/migrations/20250129001_create_intake_tickets_table.sql
 */
const VALID_TICKET_STATUSES = [
  'draft',
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'converted',
  'closed',
  'merged',
] as const

type TicketStatus = (typeof VALID_TICKET_STATUSES)[number]

/**
 * Map source-specific status to unified column key
 *
 * For intake tickets, maps ticket_status enum to kanban columns:
 * - todo: draft, submitted, triaged (pre-work states)
 * - in_progress: assigned, in_progress (active work)
 * - done: converted (successfully completed)
 * - cancelled: closed, merged (terminal non-success)
 */
export function mapStatusToColumnKey(
  source: WorkSource,
  status: string,
  workflowStage?: string | null,
): string {
  // For tasks, use workflow_stage if available
  if (source === 'task' && workflowStage) {
    // Map 'pending' workflow stage to 'todo'
    if (workflowStage === 'pending') return 'todo'
    return workflowStage
  }

  // For intake tickets, use explicit mapping based on ticket_status enum
  if (source === 'intake') {
    switch (status) {
      // Pre-work states -> todo column
      case 'draft':
      case 'submitted':
      case 'triaged':
        return 'todo'

      // Active work states -> in_progress column
      case 'assigned':
      case 'in_progress':
        return 'in_progress'

      // Successfully completed -> done column
      case 'converted':
        return 'done'

      // Terminal non-success states -> cancelled column
      case 'closed':
      case 'merged':
        return 'cancelled'

      default:
        return 'todo'
    }
  }

  // For commitments and other sources
  switch (status) {
    case 'pending':
    case 'todo':
      return 'todo'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'done':
      return 'done'
    case 'cancelled':
      return 'cancelled'
    case 'review':
      return 'review'
    default:
      return 'todo'
  }
}

/**
 * Map column key back to source-specific status
 *
 * IMPORTANT: Returns only valid database enum values
 */
export function mapColumnKeyToStatus(
  source: WorkSource,
  columnKey: string,
): { status: string; workflowStage?: string } {
  if (source === 'task') {
    // Tasks use workflow_stage directly; status is derived 1:1 where the
    // task_status enum allows (B-26 — matches the tasks-update edge fn so the
    // enum's 'pending'/'review' values are actually written, not collapsed).
    const STAGE_TO_STATUS: Record<string, string> = {
      todo: 'pending',
      in_progress: 'in_progress',
      review: 'review',
      done: 'completed',
      cancelled: 'cancelled',
    }
    return {
      status: STAGE_TO_STATUS[columnKey] ?? 'in_progress',
      workflowStage: columnKey,
    }
  }

  if (source === 'commitment') {
    // Commitments: pending, in_progress, completed, cancelled
    switch (columnKey) {
      case 'todo':
        return { status: 'pending' }
      case 'in_progress':
        return { status: 'in_progress' }
      case 'done':
        return { status: 'completed' }
      case 'cancelled':
        return { status: 'cancelled' }
      default:
        return { status: 'pending' }
    }
  }

  if (source === 'intake') {
    // FIXED: Use valid ticket_status enum values
    // Enum: draft, submitted, triaged, assigned, in_progress, converted, closed, merged
    let status: TicketStatus

    switch (columnKey) {
      case 'todo':
        // Default to 'submitted' - neutral pre-work state
        status = 'submitted'
        break
      case 'in_progress':
        status = 'in_progress'
        break
      case 'done':
        // FIXED: 'converted' is the valid status, not 'resolved'
        status = 'converted'
        break
      case 'cancelled':
        status = 'closed'
        break
      default:
        status = 'submitted'
    }

    return { status }
  }

  return { status: columnKey }
}

// ============================================
// Visual Helpers
// ============================================

/**
 * Get badge color classes for a source type (border-based outline style)
 * D-07 collision: task=accent (was blue), commitment=secondary (was purple), intake=warning (was amber)
 */
export function getSourceBadgeColors(source: WorkSource): string {
  switch (source) {
    case 'task':
      return 'border-accent/30 text-accent dark:border-accent/70'
    case 'commitment':
      return 'border-secondary/30 text-secondary-foreground dark:border-secondary/70'
    case 'intake':
      return 'border-warning/30 text-warning dark:border-warning/70'
    default:
      return 'border-muted/30 text-muted-foreground dark:border-muted/70'
  }
}

/**
 * Get priority indicator dot color
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-danger'
    case 'high':
      return 'bg-warning'
    case 'medium':
      return 'bg-warning/60'
    case 'low':
      return 'bg-muted-foreground/60'
    default:
      return 'bg-muted'
  }
}
