// Watchlist Types
// Feature: personal-watchlist

export type WatchableEntityType =
  | 'person'
  | 'engagement'
  | 'commitment'
  | 'dossier'
  | 'organization'
  | 'forum'
  | 'position'
  | 'mou'
  | 'working_group'

export type WatchEventType =
  | 'entity_modified'
  | 'relationship_added'
  | 'relationship_removed'
  | 'deadline_approaching'
  | 'deadline_passed'
  | 'status_changed'
  | 'assignment_changed'
  | 'comment_added'
  | 'document_attached'
  | 'custom'

export type WatchPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WatchlistItem {
  id: string
  user_id: string
  entity_type: WatchableEntityType
  entity_id: string
  custom_label?: string
  notes?: string
  priority: WatchPriority
  is_active: boolean
  notify_on_modification: boolean
  notify_on_relationship_change: boolean
  notify_on_deadline: boolean
  notify_on_status_change: boolean
  notify_on_comment: boolean
  notify_on_document: boolean
  deadline_reminder_days: number[]
  created_at: string
  updated_at: string
  // Enriched details (optional)
  entity_details?: EntityDetails
  recent_events_count?: number
}

export interface EntityDetails {
  id: string
  name?: string
  title?: string
  status?: string
  updated_at?: string
  deadline?: string
  [key: string]: unknown
}

export interface WatchlistTemplate {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  applicable_roles: string[]
  template_config: {
    entities: Array<{
      entity_type: WatchableEntityType
      entity_id: string
      custom_label?: string
      notes?: string
      priority?: WatchPriority
      notify_modification?: boolean
      notify_relationship?: boolean
      notify_deadline?: boolean
      notify_status?: boolean
    }>
    notify_settings: {
      default_priority?: WatchPriority
      notify_modification?: boolean
      notify_relationship?: boolean
      notify_deadline?: boolean
      notify_status?: boolean
      deadline_reminder_days?: number[]
    }
  }
  is_system_template: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // Runtime fields
  is_applied?: boolean
  applied_info?: {
    template_id: string
    auto_sync: boolean
    applied_at: string
  }
}

export interface WatchlistEvent {
  id: string
  watch_id: string
  event_type: WatchEventType
  event_data: Record<string, unknown>
  notification_sent: boolean
  notification_id?: string
  created_at: string
}

export interface WatchlistSummary {
  entity_type: WatchableEntityType
  total_count: number
  active_count: number
  high_priority_count: number
}

export interface WatchlistFilters {
  entity_type?: WatchableEntityType
  priority?: WatchPriority
  active_only?: boolean
  cursor?: string
  limit?: number
  include_details?: boolean
}

export interface AddToWatchlistRequest {
  entity_type: WatchableEntityType
  entity_id: string
  custom_label?: string
  notes?: string
  priority?: WatchPriority
  notify_on_modification?: boolean
  notify_on_relationship_change?: boolean
  notify_on_deadline?: boolean
  notify_on_status_change?: boolean
  notify_on_comment?: boolean
  notify_on_document?: boolean
  deadline_reminder_days?: number[]
}

export interface BulkAddRequest {
  entities: AddToWatchlistRequest[]
}

export interface BulkRemoveRequest {
  watch_ids: string[]
}

export interface UpdateWatchRequest {
  id: string
  custom_label?: string
  notes?: string
  priority?: WatchPriority
  is_active?: boolean
  notify_on_modification?: boolean
  notify_on_relationship_change?: boolean
  notify_on_deadline?: boolean
  notify_on_status_change?: boolean
  notify_on_comment?: boolean
  notify_on_document?: boolean
  deadline_reminder_days?: number[]
}

export interface WatchlistResponse {
  watchlist: WatchlistItem[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

export interface WatchlistSummaryResponse {
  summary: WatchlistSummary[]
  totals: {
    total: number
    active: number
  }
}

export interface WatchCheckResponse {
  is_watched: boolean
  watch: WatchlistItem | null
}

// Entity type display info
export const ENTITY_TYPE_INFO: Record<
  WatchableEntityType,
  {
    labelKey: string
    icon: string
    color: string
  }
> = {
  person: { labelKey: 'entityTypes.person', icon: 'User', color: 'blue' },
  engagement: { labelKey: 'entityTypes.engagement', icon: 'Calendar', color: 'green' },
  commitment: { labelKey: 'entityTypes.commitment', icon: 'CheckSquare', color: 'orange' },
  dossier: { labelKey: 'entityTypes.dossier', icon: 'FileText', color: 'purple' },
  organization: { labelKey: 'entityTypes.organization', icon: 'Building2', color: 'gray' },
  forum: { labelKey: 'entityTypes.forum', icon: 'Users', color: 'cyan' },
  position: { labelKey: 'entityTypes.position', icon: 'FileCheck', color: 'indigo' },
  mou: { labelKey: 'entityTypes.mou', icon: 'FileSignature', color: 'pink' },
  working_group: { labelKey: 'entityTypes.workingGroup', icon: 'UsersRound', color: 'teal' },
}

// Priority display info
export const PRIORITY_INFO: Record<
  WatchPriority,
  {
    labelKey: string
    color: string
    bgColor: string
  }
> = {
  low: { labelKey: 'priority.low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { labelKey: 'priority.medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { labelKey: 'priority.high', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgent: { labelKey: 'priority.urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
}
