/**
 * Engagement Recommendation Types
 * Feature: predictive-engagement-recommendations
 *
 * Type definitions for AI-driven engagement recommendations based on
 * relationship health, upcoming events, commitment deadlines, and strategic priorities.
 */

// ============================================================================
// Recommendation Type Enums
// ============================================================================

/**
 * Types of engagement recommendations
 */
export type RecommendationType =
  | 'proactive_outreach' // Relationship needs attention, initiate contact
  | 'follow_up' // Follow up on previous engagement
  | 'commitment_reminder' // Upcoming commitment deadline
  | 'relationship_maintenance' // Regular maintenance engagement
  | 'strategic_opportunity' // Strategic timing opportunity
  | 'risk_mitigation' // Prevent relationship degradation
  | 'reciprocity_balance' // Balance one-sided relationship

/**
 * Suggested engagement format
 */
export type SuggestedFormat =
  | 'in_person'
  | 'virtual'
  | 'hybrid'
  | 'phone_call'
  | 'email'
  | 'formal_letter'

/**
 * Urgency level of the recommendation
 */
export type RecommendationUrgency = 'low' | 'normal' | 'high' | 'critical'

/**
 * Status of the recommendation
 */
export type RecommendationStatus =
  | 'pending' // Newly generated, awaiting action
  | 'viewed' // User has seen the recommendation
  | 'accepted' // User accepted and acted on it
  | 'dismissed' // User dismissed the recommendation
  | 'expired' // Past optimal window
  | 'superseded' // Replaced by newer recommendation

/**
 * Feedback type for recommendations
 */
export type RecommendationFeedbackType =
  | 'helpful' // Recommendation was helpful
  | 'not_helpful' // Recommendation was not helpful
  | 'timing_wrong' // Timing suggestion was off
  | 'already_planned' // Already had plans for this
  | 'not_relevant' // Not relevant to current priorities
  | 'too_early' // Recommendation came too early
  | 'too_late' // Recommendation came too late

// ============================================================================
// Core Recommendation Types
// ============================================================================

/**
 * Reasoning factor that contributed to the recommendation
 */
export interface RecommendationFactor {
  name: string
  value: number | null
  weight: number
  contribution?: number
}

/**
 * Full reasoning breakdown for transparency
 */
export interface RecommendationReasoning {
  factors: RecommendationFactor[]
  triggers: string[]
  days_since_engagement?: number
  overdue_commitments?: number
  trend?: 'improving' | 'stable' | 'declining'
  strategic_context?: string
}

/**
 * Full engagement recommendation
 */
export interface EngagementRecommendation {
  id: string
  relationship_id: string
  target_dossier_id: string
  recommendation_type: RecommendationType
  priority: number // 1-5
  confidence_score: number // 0.0-1.0

  // Content (bilingual)
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string

  // Suggested action
  suggested_action_en: string
  suggested_action_ar: string
  suggested_engagement_type?: string
  suggested_format?: SuggestedFormat

  // Optimal timing
  optimal_date_start?: string
  optimal_date_end?: string
  optimal_timing_reason_en?: string
  optimal_timing_reason_ar?: string

  urgency: RecommendationUrgency
  reasoning: RecommendationReasoning

  // Related entities
  related_commitment_ids: string[]
  related_calendar_event_ids: string[]

  // Status
  status: RecommendationStatus
  viewed_at?: string
  viewed_by?: string
  actioned_at?: string
  actioned_by?: string
  action_notes?: string
  resulting_engagement_id?: string

  expires_at: string
  created_at: string
  updated_at: string
}

/**
 * Recommendation with enriched data (from summary view)
 */
export interface EngagementRecommendationSummary extends EngagementRecommendation {
  // Relationship info
  relationship_type?: string
  relationship_status?: string

  // Source dossier info
  source_dossier_name_en?: string
  source_dossier_name_ar?: string
  source_dossier_type?: string

  // Target dossier info
  target_dossier_name_en?: string
  target_dossier_name_ar?: string
  target_dossier_type?: string

  // Health score
  relationship_health_score?: number
  relationship_health_trend?: 'improving' | 'stable' | 'declining'
}

/**
 * Compact recommendation for list display
 */
export interface EngagementRecommendationListItem {
  id: string
  relationship_id: string
  target_dossier_id: string
  recommendation_type: RecommendationType
  priority: number
  confidence_score: number
  title_en: string
  title_ar: string
  urgency: RecommendationUrgency
  status: RecommendationStatus
  optimal_date_start?: string
  optimal_date_end?: string
  expires_at: string
  created_at: string
  // Enriched
  target_dossier_name_en?: string
  target_dossier_name_ar?: string
  target_dossier_type?: string
  relationship_health_score?: number
}

// ============================================================================
// Feedback Types
// ============================================================================

/**
 * Feedback on a recommendation
 */
export interface RecommendationFeedback {
  id: string
  recommendation_id: string
  feedback_type: RecommendationFeedbackType
  feedback_text?: string
  user_id: string
  created_at: string
}

/**
 * Input for creating feedback
 */
export interface RecommendationFeedbackCreate {
  feedback_type: RecommendationFeedbackType
  feedback_text?: string
}

// ============================================================================
// Batch/Generation Types
// ============================================================================

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Parameters for listing recommendations
 */
export interface RecommendationListParams {
  status?: RecommendationStatus | RecommendationStatus[]
  recommendation_type?: RecommendationType | RecommendationType[]
  urgency?: RecommendationUrgency | RecommendationUrgency[]
  min_priority?: number
  min_confidence?: number
  target_dossier_id?: string
  relationship_id?: string
  include_expired?: boolean
  sort_by?: 'priority' | 'confidence_score' | 'created_at' | 'optimal_date_start' | 'urgency'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Paginated recommendation list response
 */
export interface RecommendationListResponse {
  data: EngagementRecommendationListItem[]
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
export interface GenerateRecommendationsParams {
  relationship_ids?: string[]
  force_regenerate?: boolean
}

/**
 * Response from generating recommendations
 */
export interface GenerateRecommendationsResponse {
  message_en: string
  message_ar: string
  recommendations_generated: number
  batch_id: string
}

/**
 * Parameters for updating a recommendation
 */
export interface RecommendationUpdateParams {
  status?: RecommendationStatus
  action_notes?: string
  resulting_engagement_id?: string
}

// ============================================================================
// Dashboard/Stats Types
// ============================================================================

/**
 * Recommendation statistics for dashboard
 */
export interface RecommendationStats {
  total_pending: number
  total_viewed: number
  high_priority_count: number
  critical_urgency_count: number
  by_type: Record<RecommendationType, number>
  by_urgency: Record<RecommendationUrgency, number>
  acceptance_rate: number // Percentage of accepted vs total actioned
  average_confidence: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display color for urgency level
 */
export function getUrgencyColor(urgency: RecommendationUrgency): string {
  const colors: Record<RecommendationUrgency, string> = {
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    low: 'text-blue-600 dark:text-blue-400',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    normal: 'text-gray-600 dark:text-gray-400',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    high: 'text-orange-600 dark:text-orange-400',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    critical: 'text-red-600 dark:text-red-400',
  }
  return colors[urgency]
}

/**
 * Get background color for urgency level
 */
export function getUrgencyBgColor(urgency: RecommendationUrgency): string {
  const colors: Record<RecommendationUrgency, string> = {
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    low: 'bg-blue-100 dark:bg-blue-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    normal: 'bg-gray-100 dark:bg-gray-800',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    high: 'bg-orange-100 dark:bg-orange-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    critical: 'bg-red-100 dark:bg-red-900/30',
  }
  return colors[urgency]
}

/**
 * Get background color for recommendation type
 */
export function getRecommendationTypeBgColor(type: RecommendationType): string {
  const colors: Record<RecommendationType, string> = {
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    proactive_outreach: 'bg-blue-100 dark:bg-blue-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    follow_up: 'bg-indigo-100 dark:bg-indigo-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    commitment_reminder: 'bg-amber-100 dark:bg-amber-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    relationship_maintenance: 'bg-green-100 dark:bg-green-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    strategic_opportunity: 'bg-purple-100 dark:bg-purple-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    risk_mitigation: 'bg-red-100 dark:bg-red-900/30',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    reciprocity_balance: 'bg-teal-100 dark:bg-teal-900/30',
  }
  return colors[type]
}

/**
 * Get status badge color
 */
export function getStatusColor(status: RecommendationStatus): string {
  const colors: Record<RecommendationStatus, string> = {
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    viewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#engagement-recommendation.types
    superseded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  }
  return colors[status]
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

/**
 * Check if recommendation is expiring soon (within 7 days)
 */
export function isExpiringSoon(recommendation: EngagementRecommendation): boolean {
  const expiresAt = new Date(recommendation.expires_at)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  return expiresAt <= sevenDaysFromNow && expiresAt > new Date()
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Recommendation type labels
 */
export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, { en: string; ar: string }> = {
  proactive_outreach: { en: 'Proactive Outreach', ar: 'تواصل استباقي' },
  follow_up: { en: 'Follow Up', ar: 'متابعة' },
  commitment_reminder: { en: 'Commitment Reminder', ar: 'تذكير بالالتزام' },
  relationship_maintenance: { en: 'Relationship Maintenance', ar: 'صيانة العلاقة' },
  strategic_opportunity: { en: 'Strategic Opportunity', ar: 'فرصة استراتيجية' },
  risk_mitigation: { en: 'Risk Mitigation', ar: 'تخفيف المخاطر' },
  reciprocity_balance: { en: 'Reciprocity Balance', ar: 'توازن المعاملة بالمثل' },
}

/**
 * Urgency labels
 */
export const URGENCY_LABELS: Record<RecommendationUrgency, { en: string; ar: string }> = {
  low: { en: 'Low', ar: 'منخفض' },
  normal: { en: 'Normal', ar: 'عادي' },
  high: { en: 'High', ar: 'مرتفع' },
  critical: { en: 'Critical', ar: 'حرج' },
}

/**
 * Status labels
 */
export const STATUS_LABELS: Record<RecommendationStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  viewed: { en: 'Viewed', ar: 'تمت المشاهدة' },
  accepted: { en: 'Accepted', ar: 'مقبول' },
  dismissed: { en: 'Dismissed', ar: 'مرفوض' },
  expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
  superseded: { en: 'Superseded', ar: 'تم استبداله' },
}
