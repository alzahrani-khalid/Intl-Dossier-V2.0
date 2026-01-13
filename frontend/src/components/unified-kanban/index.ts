/**
 * Unified Kanban Components
 * Feature: 034-unified-kanban + kanban-task-board
 *
 * Barrel exports for all unified kanban components and utilities
 */

// Main components
export { UnifiedKanbanBoard } from './UnifiedKanbanBoard'
export { EnhancedKanbanBoard } from './EnhancedKanbanBoard'
export { UnifiedKanbanColumn, UnifiedKanbanColumnSkeleton } from './UnifiedKanbanColumn'
export { UnifiedKanbanCard, UnifiedKanbanCardSkeleton } from './UnifiedKanbanCard'
export { UnifiedKanbanHeader } from './UnifiedKanbanHeader'

// Column definition utilities
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

// Status transition utilities
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

// Swimlane utilities
export {
  groupIntoSwimlanes,
  getSwimlanColumnItems,
  getSwimlaneColor,
  getSwimlaneBackground,
} from './utils/swimlane-utils'

// WIP limit utilities
export {
  checkWipLimit,
  wouldExceedWipLimit,
  getWipWarningLevel,
  getWipIndicatorColor,
  getWipProgressColor,
  calculateColumnWipStats,
  getColumnsOverWip,
  type WipStatus,
  type WipWarningLevel,
} from './utils/wip-limits'
