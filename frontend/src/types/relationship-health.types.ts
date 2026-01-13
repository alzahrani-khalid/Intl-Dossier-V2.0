/**
 * Relationship Health Scoring Types
 * Feature: relationship-health-scoring
 *
 * Type definitions for the automated relationship health scoring system
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
// Dossier Reference Types
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

// ============================================================================
// Health Score Types
// ============================================================================

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
// API Request/Response Types
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
 * Get CSS color class for health level
 */
export function getHealthLevelColor(level: HealthLevel): string {
  const colors: Record<HealthLevel, string> = {
    excellent: 'text-green-600 dark:text-green-400',
    good: 'text-emerald-600 dark:text-emerald-400',
    fair: 'text-yellow-600 dark:text-yellow-400',
    poor: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
    unknown: 'text-gray-500 dark:text-gray-400',
  }
  return colors[level]
}

/**
 * Get background color class for health level
 */
export function getHealthLevelBgColor(level: HealthLevel): string {
  const colors: Record<HealthLevel, string> = {
    excellent: 'bg-green-100 dark:bg-green-900/30',
    good: 'bg-emerald-100 dark:bg-emerald-900/30',
    fair: 'bg-yellow-100 dark:bg-yellow-900/30',
    poor: 'bg-orange-100 dark:bg-orange-900/30',
    critical: 'bg-red-100 dark:bg-red-900/30',
    unknown: 'bg-gray-100 dark:bg-gray-800',
  }
  return colors[level]
}

/**
 * Get CSS color class for trend
 */
export function getTrendColor(trend: HealthTrend): string {
  const colors: Record<HealthTrend, string> = {
    improving: 'text-green-600 dark:text-green-400',
    stable: 'text-gray-500 dark:text-gray-400',
    declining: 'text-red-600 dark:text-red-400',
  }
  return colors[trend]
}

/**
 * Get icon name for trend
 */
export function getTrendIcon(trend: HealthTrend): string {
  const icons: Record<HealthTrend, string> = {
    improving: 'TrendingUp',
    stable: 'Minus',
    declining: 'TrendingDown',
  }
  return icons[trend]
}

/**
 * Get CSS color class for alert severity
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    low: 'text-blue-600 dark:text-blue-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  }
  return colors[severity]
}

/**
 * Get background color class for alert severity
 */
export function getAlertSeverityBgColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    low: 'bg-blue-100 dark:bg-blue-900/30',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30',
    high: 'bg-orange-100 dark:bg-orange-900/30',
    critical: 'bg-red-100 dark:bg-red-900/30',
  }
  return colors[severity]
}

// ============================================================================
// Constants
// ============================================================================

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

/**
 * Alert type labels
 */
export const ALERT_TYPE_LABELS: Record<AlertType, { en: string; ar: string }> = {
  score_critical: { en: 'Critical Score', ar: 'نقاط حرجة' },
  score_declining: { en: 'Score Declining', ar: 'انخفاض النقاط' },
  engagement_gap: { en: 'Engagement Gap', ar: 'فجوة في التفاعل' },
  commitment_overdue: { en: 'Overdue Commitments', ar: 'التزامات متأخرة' },
  reciprocity_imbalance: { en: 'Reciprocity Imbalance', ar: 'عدم توازن المعاملة بالمثل' },
  score_improving: { en: 'Score Improving', ar: 'تحسن النقاط' },
}

/**
 * Health level labels
 */
export const HEALTH_LEVEL_LABELS: Record<HealthLevel, { en: string; ar: string }> = {
  excellent: { en: 'Excellent', ar: 'ممتاز' },
  good: { en: 'Good', ar: 'جيد' },
  fair: { en: 'Fair', ar: 'مقبول' },
  poor: { en: 'Poor', ar: 'ضعيف' },
  critical: { en: 'Critical', ar: 'حرج' },
  unknown: { en: 'Unknown', ar: 'غير معروف' },
}

/**
 * Trend labels
 */
export const TREND_LABELS: Record<HealthTrend, { en: string; ar: string }> = {
  improving: { en: 'Improving', ar: 'في تحسن' },
  stable: { en: 'Stable', ar: 'مستقر' },
  declining: { en: 'Declining', ar: 'في انخفاض' },
}

/**
 * Component labels
 */
export const COMPONENT_LABELS: Record<keyof HealthScoreComponents, { en: string; ar: string }> = {
  engagement_frequency: { en: 'Engagement Frequency', ar: 'تكرار التفاعل' },
  commitment_compliance: { en: 'Commitment Compliance', ar: 'الالتزام بالوعود' },
  reciprocity: { en: 'Reciprocity', ar: 'المعاملة بالمثل' },
  interaction_quality: { en: 'Interaction Quality', ar: 'جودة التفاعل' },
  recency: { en: 'Recency', ar: 'الحداثة' },
}
