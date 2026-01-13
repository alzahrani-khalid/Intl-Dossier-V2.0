/**
 * Loading Components Index
 *
 * Central export for all loading-related components:
 * - Enhanced progress indicators with ETA and step info
 * - Content-aware skeleton screens
 * - Progress tracking hooks
 */

// Enhanced progress indicator
export {
  EnhancedProgress,
  type EnhancedProgressProps,
  type ProgressStatus,
} from '@/components/ui/enhanced-progress'

// Content-aware skeletons
export {
  // List items
  WorkItemSkeleton,
  WorkItemListSkeleton,
  PersonCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  // Dashboard
  MetricCardSkeleton,
  MetricsGridSkeleton,
  ChartSkeleton,
  // Timeline
  TimelineItemSkeleton,
  TimelineSkeleton,
  // Forms
  FormFieldSkeleton,
  FormSkeleton,
  // Detail pages
  DetailHeaderSkeleton,
  TabbedContentSkeleton,
  // Kanban
  KanbanCardSkeleton,
  KanbanColumnSkeleton,
  KanbanBoardSkeleton,
  // Calendar
  CalendarSkeleton,
  // Network
  NetworkGraphSkeleton,
} from '@/components/ui/content-skeletons'

// Base skeleton (re-export for convenience)
export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
} from '@/components/ui/skeleton'

// Progress tracking hook
export {
  useProgressTracker,
  useBatchProgress,
  ProgressTrackerProvider,
  useProgressTrackerContext,
  type ProgressState,
  type ProgressTrackerOptions,
  type ProgressTrackerActions,
  type UseProgressTrackerReturn,
} from '@/hooks/useProgressTracker'
