/**
 * Feature 032: Unified Work Management Types
 *
 * Re-exports from the canonical work-item.types.ts.
 * This file exists for backward compatibility with 13+ consumer files.
 */

export type {
  WorkSource,
  TrackingType,
  UnifiedWorkStatus as WorkItemStatus,
  Priority as WorkItemPriority,
  UnifiedWorkItem,
  WorkItemMetadata,
  UserWorkSummary,
  UserProductivityMetrics,
  TeamMemberWorkload,
  UnifiedWorkItemFilters as WorkItemFilters,
  WorkItemCursor,
  PaginatedWorkItems,
  WorkItemSortBy,
  SortOrder,
  WorkItemQueryParams,
  MyWorkUrlState,
  WorkItemRealtimeEvent,
} from './work-item.types'
