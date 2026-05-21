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
 * D-58-06-A-08: low=accent (blue) / normal=muted / high=warning (orange) /
 * critical=destructive. No D-07 (no purple here). text-* drops dark variant
 * per D-09.
 */
export function getUrgencyColor(urgency: RecommendationUrgency): string {
  const colors: Record<RecommendationUrgency, string> = {
    low: 'text-accent',
    normal: 'text-muted-foreground',
    high: 'text-warning',
    critical: 'text-destructive',
  }
  return colors[urgency]
}

/**
 * Get background color for urgency level
 * D-58-06-A-08: matches getUrgencyColor — accent/muted/warning/destructive.
 * bg-* dark variants preserved with alpha bump per D-08.
 */
export function getUrgencyBgColor(urgency: RecommendationUrgency): string {
  const colors: Record<RecommendationUrgency, string> = {
    low: 'bg-accent/10 dark:bg-accent/30',
    normal: 'bg-muted/10 dark:bg-muted/30',
    high: 'bg-warning/10 dark:bg-warning/30',
    critical: 'bg-destructive/10 dark:bg-destructive/30',
  }
  return colors[urgency]
}

/**
 * Get background color for recommendation type
 * D-58-06-A-08: D-07 collision (blue + indigo + purple):
 *   proactive_outreach (blue)     → accent
 *   strategic_opportunity (purple) → secondary (base /10)
 *   follow_up (indigo)             → secondary (sibling step /20)
 *   commitment_reminder (amber)    → warning
 *   relationship_maintenance (green) → success (base /10)
 *   reciprocity_balance (teal)     → success (sibling step /20)
 *   risk_mitigation (red)          → destructive
 */
export function getRecommendationTypeBgColor(type: RecommendationType): string {
  const colors: Record<RecommendationType, string> = {
    proactive_outreach: 'bg-accent/10 dark:bg-accent/30',
    follow_up: 'bg-secondary/20 dark:bg-secondary/40',
    commitment_reminder: 'bg-warning/10 dark:bg-warning/30',
    relationship_maintenance: 'bg-success/10 dark:bg-success/30',
    strategic_opportunity: 'bg-secondary/10 dark:bg-secondary/30',
    risk_mitigation: 'bg-destructive/10 dark:bg-destructive/30',
    reciprocity_balance: 'bg-success/20 dark:bg-success/40',
  }
  return colors[type]
}

/**
 * Get status badge color
 * D-58-06-A-08: D-07 collision (blue + purple):
 *   viewed (blue) → accent
 *   superseded (purple) → secondary
 *   dark:text-* dropped per D-09 (single-string token).
 */
export function getStatusColor(status: RecommendationStatus): string {
  const colors: Record<RecommendationStatus, string> = {
    pending: 'bg-warning/10 text-warning dark:bg-warning/30',
    viewed: 'bg-accent/10 text-accent dark:bg-accent/30',
    accepted: 'bg-success/10 text-success dark:bg-success/30',
    dismissed: 'bg-muted/10 text-muted-foreground dark:bg-muted/30',
    expired: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
    superseded: 'bg-secondary/10 text-secondary-foreground dark:bg-secondary/30',
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
