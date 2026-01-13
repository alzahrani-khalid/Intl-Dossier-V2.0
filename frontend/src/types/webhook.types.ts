/**
 * Webhook Types
 * Feature: webhook-integration
 *
 * Comprehensive type definitions for webhook management including:
 * - Webhook configuration
 * - Event types
 * - Delivery logs
 * - Templates
 */

// ============================================================================
// Enum Types
// ============================================================================

export type WebhookEventType =
  | 'dossier.created'
  | 'dossier.updated'
  | 'dossier.deleted'
  | 'engagement.created'
  | 'engagement.updated'
  | 'engagement.completed'
  | 'commitment.created'
  | 'commitment.updated'
  | 'commitment.fulfilled'
  | 'commitment.overdue'
  | 'intake.created'
  | 'intake.updated'
  | 'intake.resolved'
  | 'document.uploaded'
  | 'document.deleted'
  | 'calendar.event_created'
  | 'calendar.event_updated'
  | 'calendar.event_reminder'
  | 'relationship.created'
  | 'relationship.updated'
  | 'sla.warning'
  | 'sla.breach'

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

export type WebhookAuthType = 'none' | 'hmac_sha256' | 'bearer_token' | 'basic_auth'

export type WebhookHttpMethod = 'POST' | 'PUT' | 'PATCH'

// ============================================================================
// Event Categories (for UI grouping)
// ============================================================================

export interface WebhookEventCategory {
  key: string
  label_en: string
  label_ar: string
  events: WebhookEventType[]
}

export const WEBHOOK_EVENT_CATEGORIES: WebhookEventCategory[] = [
  {
    key: 'dossier',
    label_en: 'Dossiers',
    label_ar: 'الملفات',
    events: ['dossier.created', 'dossier.updated', 'dossier.deleted'],
  },
  {
    key: 'engagement',
    label_en: 'Engagements',
    label_ar: 'الارتباطات',
    events: ['engagement.created', 'engagement.updated', 'engagement.completed'],
  },
  {
    key: 'commitment',
    label_en: 'Commitments',
    label_ar: 'الالتزامات',
    events: [
      'commitment.created',
      'commitment.updated',
      'commitment.fulfilled',
      'commitment.overdue',
    ],
  },
  {
    key: 'intake',
    label_en: 'Intake Tickets',
    label_ar: 'تذاكر الاستقبال',
    events: ['intake.created', 'intake.updated', 'intake.resolved'],
  },
  {
    key: 'document',
    label_en: 'Documents',
    label_ar: 'المستندات',
    events: ['document.uploaded', 'document.deleted'],
  },
  {
    key: 'calendar',
    label_en: 'Calendar',
    label_ar: 'التقويم',
    events: ['calendar.event_created', 'calendar.event_updated', 'calendar.event_reminder'],
  },
  {
    key: 'relationship',
    label_en: 'Relationships',
    label_ar: 'العلاقات',
    events: ['relationship.created', 'relationship.updated'],
  },
  {
    key: 'sla',
    label_en: 'SLA',
    label_ar: 'اتفاقية مستوى الخدمة',
    events: ['sla.warning', 'sla.breach'],
  },
]

// ============================================================================
// Webhook Configuration
// ============================================================================

export interface Webhook {
  id: string
  created_by: string
  organization_id?: string | null

  // Names and descriptions (bilingual)
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null

  // Endpoint configuration
  url: string
  http_method: WebhookHttpMethod

  // Authentication
  auth_type: WebhookAuthType
  auth_secret?: string | null // Masked in responses
  auth_username?: string | null
  auth_password?: string | null // Masked in responses

  // Event subscriptions
  subscribed_events: WebhookEventType[]

  // Payload customization
  payload_template?: Record<string, unknown> | null
  include_full_payload: boolean
  custom_headers: Record<string, string>

  // Retry configuration
  max_retries: number
  retry_delay_seconds: number
  timeout_seconds: number

  // Status and metadata
  is_active: boolean
  last_triggered_at?: string | null
  last_success_at?: string | null
  last_failure_at?: string | null
  failure_count: number
  success_count: number

  // Auto-disable
  auto_disable_threshold: number
  auto_disabled_at?: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export interface WebhookCreate {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  url: string
  http_method?: WebhookHttpMethod
  auth_type?: WebhookAuthType
  auth_secret?: string
  auth_username?: string
  auth_password?: string
  subscribed_events: WebhookEventType[]
  payload_template?: Record<string, unknown>
  include_full_payload?: boolean
  custom_headers?: Record<string, string>
  max_retries?: number
  retry_delay_seconds?: number
  timeout_seconds?: number
  is_active?: boolean
  auto_disable_threshold?: number
}

export interface WebhookUpdate extends Partial<WebhookCreate> {
  id: string
}

// ============================================================================
// Webhook Delivery
// ============================================================================

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event_type: WebhookEventType
  event_id?: string | null
  event_entity_type?: string | null
  status: WebhookDeliveryStatus
  attempt_count: number

  // Request details
  request_url: string
  request_method: string
  request_headers?: Record<string, string> | null
  request_payload: Record<string, unknown>

  // Response details
  response_status_code?: number | null
  response_headers?: Record<string, string> | null
  response_body?: string | null
  response_time_ms?: number | null

  // Error tracking
  error_message?: string | null
  error_code?: string | null

  // Retry scheduling
  next_retry_at?: string | null

  // Timestamps
  created_at: string
  delivered_at?: string | null

  // Signature
  signature_header?: string | null
}

// ============================================================================
// Webhook Statistics
// ============================================================================

export interface WebhookStats {
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  pending_deliveries: number
  avg_response_time_ms: number | null
  success_rate: number
}

// ============================================================================
// Webhook Templates
// ============================================================================

export interface WebhookTemplate {
  id: string
  slug: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  default_payload_template: Record<string, unknown>
  default_headers: Record<string, string>
  documentation_url?: string | null
  icon_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Test Webhook Response
// ============================================================================

export interface WebhookTestResult {
  success: boolean
  status_code?: number
  response_time_ms: number
  response_body?: string
  error_message?: string
  headers_sent: Record<string, string>
  payload_sent: Record<string, unknown>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface WebhookListResponse {
  data: Webhook[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WebhookDeliveryListResponse {
  data: WebhookDelivery[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WebhookTemplatesResponse {
  data: WebhookTemplate[]
}

// ============================================================================
// Search/Filter Parameters
// ============================================================================

export interface WebhookSearchParams {
  page?: number
  limit?: number
  is_active?: boolean
  event_type?: WebhookEventType
  search?: string
}

export interface WebhookDeliverySearchParams {
  webhook_id: string
  page?: number
  limit?: number
  status?: WebhookDeliveryStatus
}
