/**
 * Column Definitions for Unified Kanban Board
 * Feature: 034-unified-kanban
 *
 * Defines column configurations for each column mode:
 * - Status mode: Groups by workflow status
 * - Priority mode: Groups by priority level
 * - Tracking Type mode: Groups by tracking type
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
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    sortOrder: 1,
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    titleAr: 'قيد التنفيذ',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    sortOrder: 2,
  },
  {
    key: 'review',
    title: 'Review',
    titleAr: 'مراجعة',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    sortOrder: 3,
    allowedSources: ['task'],
  },
  {
    key: 'done',
    title: 'Done',
    titleAr: 'مكتمل',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    sortOrder: 4,
  },
  {
    key: 'cancelled',
    title: 'Cancelled',
    titleAr: 'ملغى',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
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
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    sortOrder: 1,
  },
  {
    key: 'high',
    title: 'High',
    titleAr: 'عالي',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    sortOrder: 2,
  },
  {
    key: 'medium',
    title: 'Medium',
    titleAr: 'متوسط',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    sortOrder: 3,
  },
  {
    key: 'low',
    title: 'Low',
    titleAr: 'منخفض',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
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
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    sortOrder: 1,
  },
  {
    key: 'follow_up',
    title: 'Follow-up',
    titleAr: 'متابعة',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    sortOrder: 2,
  },
  {
    key: 'sla',
    title: 'SLA',
    titleAr: 'اتفاقية الخدمة',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
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
  const order = columns.sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.key)
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
 * Map source-specific status to unified column key
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

  // Map commitment/intake statuses to column keys
  switch (status) {
    case 'pending':
    case 'todo':
      return 'todo'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'resolved':
    case 'closed':
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
 */
export function mapColumnKeyToStatus(
  source: WorkSource,
  columnKey: string,
): { status: string; workflowStage?: string } {
  if (source === 'task') {
    // Tasks use workflow_stage directly
    return {
      status:
        columnKey === 'done'
          ? 'completed'
          : columnKey === 'cancelled'
            ? 'cancelled'
            : 'in_progress',
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
    // Intake: pending, in_progress, resolved, closed
    switch (columnKey) {
      case 'todo':
        return { status: 'pending' }
      case 'in_progress':
        return { status: 'in_progress' }
      case 'done':
        return { status: 'resolved' }
      case 'cancelled':
        return { status: 'closed' }
      default:
        return { status: 'pending' }
    }
  }

  return { status: columnKey }
}

// ============================================
// Visual Helpers
// ============================================

/**
 * Get badge color classes for a source type
 */
export function getSourceBadgeColors(source: WorkSource): { bg: string; text: string } {
  switch (source) {
    case 'task':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'commitment':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    case 'intake':
      return { bg: 'bg-amber-100', text: 'text-amber-700' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' }
  }
}

/**
 * Get priority indicator color
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-slate-400'
    default:
      return 'bg-slate-300'
  }
}
