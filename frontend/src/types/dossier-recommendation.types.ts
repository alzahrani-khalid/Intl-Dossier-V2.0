/**
 * Dossier Recommendation Types
 * Feature: ai-dossier-recommendations
 *
 * Type definitions for proactive dossier recommendations based on
 * pgvector similarity search with explainability.
 */

import type { DossierType } from './dossier.types'

// ============================================================================
// Recommendation Reason Enums
// ============================================================================

/**
 * Why this dossier was recommended
 */
export type DossierRecommendationReason =
  | 'similar_content' // Content similarity via embeddings
  | 'shared_relationships' // Connected to same entities
  | 'topic_overlap' // Overlapping topics/tags
  | 'recent_activity' // Recent activity pattern similarity
  | 'collaboration_history' // Past collaboration patterns
  | 'geographic_proximity' // Same region/country focus
  | 'strategic_alignment' // Strategic priority alignment

/**
 * Status of the recommendation
 */
export type DossierRecommendationStatus =
  | 'pending' // Newly generated
  | 'viewed' // User has seen it
  | 'accepted' // User clicked/navigated
  | 'dismissed' // User dismissed
  | 'expired' // Past relevance window

/**
 * Types of user interactions with recommendations
 */
export type RecommendationInteractionType =
  | 'viewed' // User saw the recommendation in panel
  | 'expanded' // User expanded "Why recommended"
  | 'clicked' // User navigated to recommended dossier
  | 'dismissed' // User dismissed the recommendation
  | 'feedback_positive' // User gave positive feedback
  | 'feedback_negative' // User gave negative feedback

// ============================================================================
// Core Types
// ============================================================================

/**
 * Individual reason breakdown for explainability
 */
export interface ReasonBreakdown {
  reason: DossierRecommendationReason
  weight: number // 0.0-1.0 contribution to overall score
  details: string // Human-readable explanation
}

/**
 * Recommended dossier summary
 */
export interface RecommendedDossierSummary {
  id: string
  name_en: string
  name_ar: string
  dossier_type: DossierType
  description_en: string | null
  description_ar: string | null
}

/**
 * Full dossier recommendation
 */
export interface DossierRecommendation {
  id: string

  // Source and target
  source_dossier_id: string
  recommended_dossier_id: string

  // Scores
  similarity_score: number // 0.0-1.0 from pgvector
  confidence_score: number // 0.0-1.0 overall confidence

  // Explainability (Why recommended)
  primary_reason: DossierRecommendationReason
  reason_breakdown: ReasonBreakdown[]
  explanation_en: string
  explanation_ar: string

  // Status and priority
  status: DossierRecommendationStatus
  priority: number // 1-5

  // Timestamps
  expires_at: string
  created_at: string
  updated_at: string
  viewed_at: string | null
  actioned_at: string | null

  // Organization scoping
  org_id: string

  // Enriched data (from joins)
  recommended_dossier?: RecommendedDossierSummary
  source_dossier?: {
    id: string
    name_en: string
    name_ar: string
    dossier_type: DossierType
  }
}

/**
 * Compact recommendation for list display
 */
export interface DossierRecommendationListItem {
  id: string
  recommended_dossier_id: string
  similarity_score: number
  confidence_score: number
  primary_reason: DossierRecommendationReason
  explanation_en: string
  explanation_ar: string
  status: DossierRecommendationStatus
  priority: number
  reason_breakdown: ReasonBreakdown[]
  // Enriched
  recommended_dossier: RecommendedDossierSummary
}

/**
 * Interaction record
 */
export interface RecommendationInteraction {
  id: string
  recommendation_id: string
  user_id: string
  interaction_type: RecommendationInteractionType
  feedback_text: string | null
  context: Record<string, unknown>
  created_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Parameters for listing recommendations
 */
export interface DossierRecommendationListParams {
  source_dossier_id: string
  status?: DossierRecommendationStatus | DossierRecommendationStatus[]
  min_similarity?: number
  include_expired?: boolean
  limit?: number
  offset?: number
}

/**
 * Paginated recommendation list response
 */
export interface DossierRecommendationListResponse {
  data: DossierRecommendationListItem[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
    total?: number
  }
}

/**
 * Parameters for generating recommendations
 */
export interface GenerateDossierRecommendationsParams {
  source_dossier_id: string
  max_recommendations?: number
}

/**
 * Response from generating recommendations
 */
export interface GenerateDossierRecommendationsResponse {
  message_en: string
  message_ar: string
  recommendations_generated: number
  recommendations: Array<{
    recommendation_id: string
    recommended_dossier_id: string
    similarity_score: number
    primary_reason: DossierRecommendationReason
    explanation_en: string
    explanation_ar: string
  }>
}

/**
 * Parameters for tracking interaction
 */
export interface TrackInteractionParams {
  recommendation_id: string
  interaction_type: RecommendationInteractionType
  feedback_text?: string
  context?: Record<string, unknown>
}

/**
 * Parameters for updating a recommendation
 */
export interface DossierRecommendationUpdateParams {
  status?: DossierRecommendationStatus
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display color for recommendation reason
 */
export function getReasonColor(reason: DossierRecommendationReason): string {
  const colors: Record<DossierRecommendationReason, string> = {
    similar_content: 'text-blue-600 dark:text-blue-400',
    shared_relationships: 'text-purple-600 dark:text-purple-400',
    topic_overlap: 'text-green-600 dark:text-green-400',
    recent_activity: 'text-orange-600 dark:text-orange-400',
    collaboration_history: 'text-indigo-600 dark:text-indigo-400',
    geographic_proximity: 'text-teal-600 dark:text-teal-400',
    strategic_alignment: 'text-amber-600 dark:text-amber-400',
  }
  return colors[reason]
}

/**
 * Get background color for recommendation reason
 */
export function getReasonBgColor(reason: DossierRecommendationReason): string {
  const colors: Record<DossierRecommendationReason, string> = {
    similar_content: 'bg-blue-100 dark:bg-blue-900/30',
    shared_relationships: 'bg-purple-100 dark:bg-purple-900/30',
    topic_overlap: 'bg-green-100 dark:bg-green-900/30',
    recent_activity: 'bg-orange-100 dark:bg-orange-900/30',
    collaboration_history: 'bg-indigo-100 dark:bg-indigo-900/30',
    geographic_proximity: 'bg-teal-100 dark:bg-teal-900/30',
    strategic_alignment: 'bg-amber-100 dark:bg-amber-900/30',
  }
  return colors[reason]
}

/**
 * Get icon name for recommendation reason
 */
export function getReasonIcon(reason: DossierRecommendationReason): string {
  const icons: Record<DossierRecommendationReason, string> = {
    similar_content: 'FileText',
    shared_relationships: 'Network',
    topic_overlap: 'Tags',
    recent_activity: 'Activity',
    collaboration_history: 'Users',
    geographic_proximity: 'MapPin',
    strategic_alignment: 'Target',
  }
  return icons[reason]
}

/**
 * Get display color for similarity score
 */
export function getSimilarityColor(score: number): string {
  if (score >= 0.9) return 'text-green-600 dark:text-green-400'
  if (score >= 0.8) return 'text-blue-600 dark:text-blue-400'
  if (score >= 0.7) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-gray-600 dark:text-gray-400'
}

/**
 * Get status badge color
 */
export function getStatusColor(status: DossierRecommendationStatus): string {
  const colors: Record<DossierRecommendationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    viewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[status]
}

/**
 * Format similarity score as percentage
 */
export function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`
}

/**
 * Check if recommendation is actionable
 */
export function isActionable(recommendation: DossierRecommendation): boolean {
  return recommendation.status === 'pending' || recommendation.status === 'viewed'
}

/**
 * Get priority display color
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 5) return 'text-red-600 dark:text-red-400'
  if (priority >= 4) return 'text-orange-600 dark:text-orange-400'
  if (priority >= 3) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-gray-600 dark:text-gray-400'
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Reason labels (bilingual)
 */
export const REASON_LABELS: Record<DossierRecommendationReason, { en: string; ar: string }> = {
  similar_content: { en: 'Similar Content', ar: 'محتوى مشابه' },
  shared_relationships: { en: 'Shared Connections', ar: 'اتصالات مشتركة' },
  topic_overlap: { en: 'Related Topics', ar: 'مواضيع متعلقة' },
  recent_activity: { en: 'Recent Activity', ar: 'نشاط حديث' },
  collaboration_history: { en: 'Collaboration History', ar: 'تاريخ التعاون' },
  geographic_proximity: { en: 'Same Region', ar: 'نفس المنطقة' },
  strategic_alignment: { en: 'Strategic Alignment', ar: 'توافق استراتيجي' },
}

/**
 * Status labels (bilingual)
 */
export const STATUS_LABELS: Record<DossierRecommendationStatus, { en: string; ar: string }> = {
  pending: { en: 'New', ar: 'جديد' },
  viewed: { en: 'Viewed', ar: 'تمت المشاهدة' },
  accepted: { en: 'Opened', ar: 'تم الفتح' },
  dismissed: { en: 'Dismissed', ar: 'مرفوض' },
  expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
}

/**
 * Priority labels (bilingual)
 */
export const PRIORITY_LABELS: Record<number, { en: string; ar: string }> = {
  1: { en: 'Very Low', ar: 'منخفض جدًا' },
  2: { en: 'Low', ar: 'منخفض' },
  3: { en: 'Medium', ar: 'متوسط' },
  4: { en: 'High', ar: 'مرتفع' },
  5: { en: 'Very High', ar: 'مرتفع جدًا' },
}
