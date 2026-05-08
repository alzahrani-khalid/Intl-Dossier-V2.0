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

// ============================================================================
// UI Component Props Types
// ============================================================================

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard: Check if intelligence is expired
 */
export function isIntelligenceExpired(report: IntelligenceReport): boolean {
  if (!report.cache_expires_at) return false
  return new Date(report.cache_expires_at) < new Date()
}

// ============================================================================
// All types are already exported at their definition site
// ============================================================================
