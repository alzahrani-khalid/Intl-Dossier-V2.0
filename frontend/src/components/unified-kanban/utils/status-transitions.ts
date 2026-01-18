/**
 * Status Transition Rules for Unified Kanban Board
 * Feature: 034-unified-kanban
 *
 * Defines valid status transitions per source type.
 * Used to validate drag-and-drop operations before allowing them.
 *
 * IMPORTANT: Status values must match database enum definitions:
 * - task_status: pending, in_progress, completed, cancelled
 * - ticket_status: draft, submitted, triaged, assigned, in_progress, converted, closed, merged
 * - commitment status: pending, in_progress, completed, cancelled, overdue
 */

import type { WorkSource, WorkflowStage } from '@/types/work-item.types'

// ============================================
// Valid Status Constants (match DB enums)
// ============================================

/**
 * Valid ticket_status enum values from database
 * @see supabase/migrations/20250129001_create_intake_tickets_table.sql
 */
export const VALID_TICKET_STATUSES = [
  'draft',
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'converted',
  'closed',
  'merged',
] as const

export type TicketStatus = (typeof VALID_TICKET_STATUSES)[number]

// ============================================
// Transition Rules
// ============================================

/**
 * Valid workflow stage transitions for Tasks
 * Tasks use workflow_stage: todo, in_progress, review, done, cancelled
 */
export const TASK_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['todo', 'review', 'done', 'cancelled'],
  review: ['in_progress', 'done', 'cancelled'],
  done: [], // Terminal state
  cancelled: [], // Terminal state
}

/**
 * Valid status transitions for Commitments
 * Commitments use status: pending, in_progress, completed, cancelled, overdue
 * Note: 'overdue' is a special status that indicates past deadline but still active
 */
export const COMMITMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['pending', 'completed', 'cancelled'],
  overdue: ['in_progress', 'completed', 'cancelled'], // Overdue items can be worked on or resolved
  review: [], // Commitments don't use review
  completed: [], // Terminal state
  cancelled: [], // Terminal state
}

/**
 * Valid status transitions for Intake Tickets
 * FIXED: Uses actual ticket_status enum values from database
 *
 * Ticket lifecycle: draft → submitted → triaged → assigned → in_progress → converted/closed
 *
 * Kanban column mapping:
 * - 'todo' column: draft, submitted, triaged (pre-work states)
 * - 'in_progress' column: assigned, in_progress (active work)
 * - 'done' column: converted (successfully completed)
 * - 'cancelled' column: closed, merged (terminal non-success)
 *
 * Note: Transitions are limited in kanban context - not all DB transitions
 * are appropriate for drag-and-drop (e.g., cannot drag to 'draft' or 'triaged')
 */
export const INTAKE_TRANSITIONS: Record<string, string[]> = {
  // Pre-work states (todo column)
  draft: ['closed'], // Can only close from draft
  submitted: ['assigned', 'in_progress', 'closed'], // Triage then assign or close
  triaged: ['assigned', 'in_progress', 'closed'], // Assign or close

  // Active work states (in_progress column)
  assigned: ['in_progress', 'converted', 'closed'], // Start work, complete, or close
  in_progress: ['converted', 'closed'], // Complete or close

  // Terminal states - cannot transition further
  converted: [], // Successfully completed
  closed: [], // Explicitly closed
  merged: [], // Merged into another ticket
}

// ============================================
// Validation Functions
// ============================================

/**
 * Check if a status transition is valid for a given source
 */
export function isValidTransition(
  source: WorkSource,
  fromStatus: string,
  toStatus: string,
): boolean {
  if (fromStatus === toStatus) return false // Same status, no transition

  switch (source) {
    case 'task':
      return (
        TASK_TRANSITIONS[fromStatus as WorkflowStage]?.includes(toStatus as WorkflowStage) ?? false
      )
    case 'commitment':
      // Commitment transitions include 'overdue' which is not in WorkStatus
      return COMMITMENT_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false
    case 'intake':
      return INTAKE_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false
    default:
      return false
  }
}

/**
 * Get valid target statuses for a given source and current status
 */
export function getValidTargetStatuses(source: WorkSource, currentStatus: string): string[] {
  switch (source) {
    case 'task':
      return TASK_TRANSITIONS[currentStatus as WorkflowStage] ?? []
    case 'commitment':
      // Commitment transitions include 'overdue' which is not in WorkStatus
      return COMMITMENT_TRANSITIONS[currentStatus] ?? []
    case 'intake':
      return INTAKE_TRANSITIONS[currentStatus] ?? []
    default:
      return []
  }
}

/**
 * Check if a status is a terminal state (no further transitions allowed)
 */
export function isTerminalStatus(source: WorkSource, status: string): boolean {
  const validTargets = getValidTargetStatuses(source, status)
  return validTargets.length === 0
}

// ============================================
// Column Key Mapping
// ============================================

/**
 * Map kanban column key to source-specific status
 * Used when dropping an item into a column
 *
 * IMPORTANT: Returns valid database enum values only
 */
export function columnKeyToSourceStatus(source: WorkSource, columnKey: string): string {
  // For tasks, column keys map directly to workflow stages
  if (source === 'task') {
    return columnKey
  }

  // For commitments, map column keys to commitment statuses
  if (source === 'commitment') {
    switch (columnKey) {
      case 'todo':
        return 'pending'
      case 'in_progress':
        return 'in_progress'
      case 'done':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'pending'
    }
  }

  // For intake, map column keys to valid ticket_status enum values
  // FIXED: Uses actual DB enum values (not 'resolved' or 'pending')
  if (source === 'intake') {
    switch (columnKey) {
      case 'todo':
        // Default to 'submitted' for todo column
        // Note: 'draft' and 'triaged' also map to todo, but we can't
        // drag INTO those states (they're workflow-driven)
        return 'submitted'
      case 'in_progress':
        return 'in_progress'
      case 'done':
        // FIXED: 'converted' is the valid DB status, not 'resolved'
        return 'converted'
      case 'cancelled':
        return 'closed'
      default:
        return 'submitted'
    }
  }

  return columnKey
}

/**
 * Map source-specific status to kanban column key
 * Used when determining which column an item belongs to
 *
 * For intake tickets, maps all ticket_status values to appropriate columns:
 * - todo: draft, submitted, triaged (pre-work states)
 * - in_progress: assigned, in_progress (active work)
 * - done: converted (successfully completed)
 * - cancelled: closed, merged (terminal non-success)
 */
export function sourceStatusToColumnKey(
  source: WorkSource,
  status: string,
  workflowStage?: string | null,
): string {
  // For tasks, use workflow_stage directly
  if (source === 'task' && workflowStage) {
    // Map 'pending' workflow stage to 'todo' column
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
  // Map completion statuses to 'done' column
  if (['completed', 'done'].includes(status)) {
    return 'done'
  }

  // Map closed/cancelled statuses
  if (['cancelled', 'closed'].includes(status)) {
    return 'cancelled'
  }

  // Map pending and overdue to 'todo' column
  if (status === 'pending' || status === 'overdue') {
    return 'todo'
  }

  // Other statuses map directly
  return status
}

// ============================================
// Validation with Kanban Column Keys
// ============================================

/**
 * Check if dragging an item to a target column is valid
 * This considers the column key mapping
 */
export function canDropInColumn(
  source: WorkSource,
  currentStatus: string,
  currentWorkflowStage: string | null,
  targetColumnKey: string,
): boolean {
  // Get the current column key for the item
  const currentColumnKey = sourceStatusToColumnKey(source, currentStatus, currentWorkflowStage)

  // Same column, no action needed
  if (currentColumnKey === targetColumnKey) {
    return false
  }

  // Get the target status for this source
  const targetStatus = columnKeyToSourceStatus(source, targetColumnKey)

  // For tasks, validate workflow stage transitions
  if (source === 'task') {
    const currentStage = currentWorkflowStage || currentColumnKey
    return isValidTransition('task', currentStage, targetColumnKey)
  }

  // For other sources, validate status transitions
  return isValidTransition(source, currentStatus, targetStatus)
}

/**
 * Get the appropriate status/stage values for updating an item
 * after it's dropped in a target column
 *
 * IMPORTANT: Returns only valid database enum values
 * - For tasks: workflow_stage and derived status
 * - For commitments: commitment status
 * - For intake: ticket_status enum value
 */
export function getUpdatePayload(
  source: WorkSource,
  targetColumnKey: string,
): {
  status?: string
  workflow_stage?: string
} {
  if (source === 'task') {
    // Tasks update workflow_stage and derive status
    const workflowStage = targetColumnKey
    let status: string

    switch (workflowStage) {
      case 'done':
        status = 'completed'
        break
      case 'cancelled':
        status = 'cancelled'
        break
      default:
        status = 'in_progress'
    }

    return { status, workflow_stage: workflowStage }
  }

  if (source === 'intake') {
    // FIXED: Map to valid ticket_status enum values
    let status: TicketStatus

    switch (targetColumnKey) {
      case 'todo':
        // Cannot really drag TO todo for intake - this shouldn't happen
        // but if it does, keep as 'submitted' (neutral pre-work state)
        status = 'submitted'
        break
      case 'in_progress':
        status = 'in_progress'
        break
      case 'done':
        // FIXED: Use 'converted' instead of 'resolved'
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

  // Commitments use columnKeyToSourceStatus mapping
  const status = columnKeyToSourceStatus(source, targetColumnKey)
  return { status }
}

// ============================================
// Error Messages
// ============================================

/**
 * Get user-friendly error message for invalid transition
 */
export function getTransitionErrorMessage(
  source: WorkSource,
  fromStatus: string,
  toStatus: string,
  language: 'en' | 'ar' = 'en',
): string {
  const messages = {
    en: {
      terminal: `Items in "${fromStatus}" status cannot be moved`,
      invalid: `Cannot move from "${fromStatus}" to "${toStatus}"`,
      task_done: 'Completed tasks cannot be moved',
      commitment_complete: 'Completed commitments cannot be changed',
      intake_converted: 'Converted tickets cannot be changed',
      intake_closed: 'Closed tickets cannot be reopened',
      intake_merged: 'Merged tickets cannot be changed',
    },
    ar: {
      terminal: `لا يمكن نقل العناصر في حالة "${fromStatus}"`,
      invalid: `لا يمكن النقل من "${fromStatus}" إلى "${toStatus}"`,
      task_done: 'لا يمكن نقل المهام المكتملة',
      commitment_complete: 'لا يمكن تغيير الالتزامات المكتملة',
      intake_converted: 'لا يمكن تغيير التذاكر المحولة',
      intake_closed: 'لا يمكن إعادة فتح التذاكر المغلقة',
      intake_merged: 'لا يمكن تغيير التذاكر المدمجة',
    },
  }

  const msg = messages[language]

  if (isTerminalStatus(source, fromStatus)) {
    if (source === 'task' && fromStatus === 'done') return msg.task_done
    if (source === 'commitment' && fromStatus === 'completed') return msg.commitment_complete
    if (source === 'intake') {
      if (fromStatus === 'converted') return msg.intake_converted
      if (fromStatus === 'closed') return msg.intake_closed
      if (fromStatus === 'merged') return msg.intake_merged
    }
    return msg.terminal
  }

  return msg.invalid
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validates if a status is a valid ticket_status enum value
 */
export function isValidTicketStatus(status: string): status is TicketStatus {
  return VALID_TICKET_STATUSES.includes(status as TicketStatus)
}
