/**
 * TypeScript Type Definitions for Dynamic Country Intelligence System
 *
 * Feature: 029-dynamic-country-intelligence
 * Generated from: supabase/migrations/20250130000001_extend_intelligence_reports_dynamic_system.sql
 *
 * These types mirror the extended intelligence_reports table schema and provide
 * type safety for frontend components interacting with the intelligence system.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Intelligence type classification (FR-002)
 * Maps to intelligence_reports.intelligence_type column
 */
export type IntelligenceType =
  | 'economic' // Economic indicators, trade data, GDP, inflation
  | 'political' // Political events, diplomatic developments, leadership changes
  | 'security' // Security assessments, risk analysis, threat indicators
  | 'bilateral' // Bilateral relationship analysis, partnership strength
  | 'general' // General intelligence not fitting other categories

/**
 * Cache refresh status (FR-014)
 * Maps to intelligence_reports.refresh_status column
 */
export type RefreshStatus =
  | 'fresh' // Cache is valid and within TTL
  | 'stale' // Cache has expired (past TTL) but still usable
  | 'refreshing' // Currently being refreshed (lock held)
  | 'error' // Last refresh attempt failed
  | 'expired' // Cache is too old and should not be used

/**
 * How the refresh was triggered (FR-006, FR-011)
 * Maps to intelligence_reports.refresh_trigger_type column
 */
export type RefreshTriggerType =
  | 'manual' // User clicked refresh button
  | 'automatic' // Background refresh triggered by TTL expiration
  | 'scheduled' // Scheduled batch refresh (cron job)

/**
 * Entity types that can have intelligence reports
 * Maps to dossiers.type column and intelligence_reports.entity_type
 */
export type EntityType = 'country' | 'organization' | 'forum' | 'topic' | 'working_group'

/**
 * Review status for intelligence reports
 * Maps to intelligence_reports.review_status column
 */
export type ReviewStatus =
  | 'draft' // Initial draft state
  | 'pending' // Awaiting review
  | 'approved' // Approved for use
  | 'archived' // Archived (old version)

/**
 * Embedding generation status
 * Maps to intelligence_reports.embedding_status column
 */
export type EmbeddingStatus =
  | 'pending' // Not yet processed
  | 'processing' // Currently generating embeddings
  | 'completed' // Embeddings successfully generated
  | 'failed' // Embedding generation failed

/**
 * Default TTL values for each intelligence type (in hours)
 * Matches get_intelligence_ttl_hours() function
 */
export const INTELLIGENCE_TTL_HOURS: Record<IntelligenceType, number> = {
  economic: 24, // 24 hours for economic data
  political: 6, // 6 hours for political events (fast-moving)
  security: 12, // 12 hours for security assessments
  bilateral: 48, // 48 hours for bilateral relationships (slower changes)
  general: 24, // 24 hours default
} as const

// ============================================================================
// Data Source Metadata Types
// ============================================================================

/**
 * Metadata about a single data source used for intelligence
 * Stored in intelligence_reports.data_sources_metadata JSONB array
 */
export interface DataSourceMetadata {
  /** Source identifier (e.g., 'world_bank_api', 'anythingllm', 'manual_entry') */
  source: string

  /** API endpoint or document path */
  endpoint?: string

  /** Timestamp when data was retrieved from this source */
  retrieved_at: string // ISO 8601 datetime

  /** Confidence level for this source (0-100) */
  confidence?: number

  /** Additional metadata specific to the source */
  metadata?: Record<string, unknown>

  /** Error message if retrieval failed */
  error?: string
}

/**
 * AnythingLLM response metadata
 * Stored in intelligence_reports.anythingllm_response_metadata JSONB
 */
export interface AnythingLLMMetadata {
  /** Model used for generation (e.g., 'gpt-4', 'claude-3-opus') */
  model?: string

  /** Number of tokens in prompt */
  prompt_tokens?: number

  /** Number of tokens in completion */
  completion_tokens?: number

  /** Total tokens used */
  total_tokens?: number

  /** Documents cited in response */
  sources_cited?: string[]

  /** Confidence score from LLM */
  confidence_score?: number

  /** Response time in milliseconds */
  response_time_ms?: number

  /** Temperature setting used */
  temperature?: number
}

/**
 * Threat indicator structure
 * Stored in intelligence_reports.threat_indicators JSONB array
 */
export interface ThreatIndicator {
  /** Type of threat (e.g., 'political_instability', 'terrorism', 'cyber') */
  type: string

  /** Severity level (e.g., 'low', 'medium', 'high', 'critical') */
  severity: 'low' | 'medium' | 'high' | 'critical'

  /** Description of the threat */
  description: string

  /** Description in Arabic */
  description_ar?: string

  /** Confidence level (0-100) */
  confidence: number

  /** Date when threat was identified */
  identified_at: string

  /** Expiration date for the threat indicator */
  expires_at?: string
}

/**
 * Geospatial tag structure
 * Stored in intelligence_reports.geospatial_tags JSONB array
 */
export interface GeospatialTag {
  /** Location name */
  name: string

  /** Location name in Arabic */
  name_ar?: string

  /** Location type (e.g., 'city', 'region', 'country') */
  type: string

  /** Latitude */
  latitude?: number

  /** Longitude */
  longitude?: number

  /** ISO country code */
  country_code?: string
}

// ============================================================================
// Database Table Types
// ============================================================================

/**
 * Complete intelligence report record from database
 * Maps to intelligence_reports table
 */
export interface IntelligenceReport {
  // Identity
  id: string // UUID

  // Bilingual content
  title: string
  title_ar?: string
  content: string
  content_ar?: string

  // Metadata
  confidence_score: number // 0-100
  data_sources: string[] // Legacy array (kept for backwards compatibility)
  analysis_timestamp: string // ISO 8601 datetime
  analyst_id: string // UUID
  review_status: ReviewStatus

  // Threat and location data
  threat_indicators: ThreatIndicator[]
  geospatial_tags: GeospatialTag[]

  // Embedding
  embedding_status: EmbeddingStatus
  embedding_error?: string

  // Relationships (legacy)
  vector_embedding_id?: string // UUID
  organization_id: string // UUID
  dossier_id?: string // UUID (legacy, superseded by entity_id)

  // NEW: Entity linking
  entity_id?: string // UUID - links to dossiers table
  entity_type?: EntityType

  // NEW: Intelligence type classification
  intelligence_type: IntelligenceType

  // NEW: Cache management
  cache_expires_at?: string // ISO 8601 datetime
  cache_created_at: string // ISO 8601 datetime
  last_refreshed_at: string // ISO 8601 datetime
  refresh_status: RefreshStatus

  // NEW: Data source tracking
  data_sources_metadata: DataSourceMetadata[]

  // NEW: Versioning
  version: number
  parent_version_id?: string // UUID
  version_notes?: string

  // NEW: AnythingLLM integration
  anythingllm_workspace_id?: string
  anythingllm_query?: string
  anythingllm_response_metadata: AnythingLLMMetadata

  // NEW: Refresh operation tracking
  refresh_triggered_by?: string // UUID
  refresh_trigger_type?: RefreshTriggerType
  refresh_duration_ms?: number
  refresh_error_message?: string

  // NEW: Structured key indicators (Feature 029 - Performance optimization)
  metrics?: Record<string, string> | null

  // Audit fields
  created_at: string // ISO 8601 datetime
  updated_at: string // ISO 8601 datetime
  created_by: string // UUID
  updated_by?: string // UUID
  archived_at?: string // ISO 8601 datetime
  retention_until: string // ISO 8601 datetime
}

/**
 * Type for inserting new intelligence reports
 * Omits auto-generated fields
 */
export type IntelligenceReportInsert = Omit<
  IntelligenceReport,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'cache_created_at'
  | 'last_refreshed_at'
  | 'version'
  | 'retention_until'
> & {
  // Make some fields optional for insert
  title_ar?: string
  content_ar?: string
  embedding_status?: EmbeddingStatus
  threat_indicators?: ThreatIndicator[]
  geospatial_tags?: GeospatialTag[]
  intelligence_type?: IntelligenceType
  refresh_status?: RefreshStatus
  data_sources_metadata?: DataSourceMetadata[]
  anythingllm_response_metadata?: AnythingLLMMetadata
}

/**
 * Type for updating intelligence reports
 * All fields optional except id
 */
export type IntelligenceReportUpdate = Partial<
  Omit<IntelligenceReport, 'id' | 'created_at' | 'created_by'>
> & {
  id: string
}

// ============================================================================
// View Types
// ============================================================================

/**
 * Intelligence cache status view
 * Maps to intelligence_cache_status view
 */
export interface IntelligenceCacheStatus {
  entity_id: string // UUID
  entity_name: string
  entity_type: EntityType
  intelligence_type: IntelligenceType
  refresh_status: RefreshStatus
  last_refreshed_at: string // ISO 8601 datetime
  cache_expires_at?: string // ISO 8601 datetime
  is_expired: boolean
  hours_since_refresh: number
  hours_until_expiry?: number
  confidence_score: number
  refresh_triggered_by?: string // UUID
  refresh_trigger_type?: RefreshTriggerType
  refresh_duration_ms?: number
  triggered_by_email?: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request parameters for refreshing intelligence
 * Used by intelligence-refresh Edge Function
 */
export interface RefreshIntelligenceRequest {
  /** Entity (dossier) ID to refresh intelligence for */
  entity_id: string

  /** Specific intelligence types to refresh (or all if not specified) */
  intelligence_types?: IntelligenceType[]

  /** Force refresh even if cache is fresh */
  force?: boolean

  /** Override default TTL (in hours) */
  ttl_hours?: number
}

/**
 * Response from intelligence refresh operation
 */
export interface RefreshIntelligenceResponse {
  /** Whether the refresh was successful */
  success: boolean

  /** Refreshed intelligence reports */
  data?: IntelligenceReport[]

  /** Error message if failed */
  error?: string

  /** Which intelligence types were refreshed */
  refreshed_types: IntelligenceType[]

  /** Which types were already fresh (skipped) */
  skipped_types: IntelligenceType[]

  /** Total duration of refresh operation in milliseconds */
  duration_ms: number
}

/**
 * Request parameters for fetching intelligence
 * Used by intelligence-get Edge Function
 */
export interface GetIntelligenceRequest {
  /** Entity (dossier) ID to fetch intelligence for */
  entity_id: string

  /** Filter by specific intelligence types */
  intelligence_types?: IntelligenceType[]

  /** Include stale/expired intelligence (default: true) */
  include_stale?: boolean

  /** Maximum age in hours (filters out older intelligence) */
  max_age_hours?: number

  /** Return only the latest version */
  latest_only?: boolean
}

/**
 * Response from intelligence fetch operation
 */
export interface GetIntelligenceResponse {
  /** Whether the fetch was successful */
  success: boolean

  /** Retrieved intelligence reports */
  data?: IntelligenceReport[]

  /** Error message if failed */
  error?: string

  /** Cache status summary */
  cache_status: {
    total_reports: number
    fresh_count: number
    stale_count: number
    expired_count: number
  }
}

// ============================================================================
// UI Component Props Types
// ============================================================================

/**
 * Props for inline intelligence widget component
 */
export interface IntelligenceWidgetProps {
  /** Entity (dossier) ID */
  entityId: string

  /** Intelligence type to display */
  intelligenceType: IntelligenceType

  /** Whether to show refresh button */
  showRefreshButton?: boolean

  /** Whether to show last updated timestamp */
  showTimestamp?: boolean

  /** Whether to show confidence score */
  showConfidence?: boolean

  /** Callback when refresh is triggered */
  onRefresh?: () => void

  /** Custom CSS classes */
  className?: string
}

/**
 * Props for intelligence dashboard component
 */
export interface IntelligenceDashboardProps {
  /** Entity (dossier) ID */
  entityId: string

  /** Which intelligence types to display (default: all) */
  intelligenceTypes?: IntelligenceType[]

  /** Enable filtering controls */
  showFilters?: boolean

  /** Enable export functionality */
  showExport?: boolean

  /** Date range filter */
  dateRange?: {
    start: string // ISO 8601 date
    end: string // ISO 8601 date
  }

  /** Minimum confidence level filter (0-100) */
  minConfidence?: number

  /** Callback when data is refreshed */
  onRefresh?: (types: IntelligenceType[]) => void
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type for intelligence grouped by type
 */
export type IntelligenceByType = {
  [K in IntelligenceType]?: IntelligenceReport[]
}

/**
 * Helper type for cache status grouped by type
 */
export type CacheStatusByType = {
  [K in IntelligenceType]?: IntelligenceCacheStatus
}

/**
 * Type guard: Check if intelligence is expired
 */
export function isIntelligenceExpired(report: IntelligenceReport): boolean {
  if (!report.cache_expires_at) return false
  return new Date(report.cache_expires_at) < new Date()
}

/**
 * Type guard: Check if intelligence is stale (expired or error status)
 */
export function isIntelligenceStale(report: IntelligenceReport): boolean {
  return (
    report.refresh_status === 'stale' ||
    report.refresh_status === 'expired' ||
    report.refresh_status === 'error' ||
    isIntelligenceExpired(report)
  )
}

/**
 * Type guard: Check if intelligence is currently refreshing
 */
export function isIntelligenceRefreshing(report: IntelligenceReport): boolean {
  return report.refresh_status === 'refreshing'
}

/**
 * Get human-readable label for intelligence type
 */
export function getIntelligenceTypeLabel(
  type: IntelligenceType,
  language: 'en' | 'ar' = 'en',
): string {
  const labels: Record<IntelligenceType, { en: string; ar: string }> = {
    economic: { en: 'Economic Indicators', ar: 'المؤشرات الاقتصادية' },
    political: { en: 'Political Analysis', ar: 'التحليل السياسي' },
    security: { en: 'Security Assessment', ar: 'تقييم الأمن' },
    bilateral: { en: 'Bilateral Relations', ar: 'العلاقات الثنائية' },
    general: { en: 'General Intelligence', ar: 'معلومات عامة' },
  }

  return labels[type][language]
}

/**
 * Get TTL in milliseconds for intelligence type
 */
export function getIntelligenceTTLMs(type: IntelligenceType): number {
  return INTELLIGENCE_TTL_HOURS[type] * 60 * 60 * 1000
}

/**
 * Calculate time until expiry in milliseconds
 */
export function getTimeUntilExpiry(report: IntelligenceReport): number | null {
  if (!report.cache_expires_at) return null
  return new Date(report.cache_expires_at).getTime() - Date.now()
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(ms: number, language: 'en' | 'ar' = 'en'): string {
  if (ms <= 0) return language === 'en' ? 'Expired' : 'منتهي'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (language === 'ar') {
    if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`
    return `${minutes} دقيقة`
  }

  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// ============================================================================
// All types are already exported at their definition site
// ============================================================================
