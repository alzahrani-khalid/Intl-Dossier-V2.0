/**
 * Relationship Suggestion Types
 * Feature: ai-relationship-suggestions
 *
 * Type definitions for AI-powered relationship suggestions
 */

import type { RelationshipType, RelationshipStrength } from './person.types'

/**
 * Types of suggestions that can be generated
 */
export type SuggestionType =
  | 'co_event_attendance'
  | 'same_organization'
  | 'shared_role_period'
  | 'organizational_hierarchy'
  | 'shared_affiliation'
  | 'mutual_connection'
  | 'expertise_match'

/**
 * Suggestion status
 */
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

/**
 * A single relationship suggestion
 */
export interface RelationshipSuggestion {
  suggested_person_id: string
  suggested_person_name_en: string
  suggested_person_name_ar: string
  suggested_person_photo_url: string | null
  suggested_person_title_en: string | null
  suggestion_type: SuggestionType
  confidence_score: number
  suggested_relationship_type: RelationshipType
  context_notes_en: string
  context_notes_ar: string
  evidence: SuggestionEvidence
}

/**
 * Evidence supporting a suggestion
 */
export interface SuggestionEvidence {
  shared_event_count?: number
  shared_events?: Array<{
    event_id: string
    event_name_en: string
    event_name_ar: string
    event_date: string
    their_role: string
    your_role: string
  }>
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  affiliation_type?: string
  their_role?: string
  their_department?: string
  both_current?: boolean
  mutual_contacts?: string[]
}

/**
 * Suggestion grouped by type
 */
export interface SuggestionsByType {
  [key: string]: RelationshipSuggestion[]
}

/**
 * Summary of suggestions
 */
export interface SuggestionSummary {
  total_suggestions: number
  existing_relationship_count: number
  has_no_relationships: boolean
  suggestion_types: Array<{
    type: SuggestionType
    count: number
    avg_confidence: number
  }>
  high_confidence_count: number
}

/**
 * API response for getting suggestions
 */
export interface GetSuggestionsResponse {
  suggestions: RelationshipSuggestion[]
  grouped_by_type: SuggestionsByType
  summary: SuggestionSummary
  metadata: {
    person_id: string
    generated_at: string
    limit: number
  }
}

/**
 * Request to create bulk relationships
 */
export interface BulkCreateRelationshipsRequest {
  person_id: string
  relationships: Array<{
    to_person_id: string
    relationship_type: RelationshipType
    strength?: RelationshipStrength
    notes?: string
  }>
}

/**
 * Result of a single relationship creation
 */
export interface BulkCreateResult {
  created_id: string | null
  to_person_id: string
  relationship_type: string
  success: boolean
  error_message: string | null
}

/**
 * API response for bulk create
 */
export interface BulkCreateResponse {
  success: boolean
  results: BulkCreateResult[]
  summary: {
    total_requested: number
    created_count: number
    failed_count: number
  }
  message: string
  message_ar: string
}

/**
 * Request to reject a suggestion
 */
export interface RejectSuggestionRequest {
  person_id: string
  suggested_person_id: string
  suggestion_type: SuggestionType
}

/**
 * Labels for suggestion types
 */
export const SUGGESTION_TYPE_LABELS: Record<SuggestionType, { en: string; ar: string }> = {
  co_event_attendance: { en: 'Met at Events', ar: 'التقى في فعاليات' },
  same_organization: { en: 'Same Organization', ar: 'نفس المنظمة' },
  shared_role_period: { en: 'Overlapping Roles', ar: 'أدوار متداخلة' },
  organizational_hierarchy: { en: 'Organizational Hierarchy', ar: 'التسلسل التنظيمي' },
  shared_affiliation: { en: 'Shared Affiliation', ar: 'انتساب مشترك' },
  mutual_connection: { en: 'Mutual Connections', ar: 'اتصالات مشتركة' },
  expertise_match: { en: 'Similar Expertise', ar: 'خبرات متشابهة' },
}

/**
 * Icons for suggestion types
 */
export const SUGGESTION_TYPE_ICONS: Record<SuggestionType, string> = {
  co_event_attendance: 'calendar',
  same_organization: 'building2',
  shared_role_period: 'briefcase',
  organizational_hierarchy: 'git-branch',
  shared_affiliation: 'users',
  mutual_connection: 'network',
  expertise_match: 'lightbulb',
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(score: number): {
  en: string
  ar: string
  variant: 'high' | 'medium' | 'low'
} {
  if (score >= 0.85) {
    return { en: 'Very Likely', ar: 'مرجح جدا', variant: 'high' }
  } else if (score >= 0.7) {
    return { en: 'Likely', ar: 'مرجح', variant: 'medium' }
  } else {
    return { en: 'Possible', ar: 'محتمل', variant: 'low' }
  }
}
