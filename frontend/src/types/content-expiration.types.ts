/**
 * Content Expiration Types
 * Feature: content-expiration-dates
 * Tracks expiration dates and freshness status for dossiers, briefs, and positions
 */

// Content freshness status enum
export type ContentFreshnessStatus =
  | 'current' // Content is up-to-date
  | 'review_pending' // Content is approaching expiration, review needed
  | 'outdated' // Content has expired, needs refresh
  | 'refreshing' // Content refresh in progress
  | 'archived' // Content has been archived

// Content expiration action type
export type ContentExpirationAction =
  | 'notify_owners' // Send notification to dossier owners
  | 'notify_reviewers' // Send notification to reviewers
  | 'mark_outdated' // Mark content as outdated
  | 'archive_content' // Archive the content
  | 'require_review' // Require review before continued use
  | 'trigger_brief_refresh' // Trigger AI brief regeneration

// Entity types that support expiration
export type ExpirationEntityType = 'dossier' | 'brief' | 'ai_brief' | 'position'

// Content expiration rule
export interface ContentExpirationRule {
  id: string
  code: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  entity_type: ExpirationEntityType
  dossier_type: string | null
  sensitivity_level: string | null
  default_expiration_days: number
  warning_days_before: number
  critical_days_before: number
  on_warning_action: ContentExpirationAction
  on_critical_action: ContentExpirationAction
  on_expiration_action: ContentExpirationAction
  auto_archive_after_days: number | null
  auto_refresh_briefs: boolean
  is_active: boolean
  priority: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// Content expiration status for a specific entity
export interface ContentExpirationStatus {
  id: string
  entity_type: ExpirationEntityType
  entity_id: string
  rule_id: string | null
  expires_at: string
  last_reviewed_at: string | null
  next_review_due: string | null
  freshness_status: ContentFreshnessStatus
  status_changed_at: string
  warning_sent_at: string | null
  critical_warning_sent_at: string | null
  expiration_notification_sent_at: string | null
  review_requested_by: string | null
  review_requested_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  extension_count: number
  last_extended_by: string | null
  last_extended_at: string | null
  extension_reason: string | null
  last_refresh_triggered_at: string | null
  refresh_in_progress: boolean
  created_at: string
  updated_at: string
  rule?: ContentExpirationRule
}

// Expiration history event types
export type ExpirationEventType =
  | 'created'
  | 'warning_sent'
  | 'critical_warning_sent'
  | 'expired'
  | 'reviewed'
  | 'extended'
  | 'refreshed'
  | 'archived'
  | 'restored'
  | 'rule_changed'

// Expiration history entry
export interface ContentExpirationHistory {
  id: string
  entity_type: ExpirationEntityType
  entity_id: string
  expiration_status_id: string | null
  event_type: ExpirationEventType
  old_status: ContentFreshnessStatus | null
  new_status: ContentFreshnessStatus | null
  old_expires_at: string | null
  new_expires_at: string | null
  performed_by: string | null
  performed_by_system: boolean
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Expiring content item returned from the API
export interface ExpiringContentItem {
  entity_type: ExpirationEntityType
  entity_id: string
  entity_name_en: string
  entity_name_ar: string
  expires_at: string
  days_until_expiration: number
  freshness_status: ContentFreshnessStatus
  warning_sent: boolean
  critical_warning_sent: boolean
  rule_name_en: string | null
  owner_ids: string[]
}

// Expiration statistics by entity type
export interface ContentExpirationStats {
  entity_type: ExpirationEntityType
  total_tracked: number
  current_count: number
  review_pending_count: number
  outdated_count: number
  expiring_7_days: number
  expiring_30_days: number
}

// API Request types
export interface SetExpirationRequest {
  entity_type: ExpirationEntityType
  entity_id: string
  expires_at?: string
  rule_id?: string
}

export interface ExtendExpirationRequest {
  entity_type: ExpirationEntityType
  entity_id: string
  extension_days: number
  reason?: string
}

export interface MarkReviewedRequest {
  entity_type: ExpirationEntityType
  entity_id: string
  notes?: string
}

export interface RequestReviewRequest {
  entity_type: ExpirationEntityType
  entity_id: string
  message?: string
}

export interface GetExpiringContentParams {
  entity_type?: ExpirationEntityType
  days_ahead?: number
  include_expired?: boolean
  limit?: number
}

export interface GetExpirationStatsParams {
  for_user?: boolean
}

// API Response types
export interface SetExpirationResponse {
  success: boolean
  data: {
    status_id: string
  }
}

export interface ExtendExpirationResponse {
  success: boolean
  data: {
    success: boolean
  }
}

export interface MarkReviewedResponse {
  success: boolean
  data: {
    success: boolean
  }
}

export interface RequestReviewResponse {
  success: boolean
  notified_owners: number
}

export interface ProcessExpirationResponse {
  success: boolean
  updated_count: number
  warning_sent_count: number
  critical_sent_count: number
  expired_count: number
}

export interface ExpiringContentResponse {
  data: ExpiringContentItem[]
}

export interface ExpirationStatsResponse {
  data: ContentExpirationStats[]
}

export interface ExpirationStatusResponse {
  data: ContentExpirationStatus | null
}

export interface ExpirationRulesResponse {
  data: ContentExpirationRule[]
}

export interface ExpirationHistoryResponse {
  data: ContentExpirationHistory[]
}

// Hook options and return types
export interface UseContentExpirationOptions {
  entityType?: ExpirationEntityType
  entityId?: string
  daysAhead?: number
  includeExpired?: boolean
  forCurrentUser?: boolean
  enabled?: boolean
}

export interface UseContentExpirationReturn {
  // Queries
  expiringContent: ExpiringContentItem[]
  expirationStatus: ContentExpirationStatus | null
  expirationStats: ContentExpirationStats[]
  expirationRules: ContentExpirationRule[]
  expirationHistory: ContentExpirationHistory[]

  // Loading states
  isLoadingContent: boolean
  isLoadingStatus: boolean
  isLoadingStats: boolean
  isLoadingRules: boolean
  isLoadingHistory: boolean

  // Mutations
  setExpiration: (params: SetExpirationRequest) => Promise<SetExpirationResponse>
  extendExpiration: (params: ExtendExpirationRequest) => Promise<ExtendExpirationResponse>
  markAsReviewed: (params: MarkReviewedRequest) => Promise<MarkReviewedResponse>
  requestReview: (params: RequestReviewRequest) => Promise<RequestReviewResponse>

  // Mutation states
  isSettingExpiration: boolean
  isExtending: boolean
  isMarking: boolean
  isRequesting: boolean

  // Utility
  refetchAll: () => Promise<void>
}

// Component prop types
export interface ExpirationBadgeProps {
  status: ContentFreshnessStatus
  expiresAt?: string
  daysUntilExpiration?: number
  size?: 'sm' | 'md' | 'lg'
  showDays?: boolean
  className?: string
}

export interface ExpirationSettingsProps {
  entityType: ExpirationEntityType
  entityId: string
  currentExpiration?: ContentExpirationStatus
  onUpdate?: () => void
  className?: string
}

export interface ExpirationTimelineProps {
  entityType: ExpirationEntityType
  entityId: string
  limit?: number
  className?: string
}

export interface ExpirationDashboardCardProps {
  stats: ContentExpirationStats
  onClick?: () => void
  className?: string
}

// Utility types
export type FreshnessStatusColorMap = {
  [key in ContentFreshnessStatus]: {
    bg: string
    text: string
    border: string
    icon: string
  }
}

// Default freshness status colors
export const FRESHNESS_STATUS_COLORS: FreshnessStatusColorMap = {
  current: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500',
  },
  review_pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
  },
  outdated: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
  },
  refreshing: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
  },
  archived: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
    icon: 'text-gray-500',
  },
}

// Extension presets
export const EXTENSION_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
] as const

// Default expiration days by entity type
export const DEFAULT_EXPIRATION_DAYS: Record<ExpirationEntityType, number> = {
  dossier: 365,
  brief: 90,
  ai_brief: 60,
  position: 180,
}
