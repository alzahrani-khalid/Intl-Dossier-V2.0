/**
 * Relationship Context - Health Scoring Types
 *
 * Types for the automated relationship health scoring system
 * including scores, trends, alerts, and historical data.
 */

// ============================================================================
// Health Level & Trend Types
// ============================================================================

/**
 * Health level categories based on overall score
 */
export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown'

/**
 * Trend indicator showing score direction
 */
export type HealthTrend = 'improving' | 'stable' | 'declining'

/**
 * Alert severity levels
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Alert type categories
 */
export type AlertType =
  | 'score_critical'
  | 'score_declining'
  | 'engagement_gap'
  | 'commitment_overdue'
  | 'reciprocity_imbalance'
  | 'score_improving'

// ============================================================================
// Score Component Types
// ============================================================================

/**
 * Individual score components
 */
export interface HealthScoreComponents {
  /** Engagement frequency score (0-100) */
  engagement_frequency: number
  /** Commitment compliance score (0-100) */
  commitment_compliance: number
  /** Reciprocity balance score (0-100) */
  reciprocity: number
  /** Interaction quality score (0-100) */
  interaction_quality: number
  /** Recency score (10, 40, 70, or 100) */
  recency: number
}

/**
 * Detailed breakdown of score factors
 */
export interface HealthScoreBreakdown {
  /** Total engagements in last 365 days */
  engagements_365d: number
  /** Engagements in last 90 days */
  engagements_90d: number
  /** Engagements in last 30 days */
  engagements_30d: number
  /** Days since last engagement */
  days_since_engagement: number
  /** Total non-cancelled commitments */
  commitments_total: number
  /** Completed commitments */
  commitments_completed: number
  /** Overdue commitments */
  commitments_overdue: number
  /** Latest engagement date (ISO string or null) */
  latest_engagement_date: string | null
}

// ============================================================================
// Health Score Types
// ============================================================================

/**
 * Compact dossier reference in health responses
 */
export interface HealthDossierReference {
  id: string
  name_en: string
  name_ar: string
  type: string
}

/**
 * Full relationship health score response
 */
export interface RelationshipHealthScore {
  relationship_id: string
  source_dossier: HealthDossierReference
  target_dossier: HealthDossierReference
  /** Overall health score (0-100) or null if insufficient data */
  overall_score: number | null
  /** Current trend direction */
  trend: HealthTrend
  /** Previous score for comparison */
  previous_score: number | null
  /** Individual component scores */
  components: HealthScoreComponents
  /** Detailed breakdown of factors */
  breakdown: HealthScoreBreakdown
  /** Health level category */
  health_level: HealthLevel
  /** When the score was calculated */
  calculated_at: string
  /** Start of the scoring period */
  period_start: string
  /** End of the scoring period */
  period_end: string
}

/**
 * Summary health score (used in lists)
 */
export interface RelationshipHealthSummary {
  relationship_id: string
  source_dossier: HealthDossierReference
  target_dossier: HealthDossierReference
  overall_score: number | null
  trend: HealthTrend
  health_level: HealthLevel
  components: HealthScoreComponents
  days_since_engagement: number
  overdue_commitments: number
}

/**
 * Historical health score record
 */
export interface RelationshipHealthHistory {
  id: string
  relationship_id: string
  overall_score: number
  components: HealthScoreComponents
  period_start: string
  period_end: string
  calculated_at: string
}

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Relationship health alert
 */
export interface RelationshipHealthAlert {
  id: string
  relationship_id: string
  alert_type: AlertType
  severity: AlertSeverity
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  is_read: boolean
  is_dismissed: boolean
  alert_data: Record<string, unknown>
  created_at: string
  expires_at: string | null
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Parameters for listing health scores
 */
export interface HealthScoreListParams {
  limit?: number
  offset?: number
  trend?: HealthTrend
  min_score?: number
  max_score?: number
  sort_by?:
    | 'overall_health_score'
    | 'engagement_frequency_score'
    | 'commitment_compliance_score'
    | 'reciprocity_score'
    | 'days_since_last_engagement'
  sort_order?: 'asc' | 'desc'
}

/**
 * Parameters for listing alerts
 */
export interface AlertListParams {
  include_read?: boolean
  include_dismissed?: boolean
}

/**
 * Paginated health score list response
 */
export interface HealthScoreListResponse {
  data: RelationshipHealthSummary[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Paginated history list response
 */
export interface HealthHistoryListResponse {
  data: RelationshipHealthHistory[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Alert list response
 */
export interface AlertListResponse {
  data: RelationshipHealthAlert[]
}

/**
 * Calculation result response
 */
export interface CalculationResultResponse {
  message_en: string
  message_ar: string
  relationships_updated: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get health level from score
 */
export function getHealthLevelFromScore(score: number | null): HealthLevel {
  if (score === null) return 'unknown'
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  if (score >= 20) return 'poor'
  return 'critical'
}

/**
 * Score component weights for overall calculation
 */
export const SCORE_WEIGHTS = {
  engagement_frequency: 0.25,
  commitment_compliance: 0.35,
  reciprocity: 0.15,
  interaction_quality: 0.1,
  recency: 0.15,
} as const

/**
 * Recency score thresholds
 */
export const RECENCY_THRESHOLDS = {
  recent: { days: 30, score: 100 },
  moderate: { days: 90, score: 70 },
  stale: { days: 180, score: 40 },
  inactive: { days: Infinity, score: 10 },
} as const

/**
 * Minimum engagements required for valid score
 */
export const MIN_ENGAGEMENTS_FOR_SCORE = 3
