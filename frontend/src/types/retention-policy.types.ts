/**
 * Data Retention Policy Types
 *
 * Types for the data retention policies feature including:
 * - Retention policies configuration
 * - Legal holds management
 * - Entity retention status tracking
 * - Execution logs
 */

// ============================================================================
// Enums
// ============================================================================

export type RetentionActionType = 'archive' | 'soft_delete' | 'hard_delete' | 'anonymize'

export type LegalHoldStatus = 'active' | 'released' | 'expired'

export type RetentionPolicyStatus = 'active' | 'draft' | 'disabled' | 'archived'

export type RetentionEntityType =
  | 'dossier'
  | 'intake_ticket'
  | 'document'
  | 'attachment'
  | 'audit_log'
  | 'ai_interaction_log'
  | 'commitment'
  | 'after_action_record'
  | 'position'
  | 'engagement'
  | 'calendar_event'
  | 'notification'
  | 'activity_feed'

export type DocumentClass =
  | 'operational'
  | 'regulatory'
  | 'legal'
  | 'correspondence'
  | 'financial'
  | 'personnel'
  | 'research'
  | 'archive_permanent'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Data retention policy definition
 */
export interface RetentionPolicy {
  id: string
  code: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string

  // Scope
  entity_type: RetentionEntityType
  document_class?: DocumentClass
  sensitivity_level?: number // 1-4
  dossier_type?: string

  // Rules
  retention_days: number // 0 = permanent
  warning_days: number
  action: RetentionActionType

  // Archive settings
  archive_storage_bucket?: string
  archive_path_template?: string

  // Status
  status: RetentionPolicyStatus
  priority: number

  // Compliance
  regulatory_reference?: string
  compliance_notes?: string

  // Audit
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Create/Update retention policy request
 */
export interface RetentionPolicyInput {
  code: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  entity_type: RetentionEntityType
  document_class?: DocumentClass
  sensitivity_level?: number
  dossier_type?: string
  retention_days: number
  warning_days?: number
  action?: RetentionActionType
  archive_storage_bucket?: string
  archive_path_template?: string
  status?: RetentionPolicyStatus
  priority?: number
  regulatory_reference?: string
  compliance_notes?: string
}

/**
 * Legal hold definition
 */
export interface LegalHold {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  reference_number: string

  // Scope
  entity_type?: RetentionEntityType
  entity_ids?: string[]
  keywords?: string[]
  date_range_start?: string
  date_range_end?: string
  custodians?: string[]

  // Hold details
  status: LegalHoldStatus
  reason_en: string
  reason_ar: string
  legal_matter?: string

  // Timeline
  effective_date: string
  expiry_date?: string
  released_date?: string
  released_by?: string
  release_reason?: string

  // Notifications
  notify_custodians?: boolean
  notification_sent_at?: string

  // Audit
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Create/Update legal hold request
 */
export interface LegalHoldInput {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  reference_number: string
  entity_type?: RetentionEntityType
  entity_ids?: string[]
  keywords?: string[]
  date_range_start?: string
  date_range_end?: string
  custodians?: string[]
  status?: LegalHoldStatus
  reason_en: string
  reason_ar: string
  legal_matter?: string
  effective_date?: string
  expiry_date?: string
  notify_custodians?: boolean
}

/**
 * Entity retention status tracking
 */
export interface EntityRetentionStatus {
  id: string
  entity_type: RetentionEntityType
  entity_id: string

  // Policy
  retention_policy_id?: string
  retention_expires_at?: string

  // Hold status
  under_legal_hold: boolean
  legal_hold_ids?: string[]

  // Processing status
  archived_at?: string
  archive_location?: string
  deleted_at?: string
  anonymized_at?: string

  // Warnings
  expiration_warning_sent: boolean
  warning_sent_at?: string

  // Manual holds
  manual_hold: boolean
  manual_hold_reason?: string
  manual_hold_by?: string
  manual_hold_until?: string

  // Audit
  created_at: string
  updated_at: string
}

/**
 * Retention execution log entry
 */
export interface RetentionExecutionLog {
  id: string
  execution_type: 'scheduled' | 'manual' | 'dry_run'
  started_at: string
  completed_at?: string

  // Scope
  policy_id?: string
  entity_type?: RetentionEntityType

  // Results
  items_processed: number
  items_archived: number
  items_deleted: number
  items_anonymized: number
  items_skipped: number
  items_warned: number

  // Errors
  errors: Array<{ entity_id: string; error: string }>

  // Execution metadata
  executed_by?: string
  execution_params?: Record<string, unknown>

  // Audit
  created_at: string
}

/**
 * Retention statistics by entity type
 */
export interface RetentionStatistics {
  entity_type: RetentionEntityType
  total_tracked: number
  under_hold: number
  archived: number
  deleted: number
  pending_action: number
  expiring_soon: number
}

/**
 * Entity pending retention action
 */
export interface PendingRetentionAction {
  entity_type: RetentionEntityType
  entity_id: string
  policy_id: string
  policy_name_en: string
  action: RetentionActionType
  expires_at: string
  days_until_expiration: number
  under_legal_hold: boolean
}

/**
 * Entity expiring soon
 */
export interface ExpiringEntity {
  entity_type: RetentionEntityType
  entity_id: string
  policy_id: string
  policy_name_en: string
  action: RetentionActionType
  expires_at: string
  days_until_expiration: number
  warning_sent: boolean
}

// ============================================================================
// API Response Types
// ============================================================================

export interface RetentionPolicyListResponse {
  data: RetentionPolicy[]
}

export interface RetentionPolicyResponse {
  data: RetentionPolicy
}

export interface LegalHoldListResponse {
  data: LegalHold[]
}

export interface LegalHoldResponse {
  data: LegalHold
}

export interface RetentionStatisticsResponse {
  data: RetentionStatistics[]
}

export interface PendingActionsResponse {
  data: PendingRetentionAction[]
}

export interface ExpiringEntitiesResponse {
  data: ExpiringEntity[]
}

export interface ExecutionLogResponse {
  data: RetentionExecutionLog[]
}

export interface ProcessorResultResponse {
  data: {
    execution_id: string
    started_at: string
    completed_at?: string
    items_processed: number
    items_archived: number
    items_deleted: number
    items_anonymized: number
    items_skipped: number
    items_warned: number
    errors: Array<{ entity_id: string; error: string }>
  }
}

// ============================================================================
// Filter Types
// ============================================================================

export interface RetentionPolicyFilters {
  status?: RetentionPolicyStatus
  entity_type?: RetentionEntityType
  document_class?: DocumentClass
}

export interface LegalHoldFilters {
  status?: LegalHoldStatus
}

export interface ExpiringEntitiesFilters {
  days?: number
  entity_type?: RetentionEntityType
  limit?: number
}

export interface PendingActionsFilters {
  entity_type?: RetentionEntityType
  action?: RetentionActionType
  limit?: number
}

export interface ProcessorConfig {
  dry_run?: boolean
  entity_type?: RetentionEntityType
  action?: RetentionActionType
  batch_size?: number
  send_warnings?: boolean
  warning_days?: number
}

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Display-friendly retention policy for tables/lists
 */
export interface RetentionPolicyDisplay extends RetentionPolicy {
  retention_display: string // e.g., "7 Years", "Permanent", "90 Days"
  action_display: string // Translated action label
  status_display: string // Translated status label
}

/**
 * Legal hold with resolved user names
 */
export interface LegalHoldDisplay extends LegalHold {
  created_by_name?: string
  released_by_name?: string
  status_display: string
}

/**
 * Summary card data
 */
export interface RetentionSummary {
  total_policies: number
  active_policies: number
  active_legal_holds: number
  entities_under_hold: number
  pending_actions: number
  expiring_this_month: number
}
