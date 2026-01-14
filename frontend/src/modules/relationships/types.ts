/**
 * Relationships Module - Internal Types
 *
 * These types are internal to the Relationships module.
 * Use the DTOs from core/contracts for inter-module communication.
 *
 * @module relationships/types
 */

// ============================================================================
// Internal Entity Types
// ============================================================================

/**
 * Relationship entity as stored in the database
 */
export interface Relationship {
  id: string
  relationship_type: RelationshipType
  source_module: string
  source_entity_type: string
  source_entity_id: string
  source_display_name_en?: string
  source_display_name_ar?: string
  target_module: string
  target_entity_type: string
  target_entity_id: string
  target_display_name_en?: string
  target_display_name_ar?: string
  strength: RelationshipStrength
  status: RelationshipStatus
  direction: RelationshipDirection
  notes?: string
  metadata?: Record<string, unknown>
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Relationship health score
 */
export interface RelationshipHealth {
  id: string
  relationship_id: string
  overall_score: number
  health_level: HealthLevel
  trend: HealthTrend
  factors: HealthFactor[]
  alerts?: HealthAlert[]
  last_interaction?: string
  next_scheduled_interaction?: string
  calculated_at: string
}

/**
 * Health factor contributing to overall score
 */
export interface HealthFactor {
  name: string
  score: number
  weight: number
  description?: string
  recommendation?: string
}

/**
 * Health alert for attention
 */
export interface HealthAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  created_at: string
  acknowledged_at?: string
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type RelationshipType =
  | 'bilateral'
  | 'multilateral'
  | 'partnership'
  | 'collaboration'
  | 'membership'
  | 'agreement'
  | 'parent_child'
  | 'peer'
  | 'reporting'
  | 'other'

export type RelationshipStrength = 'weak' | 'moderate' | 'strong'

export type RelationshipStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type RelationshipDirection = 'unidirectional' | 'bidirectional'

export type HealthLevel = 'critical' | 'poor' | 'fair' | 'good' | 'excellent'

export type HealthTrend = 'declining' | 'stable' | 'improving'

export type AlertType =
  | 'no_recent_interaction'
  | 'declining_health'
  | 'missed_commitment'
  | 'upcoming_event'
  | 'expiring_agreement'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, { en: string; ar: string }> = {
  bilateral: { en: 'Bilateral', ar: 'ثنائي' },
  multilateral: { en: 'Multilateral', ar: 'متعدد الأطراف' },
  partnership: { en: 'Partnership', ar: 'شراكة' },
  collaboration: { en: 'Collaboration', ar: 'تعاون' },
  membership: { en: 'Membership', ar: 'عضوية' },
  agreement: { en: 'Agreement', ar: 'اتفاقية' },
  parent_child: { en: 'Parent-Child', ar: 'علاقة تبعية' },
  peer: { en: 'Peer', ar: 'نظير' },
  reporting: { en: 'Reporting', ar: 'تقارير' },
  other: { en: 'Other', ar: 'أخرى' },
}

export const HEALTH_LEVEL_LABELS: Record<HealthLevel, { en: string; ar: string }> = {
  critical: { en: 'Critical', ar: 'حرج' },
  poor: { en: 'Poor', ar: 'ضعيف' },
  fair: { en: 'Fair', ar: 'مقبول' },
  good: { en: 'Good', ar: 'جيد' },
  excellent: { en: 'Excellent', ar: 'ممتاز' },
}

export const HEALTH_LEVEL_THRESHOLDS: Record<HealthLevel, { min: number; max: number }> = {
  critical: { min: 0, max: 20 },
  poor: { min: 20, max: 40 },
  fair: { min: 40, max: 60 },
  good: { min: 60, max: 80 },
  excellent: { min: 80, max: 100 },
}

// ============================================================================
// Query Types
// ============================================================================

export interface RelationshipSearchParams {
  search?: string
  types?: RelationshipType[]
  strengths?: RelationshipStrength[]
  statuses?: RelationshipStatus[]
  healthLevels?: HealthLevel[]
  sourceModuleId?: string
  sourceEntityType?: string
  sourceEntityId?: string
  targetModuleId?: string
  targetEntityType?: string
  targetEntityId?: string
  entityId?: string // Search both source and target
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'health_score'
  sortDirection?: 'asc' | 'desc'
}

export interface RelationshipCreateParams {
  relationship_type: RelationshipType
  source_module: string
  source_entity_type: string
  source_entity_id: string
  source_display_name_en?: string
  source_display_name_ar?: string
  target_module: string
  target_entity_type: string
  target_entity_id: string
  target_display_name_en?: string
  target_display_name_ar?: string
  strength?: RelationshipStrength
  direction?: RelationshipDirection
  notes?: string
  metadata?: Record<string, unknown>
}

export interface RelationshipUpdateParams {
  relationship_type?: RelationshipType
  strength?: RelationshipStrength
  status?: RelationshipStatus
  notes?: string
  metadata?: Record<string, unknown>
}

export interface NetworkGraphParams {
  centerEntityId: string
  centerModuleId: string
  centerEntityType: string
  depth: number
  includeTypes?: RelationshipType[]
  excludeTypes?: RelationshipType[]
  maxNodes?: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface RelationshipListResponse {
  relationships: Relationship[]
  total: number
  limit: number
  offset?: number
  hasMore: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getHealthLevelFromScore(score: number): HealthLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  if (score >= 20) return 'poor'
  return 'critical'
}

export function getHealthLevelColor(level: HealthLevel): string {
  const colors: Record<HealthLevel, string> = {
    critical: '#ef4444', // red-500
    poor: '#f97316', // orange-500
    fair: '#eab308', // yellow-500
    good: '#22c55e', // green-500
    excellent: '#10b981', // emerald-500
  }
  return colors[level]
}
