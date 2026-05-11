/**
 * Duplicate Detection Types
 * Feature: entity-duplicate-detection
 *
 * Type definitions for entity duplicate detection and merge functionality
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Entity types that support duplicate detection
 */
export type DuplicateEntityType = 'person' | 'organization'

/**
 * Status of a duplicate candidate
 */
export type DuplicateCandidateStatus =
  | 'pending' // Awaiting review
  | 'confirmed' // Confirmed as duplicate, ready to merge
  | 'not_duplicate' // Reviewed, determined not duplicate
  | 'merged' // Successfully merged
  | 'auto_dismissed' // Auto-dismissed by system

/**
 * How the duplicate was detected
 */
export type DetectionSource =
  | 'auto_scan' // Periodic background scan
  | 'on_create' // Detected during entity creation
  | 'manual_search' // User-initiated search
  | 'bulk_import' // Detected during bulk import

/**
 * Confidence level of duplicate match
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  high: 0.85,
  medium: 0.7,
  low: 0.6,
} as const

// ============================================================================
// Duplicate Candidate Types
// ============================================================================

/**
 * Match details showing which fields matched
 */
export interface MatchDetails {
  matching_fields: string[]
  weights: {
    name: number
    name_ar: number
    email: number
    phone: number
    organization?: number
    attributes: number
  }
  person1?: {
    name_en: string
    email?: string
    phone?: string
  }
  person2?: {
    name_en: string
    email?: string
    phone?: string
  }
  org1?: {
    name_en: string
    org_code?: string
    email?: string
  }
  org2?: {
    name_en: string
    org_code?: string
    email?: string
  }
}

/**
 * A potential duplicate candidate pair
 */
export interface DuplicateCandidate {
  id: string
  source_entity_id: string
  target_entity_id: string
  entity_type: DuplicateEntityType
  overall_score: number
  name_similarity?: number
  name_ar_similarity?: number
  email_similarity?: number
  phone_similarity?: number
  organization_match?: boolean
  attribute_similarity?: number
  match_details: MatchDetails
  status: DuplicateCandidateStatus
  decision_reason?: string
  confidence_level: ConfidenceLevel
  detection_source: DetectionSource
  detected_at: string
  detected_by?: string
  resolved_at?: string
  resolved_by?: string
  created_at: string
  updated_at: string
}

/**
 * Duplicate candidate list item (compact)
 */
export interface DuplicateCandidateListItem {
  id: string
  source_entity_id: string
  source_name_en: string
  source_name_ar: string
  target_entity_id: string
  target_name_en: string
  target_name_ar: string
  entity_type: DuplicateEntityType
  overall_score: number
  confidence_level: ConfidenceLevel
  match_details: MatchDetails
  detected_at: string
}

// ============================================================================
// Search Result Types
// ============================================================================

/**
 * Result from searching for duplicates of a specific entity
 */
export interface DuplicateSearchResult {
  candidate_id: string
  candidate_name_en: string
  candidate_name_ar: string
  overall_score: number
  name_similarity: number
  email_similarity: number
  phone_similarity: number
  organization_match: boolean
  match_details: MatchDetails
  confidence_level: ConfidenceLevel
}

/**
 * Response from duplicate search
 */
export interface DuplicateSearchResponse {
  entity_id: string
  entity_type: DuplicateEntityType
  candidates: DuplicateSearchResult[]
}

// ============================================================================
// Merge Types
// ============================================================================

/**
 * Field resolution for merging - which entity's value to keep
 */
export interface FieldResolution {
  field: string
  source: 'primary' | 'duplicate' | 'both' | 'neither'
  primary_value?: unknown
  duplicate_value?: unknown
  merged_value?: unknown
}

/**
 * Merge history record
 */
export interface MergeHistoryRecord {
  id: string
  primary_entity_id: string
  merged_entity_id: string
  merged_entity_name?: string
  entity_type: DuplicateEntityType
  duplicate_candidate_id?: string
  merged_entity_snapshot: Record<string, unknown>
  transferred_relationships: unknown[]
  transferred_roles: unknown[]
  transferred_affiliations: unknown[]
  transferred_engagements: unknown[]
  transferred_documents: unknown[]
  field_resolutions: Record<string, FieldResolution>
  merged_at: string
  merged_by: string
  merged_by_name?: string
  merge_reason?: string
  can_undo: boolean
  undo_expires_at?: string
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * Duplicate detection settings for an entity type
 */
export interface DuplicateDetectionSettings {
  id: string
  entity_type: DuplicateEntityType
  auto_detect_threshold: number
  suggest_threshold: number
  name_weight: number
  name_ar_weight: number
  email_weight: number
  phone_weight: number
  organization_weight: number
  attribute_weight: number
  scan_recent_days: number
  max_candidates_per_entity: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Settings update request
 */
export interface SettingsUpdateRequest {
  auto_detect_threshold?: number
  suggest_threshold?: number
  name_weight?: number
  name_ar_weight?: number
  email_weight?: number
  phone_weight?: number
  organization_weight?: number
  attribute_weight?: number
  scan_recent_days?: number
  max_candidates_per_entity?: number
  is_enabled?: boolean
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to list duplicate candidates
 */
export interface DuplicateCandidatesListParams {
  entity_type?: DuplicateEntityType
  confidence_level?: ConfidenceLevel
  status?: DuplicateCandidateStatus
  limit?: number
  offset?: number
}

/**
 * Response for listing duplicate candidates
 */
export interface DuplicateCandidatesListResponse {
  data: DuplicateCandidateListItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Request to trigger duplicate scan
 */
export interface DuplicateScanRequest {
  entity_type: DuplicateEntityType
  days_back?: number
  batch_size?: number
}

/**
 * Response from duplicate scan
 */
export interface DuplicateScanResponse {
  success: boolean
  candidates_found: number
  entity_type: DuplicateEntityType
}

/**
 * Response from merge operation
 */
export interface MergeResponse {
  success: boolean
  merge_id: string
  candidate_id?: string
  primary_entity_id: string
  merged_entity_id: string
}

// ============================================================================
// UI Component Types
// ============================================================================

// ============================================================================
// Helper Functions Types
// ============================================================================

/**
 * Get confidence level color
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-red-600 bg-red-100'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100'
    case 'low':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * Labels for confidence levels
 */
export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, { en: string; ar: string }> = {
  high: { en: 'High Confidence', ar: 'ثقة عالية' },
  medium: { en: 'Medium Confidence', ar: 'ثقة متوسطة' },
  low: { en: 'Low Confidence', ar: 'ثقة منخفضة' },
}
