/**
 * Unified Kanban Utilities (legacy components removed in Phase 39 / Plan 09)
 *
 * The legacy unified-kanban React components (UnifiedKanbanBoard, EnhancedKanbanBoard,
 * UnifiedKanbanColumn, UnifiedKanbanCard, UnifiedKanbanHeader, swimlane-utils, wip-limits)
 * were superseded by the Phase 39 WorkBoard pipeline at frontend/src/pages/WorkBoard/.
 * Only column-definitions and status-transitions utility re-exports remain — they are
 * still consumed by useUnifiedKanban hooks and other downstream code.
 */

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
