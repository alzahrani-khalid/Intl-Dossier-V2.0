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
 * Duplicate candidate with entity details (for display)
 */
export interface DuplicateCandidateWithEntities extends DuplicateCandidate {
  source_dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
  }
  target_dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
  }
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

/**
 * Merge preview showing what will be transferred
 */
export interface MergePreview {
  primary_entity: {
    id: string
    name_en: string
    name_ar: string
    type: DuplicateEntityType
  }
  duplicate_entity: {
    id: string
    name_en: string
    name_ar: string
    type: DuplicateEntityType
  }
  fields_to_merge: Array<{
    field: string
    primary_value: unknown
    duplicate_value: unknown
    recommended_resolution: 'primary' | 'duplicate' | 'merge'
  }>
  relationships_to_transfer: number
  roles_to_transfer: number
  affiliations_to_transfer: number
  engagements_to_transfer: number
  documents_to_transfer: number
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
 * Request to search for duplicates
 */
export interface DuplicateSearchParams {
  entity_id: string
  type: DuplicateEntityType
  threshold?: number
  limit?: number
}

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
 * Request to merge duplicates
 */
export interface MergeRequest {
  primary_entity_id: string
  duplicate_entity_id: string
  field_resolutions?: Record<string, FieldResolution>
  reason?: string
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

/**
 * Request to dismiss a duplicate candidate
 */
export interface DismissRequest {
  reason?: string
}

/**
 * Response from dismiss operation
 */
export interface DismissResponse {
  success: boolean
  candidate_id: string
}

// ============================================================================
// UI Component Types
// ============================================================================

/**
 * Props for duplicate candidate card
 */
export interface DuplicateCandidateCardProps {
  candidate: DuplicateCandidateListItem
  onMerge: (candidate: DuplicateCandidateListItem) => void
  onDismiss: (candidate: DuplicateCandidateListItem) => void
  onViewDetails: (candidate: DuplicateCandidateListItem) => void
  isLoading?: boolean
}

/**
 * Props for merge dialog
 */
export interface MergeDialogProps {
  isOpen: boolean
  onClose: () => void
  candidate: DuplicateCandidateListItem | null
  onMerge: (
    primaryId: string,
    duplicateId: string,
    resolutions?: Record<string, FieldResolution>,
  ) => void
  isLoading?: boolean
}

/**
 * Entity comparison data for merge preview
 */
export interface EntityComparisonData {
  field: string
  label_en: string
  label_ar: string
  primary_value: unknown
  duplicate_value: unknown
  is_different: boolean
  can_merge: boolean
}

// ============================================================================
// Helper Functions Types
// ============================================================================

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high'
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

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

/**
 * Labels for duplicate status
 */
export const DUPLICATE_STATUS_LABELS: Record<DuplicateCandidateStatus, { en: string; ar: string }> =
  {
    pending: { en: 'Pending Review', ar: 'في انتظار المراجعة' },
    confirmed: { en: 'Confirmed Duplicate', ar: 'تكرار مؤكد' },
    not_duplicate: { en: 'Not a Duplicate', ar: 'ليس تكراراً' },
    merged: { en: 'Merged', ar: 'تم الدمج' },
    auto_dismissed: { en: 'Auto-Dismissed', ar: 'مرفوض تلقائياً' },
  }

/**
 * Labels for detection source
 */
export const DETECTION_SOURCE_LABELS: Record<DetectionSource, { en: string; ar: string }> = {
  auto_scan: { en: 'Automatic Scan', ar: 'فحص تلقائي' },
  on_create: { en: 'On Creation', ar: 'عند الإنشاء' },
  manual_search: { en: 'Manual Search', ar: 'بحث يدوي' },
  bulk_import: { en: 'Bulk Import', ar: 'استيراد مجمع' },
}
