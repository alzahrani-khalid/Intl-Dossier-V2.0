/**
 * Relationship Context - Label Constants
 *
 * Bilingual label constants for relationship types, statuses,
 * health levels, and other enumerated values.
 */

import type { RelationshipType, RelationshipStatus } from './relationship'
import type {
  HealthLevel,
  HealthTrend,
  AlertType,
  AlertSeverity,
  HealthScoreComponents,
} from './health'

/**
 * Labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, { en: string; ar: string }> = {
  member_of: { en: 'Member Of', ar: 'عضو في' },
  participates_in: { en: 'Participates In', ar: 'يشارك في' },
  cooperates_with: { en: 'Cooperates With', ar: 'يتعاون مع' },
  bilateral_relation: { en: 'Bilateral Relation', ar: 'علاقة ثنائية' },
  partnership: { en: 'Partnership', ar: 'شراكة' },
  parent_of: { en: 'Parent Of', ar: 'الأصل' },
  subsidiary_of: { en: 'Subsidiary Of', ar: 'فرع من' },
  related_to: { en: 'Related To', ar: 'مرتبط بـ' },
  represents: { en: 'Represents', ar: 'يمثل' },
  hosted_by: { en: 'Hosted By', ar: 'مستضاف من قبل' },
  sponsored_by: { en: 'Sponsored By', ar: 'برعاية' },
  involves: { en: 'Involves', ar: 'يتضمن' },
  discusses: { en: 'Discusses', ar: 'يناقش' },
  participant_in: { en: 'Participant In', ar: 'مشارك في' },
  observer_of: { en: 'Observer Of', ar: 'مراقب لـ' },
  affiliate_of: { en: 'Affiliate Of', ar: 'منتسب لـ' },
  successor_of: { en: 'Successor Of', ar: 'خلف لـ' },
  predecessor_of: { en: 'Predecessor Of', ar: 'سابق لـ' },
  // Legacy types
  membership: { en: 'Membership', ar: 'عضوية' },
  parent_child: { en: 'Parent-Child', ar: 'أصل-فرع' },
  participation: { en: 'Participation', ar: 'مشاركة' },
  affiliation: { en: 'Affiliation', ar: 'انتساب' },
  dependency: { en: 'Dependency', ar: 'تبعية' },
  collaboration: { en: 'Collaboration', ar: 'تعاون' },
}

/**
 * Labels for relationship status
 */
export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشط' },
  historical: { en: 'Historical', ar: 'تاريخي' },
  terminated: { en: 'Terminated', ar: 'منتهي' },
}

/**
 * Labels for health levels
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
 * Labels for health trends
 */
export const TREND_LABELS: Record<HealthTrend, { en: string; ar: string }> = {
  improving: { en: 'Improving', ar: 'في تحسن' },
  stable: { en: 'Stable', ar: 'مستقر' },
  declining: { en: 'Declining', ar: 'في انخفاض' },
}

/**
 * Labels for alert types
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
 * Labels for alert severity
 */
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, { en: string; ar: string }> = {
  low: { en: 'Low', ar: 'منخفض' },
  medium: { en: 'Medium', ar: 'متوسط' },
  high: { en: 'High', ar: 'مرتفع' },
  critical: { en: 'Critical', ar: 'حرج' },
}

/**
 * Labels for score components
 */
export const COMPONENT_LABELS: Record<keyof HealthScoreComponents, { en: string; ar: string }> = {
  engagement_frequency: { en: 'Engagement Frequency', ar: 'تكرار التفاعل' },
  commitment_compliance: { en: 'Commitment Compliance', ar: 'الالتزام بالوعود' },
  reciprocity: { en: 'Reciprocity', ar: 'المعاملة بالمثل' },
  interaction_quality: { en: 'Interaction Quality', ar: 'جودة التفاعل' },
  recency: { en: 'Recency', ar: 'الحداثة' },
}

// ============================================================================
// Label Getter Functions
// ============================================================================

export function getRelationshipTypeLabel(type: RelationshipType, language: 'en' | 'ar'): string {
  return RELATIONSHIP_TYPE_LABELS[type]?.[language] || type
}

export function getRelationshipStatusLabel(
  status: RelationshipStatus,
  language: 'en' | 'ar',
): string {
  return RELATIONSHIP_STATUS_LABELS[status]?.[language] || status
}

export function getHealthLevelLabel(level: HealthLevel, language: 'en' | 'ar'): string {
  return HEALTH_LEVEL_LABELS[level]?.[language] || level
}

export function getTrendLabel(trend: HealthTrend, language: 'en' | 'ar'): string {
  return TREND_LABELS[trend]?.[language] || trend
}

export function getAlertTypeLabel(type: AlertType, language: 'en' | 'ar'): string {
  return ALERT_TYPE_LABELS[type]?.[language] || type
}

export function getAlertSeverityLabel(severity: AlertSeverity, language: 'en' | 'ar'): string {
  return ALERT_SEVERITY_LABELS[severity]?.[language] || severity
}

export function getComponentLabel(
  component: keyof HealthScoreComponents,
  language: 'en' | 'ar',
): string {
  return COMPONENT_LABELS[component]?.[language] || component
}

// ============================================================================
// Color Classes
// ============================================================================

/**
 * Health level color classes
 */
export const HEALTH_LEVEL_COLORS: Record<HealthLevel, string> = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-emerald-600 dark:text-emerald-400',
  fair: 'text-yellow-600 dark:text-yellow-400',
  poor: 'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
  unknown: 'text-gray-500 dark:text-gray-400',
}

/**
 * Health level background color classes
 */
export const HEALTH_LEVEL_BG_COLORS: Record<HealthLevel, string> = {
  excellent: 'bg-green-100 dark:bg-green-900/30',
  good: 'bg-emerald-100 dark:bg-emerald-900/30',
  fair: 'bg-yellow-100 dark:bg-yellow-900/30',
  poor: 'bg-orange-100 dark:bg-orange-900/30',
  critical: 'bg-red-100 dark:bg-red-900/30',
  unknown: 'bg-gray-100 dark:bg-gray-800',
}

/**
 * Trend color classes
 */
export const TREND_COLORS: Record<HealthTrend, string> = {
  improving: 'text-green-600 dark:text-green-400',
  stable: 'text-gray-500 dark:text-gray-400',
  declining: 'text-red-600 dark:text-red-400',
}

/**
 * Alert severity color classes
 */
export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: 'text-blue-600 dark:text-blue-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
}

/**
 * Alert severity background color classes
 */
export const ALERT_SEVERITY_BG_COLORS: Record<AlertSeverity, string> = {
  low: 'bg-blue-100 dark:bg-blue-900/30',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30',
  high: 'bg-orange-100 dark:bg-orange-900/30',
  critical: 'bg-red-100 dark:bg-red-900/30',
}

/**
 * Relationship status color classes
 */
export const RELATIONSHIP_STATUS_COLORS: Record<RelationshipStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  historical: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

/**
 * Trend icon names
 */
export const TREND_ICONS: Record<HealthTrend, string> = {
  improving: 'TrendingUp',
  stable: 'Minus',
  declining: 'TrendingDown',
}
