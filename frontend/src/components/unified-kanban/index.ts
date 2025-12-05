/**
 * Unified Kanban Components
 * Feature: 034-unified-kanban
 *
 * Barrel exports for all unified kanban components and utilities
 */

// Main components
export { UnifiedKanbanBoard } from './UnifiedKanbanBoard'
export { UnifiedKanbanColumn, UnifiedKanbanColumnSkeleton } from './UnifiedKanbanColumn'
export { UnifiedKanbanCard, UnifiedKanbanCardSkeleton } from './UnifiedKanbanCard'
export { UnifiedKanbanHeader } from './UnifiedKanbanHeader'

// Utilities
export {
  getColumnsForMode,
  getColumnOrder,
  getColumnByKey,
  canSourceAppearInColumn,
  mapStatusToColumnKey,
  mapColumnKeyToStatus,
  getSourceBadgeColors,
  getPriorityColor,
  STATUS_COLUMNS,
  PRIORITY_COLUMNS,
  TRACKING_TYPE_COLUMNS,
} from './utils/column-definitions'

export {
  isValidTransition,
  getValidTargetStatuses,
  isTerminalStatus,
  columnKeyToSourceStatus,
  sourceStatusToColumnKey,
  canDropInColumn,
  getUpdatePayload,
  getTransitionErrorMessage,
  TASK_TRANSITIONS,
  COMMITMENT_TRANSITIONS,
  INTAKE_TRANSITIONS,
} from './utils/status-transitions'
