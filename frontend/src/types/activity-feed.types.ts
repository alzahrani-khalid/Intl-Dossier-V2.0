/**
 * Activity Feed Types
 *
 * Type definitions for the enhanced activity feed with filters and entity following
 */

// =============================================
// ACTION TYPES
// =============================================

export type ActivityActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'comment'
  | 'status_change'
  | 'upload'
  | 'download'
  | 'view'
  | 'share'
  | 'assign'
  | 'mention'
  | 'approval'
  | 'rejection'
  | 'archive'
  | 'restore'

// =============================================
// ENTITY TYPES
// =============================================

export type ActivityEntityType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group'
  | 'theme'
  | 'mou'
  | 'document'
  | 'event'
  | 'contact'
  | 'task'
  | 'brief'
  | 'commitment'
  | 'deliverable'
  | 'position'
  | 'relationship'
  | 'intelligence'
  | 'intake_ticket'

// =============================================
// VISIBILITY
// =============================================

export type ActivityVisibilityScope = 'all' | 'team' | 'managers' | 'private'

// =============================================
// ACTIVITY ITEM
// =============================================

export interface ActivityItem {
  id: string
  action_type: ActivityActionType
  entity_type: ActivityEntityType
  entity_id: string
  entity_name_en: string
  entity_name_ar?: string
  actor_id: string
  actor_name: string
  actor_email?: string
  actor_avatar_url?: string
  description_en: string
  description_ar?: string
  related_entity_type?: ActivityEntityType
  related_entity_id?: string
  related_entity_name_en?: string
  related_entity_name_ar?: string
  target_user_id?: string
  target_user_name?: string
  metadata?: ActivityMetadata
  is_public: boolean
  visibility_scope: ActivityVisibilityScope
  created_at: string
  // UI state
  isNew?: boolean
}

// =============================================
// ACTIVITY METADATA
// =============================================

export interface ActivityMetadata {
  // Status change
  from_status?: string
  to_status?: string
  // Comment
  comment_text?: string
  comment_id?: string
  // Assignment
  previous_assignee_id?: string
  previous_assignee_name?: string
  new_assignee_id?: string
  new_assignee_name?: string
  // Document
  file_name?: string
  file_size?: number
  file_type?: string
  file_url?: string
  // Navigation
  navigation_url?: string
  // Additional context
  [key: string]: unknown
}

// =============================================
// FILTERS
// =============================================

export interface ActivityFilters {
  entity_types?: ActivityEntityType[]
  action_types?: ActivityActionType[]
  actor_id?: string
  date_from?: string
  date_to?: string
  related_entity_type?: ActivityEntityType
  related_entity_id?: string
  search?: string
  followed_only?: boolean
}

// =============================================
// DATE RANGE PRESETS
// =============================================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'custom'

export interface DateRangeFilter {
  preset: DateRangePreset
  from?: string
  to?: string
}

// =============================================
// PAGINATION
// =============================================

export interface ActivityPagination {
  cursor?: string
  limit?: number
}

// =============================================
// API RESPONSE
// =============================================

export interface ActivityFeedResponse {
  activities: ActivityItem[]
  next_cursor: string | null
  has_more: boolean
  total_count: number | null
}

// =============================================
// ENTITY FOLLOW
// =============================================

export type FollowReason =
  | 'manual'
  | 'auto_creator'
  | 'auto_assignee'
  | 'auto_mention'
  | 'auto_team'

export interface EntityFollow {
  id: string
  user_id: string
  entity_type: ActivityEntityType
  entity_id: string
  entity_name_en: string
  entity_name_ar?: string
  notify_on_update: boolean
  notify_on_comment: boolean
  notify_on_status_change: boolean
  notify_on_mention: boolean
  follow_reason: FollowReason
  created_at: string
}

export interface FollowEntityRequest {
  entity_type: ActivityEntityType
  entity_id: string
  entity_name_en: string
  entity_name_ar?: string
  follow_reason?: FollowReason
}

export interface UnfollowEntityRequest {
  entity_type: ActivityEntityType
  entity_id: string
}

export interface FollowingResponse {
  following: EntityFollow[]
}

// =============================================
// USER PREFERENCES
// =============================================

export type EmailDigestFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never'

export interface ActivityFeedPreferences {
  user_id: string
  default_entity_types: ActivityEntityType[]
  default_action_types: ActivityActionType[]
  items_per_page: number
  show_own_activities: boolean
  compact_view: boolean
  email_digest_frequency: EmailDigestFrequency
  push_notifications_enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface UpdatePreferencesRequest {
  default_entity_types?: ActivityEntityType[]
  default_action_types?: ActivityActionType[]
  items_per_page?: number
  show_own_activities?: boolean
  compact_view?: boolean
  email_digest_frequency?: EmailDigestFrequency
  push_notifications_enabled?: boolean
}

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseActivityFeedReturn {
  activities: ActivityItem[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: Error | null
  fetchNextPage: () => void
  refetch: () => void
  filters: ActivityFilters
  setFilters: (filters: ActivityFilters) => void
  clearFilters: () => void
}

export interface UseEntityFollowReturn {
  following: EntityFollow[]
  isLoading: boolean
  error: Error | null
  followEntity: (request: FollowEntityRequest) => Promise<void>
  unfollowEntity: (request: UnfollowEntityRequest) => Promise<void>
  isFollowing: (entityType: ActivityEntityType, entityId: string) => boolean
  isFollowPending: boolean
  isUnfollowPending: boolean
}

export interface UseActivityPreferencesReturn {
  preferences: ActivityFeedPreferences | null
  isLoading: boolean
  error: Error | null
  updatePreferences: (request: UpdatePreferencesRequest) => Promise<void>
  isUpdating: boolean
}

// =============================================
// CONFIGURATION
// =============================================

export interface ActivityActionConfig {
  type: ActivityActionType
  icon: string // Lucide icon name
  color: string // Tailwind color class
  bgColor: string // Tailwind bg color class
  label_en: string
  label_ar: string
}

export interface ActivityEntityConfig {
  type: ActivityEntityType
  icon: string // Lucide icon name
  color: string // Tailwind color class
  label_en: string
  label_ar: string
  plural_en: string
  plural_ar: string
}

// =============================================
// COMPONENT PROPS
// =============================================

export interface ActivityFeedProps {
  filters?: ActivityFilters
  showFilters?: boolean
  showSearch?: boolean
  showFollowedOnly?: boolean
  maxHeight?: string
  className?: string
  emptyMessage?: string
  onActivityClick?: (activity: ActivityItem) => void
}

export interface ActivityFiltersProps {
  filters: ActivityFilters
  onFiltersChange: (filters: ActivityFilters) => void
  onClearFilters: () => void
  showEntityTypes?: boolean
  showActionTypes?: boolean
  showDateRange?: boolean
  showUserFilter?: boolean
  showSearch?: boolean
  className?: string
}

export interface ActivityItemProps {
  activity: ActivityItem
  compact?: boolean
  showEntityType?: boolean
  onClick?: () => void
  className?: string
}

export interface FollowButtonProps {
  entityType: ActivityEntityType
  entityId: string
  entityNameEn: string
  entityNameAr?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}
