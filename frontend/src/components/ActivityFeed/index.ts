/**
 * Activity Feed Components
 *
 * Exports all activity feed related components
 */

export { EnhancedActivityFeed } from './EnhancedActivityFeed'
export { ActivityFeedFilters } from './ActivityFeedFilters'
export { FollowButton } from './FollowButton'
export { RealtimeActivityFeed, useActivityTracking } from './RealtimeActivityFeed'

// Re-export types for convenience
export type {
  ActivityItem,
  ActivityFilters,
  ActivityEntityType,
  ActivityActionType,
  EntityFollow,
  ActivityFeedPreferences,
  ActivityFeedProps,
  ActivityFiltersProps,
  FollowButtonProps,
} from '@/types/activity-feed.types'
