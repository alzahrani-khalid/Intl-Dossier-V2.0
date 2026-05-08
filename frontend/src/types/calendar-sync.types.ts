/**
 * Calendar Sync Types
 * Two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
 */

// ============================================================================
// Enums (matching database)
// ============================================================================

export type ExternalCalendarProvider = 'google_calendar' | 'outlook' | 'exchange' | 'ical_feed'

export type CalendarSyncStatus = 'pending' | 'active' | 'paused' | 'error' | 'disconnected'

export type SyncDirection = 'import_only' | 'export_only' | 'two_way'

export type EventSyncState = 'synced' | 'pending_push' | 'pending_pull' | 'conflict' | 'error'

export type SyncConflictStrategy = 'internal_wins' | 'external_wins' | 'newest_wins' | 'manual'

// ============================================================================
// Core Types
// ============================================================================

/**
 * External calendar connection (OAuth-based)
 */
export interface ExternalCalendarConnection {
  id: string
  user_id: string

  // Provider details
  provider: ExternalCalendarProvider
  provider_account_id?: string
  provider_email?: string
  provider_name?: string

  // Sync configuration
  sync_direction: SyncDirection
  sync_status: CalendarSyncStatus
  conflict_strategy: SyncConflictStrategy

  // Sync state
  last_sync_at?: string
  last_sync_error?: string

  // Settings
  sync_enabled: boolean
  auto_sync_interval_minutes: number
  sync_past_days: number
  sync_future_days: number

  // Timestamps
  created_at: string
  updated_at: string

  // Relations
  calendars?: ExternalCalendar[]
}

/**
 * External calendar (from a connected account)
 */
export interface ExternalCalendar {
  id: string
  connection_id: string

  // Calendar identifiers
  external_calendar_id: string
  name: string
  description?: string
  color?: string
  timezone: string

  // Sync settings
  sync_enabled: boolean
  import_events: boolean
  export_events: boolean

  // Access level
  is_primary: boolean
  is_owner: boolean
  access_role?: string

  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Sync log entry
 */
export interface CalendarSyncLog {
  id: string
  connection_id: string

  // Sync details
  sync_started_at: string
  sync_completed_at?: string
  sync_type: 'full' | 'incremental' | 'manual'
  direction: SyncDirection

  // Results
  events_imported: number
  events_exported: number
  events_updated: number
  events_deleted: number
  conflicts_detected: number
  conflicts_resolved: number
  errors: number

  // Error details
  error_message?: string
  error_details?: Record<string, unknown>

  // Status
  status: 'in_progress' | 'completed' | 'failed'
}

/**
 * Sync conflict requiring resolution
 */
export interface CalendarSyncConflict {
  id: string
  mapping_id: string

  // Conflict details
  detected_at: string
  conflict_type: 'update_conflict' | 'delete_conflict' | 'create_conflict'

  // Snapshots
  internal_snapshot: EventSnapshot
  external_snapshot: EventSnapshot

  // Differences
  conflicting_fields: string[]

  // Resolution
  resolved_at?: string
  resolved_by?: string
  resolution?: 'internal_kept' | 'external_kept' | 'merged' | 'ignored'

  // Status
  status: 'pending' | 'resolved' | 'ignored'
}

/**
 * Event snapshot for conflict comparison
 */
export interface EventSnapshot {
  title: string
  description?: string
  start_datetime: string
  end_datetime?: string
  location?: string
  status?: string
  updated_at: string
  [key: string]: unknown
}

/**
 * iCal feed subscription
 */
export interface ICalFeedSubscription {
  id: string
  user_id: string

  // Feed details
  feed_url: string
  feed_name: string
  description?: string
  color: string

  // Sync settings
  sync_enabled: boolean
  refresh_interval_minutes: number
  last_refresh_at?: string
  last_refresh_error?: string

  // Statistics
  event_count: number

  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Connection update input
 */
export interface UpdateConnectionInput {
  sync_direction?: SyncDirection
  conflict_strategy?: SyncConflictStrategy
  sync_enabled?: boolean
  auto_sync_interval_minutes?: number
  sync_past_days?: number
  sync_future_days?: number
}

/**
 * Calendar update input
 */
export interface UpdateCalendarInput {
  sync_enabled?: boolean
  import_events?: boolean
  export_events?: boolean
}

/**
 * Sync trigger request
 */
export interface TriggerSyncRequest {
  connection_id: string
  sync_type?: 'full' | 'incremental'
  calendar_ids?: string[]
}

/**
 * Conflict resolution input
 */
export interface ResolveConflictInput {
  conflict_id: string
  resolution: 'keep_internal' | 'keep_external' | 'merge' | 'ignore'
  merged_data?: Partial<EventSnapshot>
}

/**
 * iCal feed subscription input
 */
export interface CreateICalSubscriptionInput {
  feed_url: string
  feed_name: string
  description?: string
  color?: string
  refresh_interval_minutes?: number
}

/**
 * Update iCal subscription input
 */
export interface UpdateICalSubscriptionInput {
  feed_name?: string
  description?: string
  color?: string
  sync_enabled?: boolean
  refresh_interval_minutes?: number
}

// ============================================================================
// Unified Calendar View Types
// ============================================================================

/**
 * Unified calendar event (combines internal + external sources)
 */
export interface UnifiedCalendarEvent {
  id: string
  source: 'internal' | 'ical_feed' | 'google' | 'outlook' | 'exchange'
  source_id: string
  title: string
  description?: string
  start_datetime: string
  end_datetime?: string
  is_all_day: boolean
  location?: string
  status?: string
  calendar_name: string
  calendar_color: string
  is_synced: boolean
  can_edit: boolean
}

// ============================================================================
// Provider-specific Types
// ============================================================================

// ============================================================================
// Hook Return Types
// ============================================================================

// ============================================================================
// Provider Configuration
// ============================================================================

export const CALENDAR_PROVIDERS: Record<
  ExternalCalendarProvider,
  {
    name: string
    icon: string
    color: string
    supportsOAuth: boolean
    scopes: string[]
  }
> = {
  google_calendar: {
    name: 'Google Calendar',
    icon: 'google',
    color: '#4285F4',
    supportsOAuth: true,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  },
  outlook: {
    name: 'Microsoft Outlook',
    icon: 'microsoft',
    color: '#0078D4',
    supportsOAuth: true,
    scopes: ['Calendars.ReadWrite', 'offline_access'],
  },
  exchange: {
    name: 'Microsoft Exchange',
    icon: 'microsoft',
    color: '#0078D4',
    supportsOAuth: true,
    scopes: ['Calendars.ReadWrite', 'offline_access'],
  },
  ical_feed: {
    name: 'iCal Feed',
    icon: 'calendar',
    color: '#6B7280',
    supportsOAuth: false,
    scopes: [],
  },
}

export const SYNC_DIRECTION_OPTIONS: Record<
  SyncDirection,
  { label_en: string; label_ar: string; description_en: string; description_ar: string }
> = {
  import_only: {
    label_en: 'Import Only',
    label_ar: 'استيراد فقط',
    description_en: 'Only import events from external calendar',
    description_ar: 'استيراد الأحداث من التقويم الخارجي فقط',
  },
  export_only: {
    label_en: 'Export Only',
    label_ar: 'تصدير فقط',
    description_en: 'Only export events to external calendar',
    description_ar: 'تصدير الأحداث إلى التقويم الخارجي فقط',
  },
  two_way: {
    label_en: 'Two-Way Sync',
    label_ar: 'مزامنة ثنائية',
    description_en: 'Full bidirectional synchronization',
    description_ar: 'مزامنة ثنائية الاتجاه كاملة',
  },
}

export const CONFLICT_STRATEGY_OPTIONS: Record<
  SyncConflictStrategy,
  { label_en: string; label_ar: string; description_en: string; description_ar: string }
> = {
  internal_wins: {
    label_en: 'Internal Wins',
    label_ar: 'الداخلي يفوز',
    description_en: 'Internal events take precedence',
    description_ar: 'الأحداث الداخلية لها الأولوية',
  },
  external_wins: {
    label_en: 'External Wins',
    label_ar: 'الخارجي يفوز',
    description_en: 'External events take precedence',
    description_ar: 'الأحداث الخارجية لها الأولوية',
  },
  newest_wins: {
    label_en: 'Newest Wins',
    label_ar: 'الأحدث يفوز',
    description_en: 'Most recently updated event wins',
    description_ar: 'الحدث الذي تم تحديثه مؤخرًا يفوز',
  },
  manual: {
    label_en: 'Manual Resolution',
    label_ar: 'حل يدوي',
    description_en: 'You decide how to resolve conflicts',
    description_ar: 'أنت تقرر كيفية حل التعارضات',
  },
}
