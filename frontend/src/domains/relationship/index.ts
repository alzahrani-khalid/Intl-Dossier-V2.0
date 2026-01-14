/**
 * Relationship Bounded Context - Public API
 *
 * This module exports all public types, hooks, and services
 * from the Relationship context.
 *
 * Import from this module:
 * ```typescript
 * import {
 *   useRelationships,
 *   useRelationship,
 *   RelationshipWithDossiers,
 *   relationshipService
 * } from '@/domains/relationship'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

// Relationship Types
export type {
  RelationshipType,
  RelationshipStatus,
  Relationship,
  RelationshipWithDossiers,
  RelationshipListItem,
  RelationshipCreate,
  RelationshipUpdate,
  RelationshipFilters,
  RelationshipDirection,
} from './types/relationship'
export {
  isActiveRelationship,
  isBidirectionalType,
  getInverseRelationshipType,
  getRelationshipDirection,
} from './types/relationship'

// Health Types
export type {
  HealthLevel,
  HealthTrend,
  AlertSeverity,
  AlertType,
  HealthScoreComponents,
  HealthScoreBreakdown,
  HealthDossierReference,
  RelationshipHealthScore,
  RelationshipHealthSummary,
  RelationshipHealthHistory,
  RelationshipHealthAlert,
  HealthScoreListParams,
  AlertListParams,
  HealthScoreListResponse,
  HealthHistoryListResponse,
  AlertListResponse,
  CalculationResultResponse,
} from './types/health'
export {
  getHealthLevelFromScore,
  SCORE_WEIGHTS,
  RECENCY_THRESHOLDS,
  MIN_ENGAGEMENTS_FOR_SCORE,
} from './types/health'

// Labels
export {
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_STATUS_LABELS,
  HEALTH_LEVEL_LABELS,
  TREND_LABELS,
  ALERT_TYPE_LABELS,
  ALERT_SEVERITY_LABELS,
  COMPONENT_LABELS,
  getRelationshipTypeLabel,
  getRelationshipStatusLabel,
  getHealthLevelLabel,
  getTrendLabel,
  getAlertTypeLabel,
  getAlertSeverityLabel,
  getComponentLabel,
  HEALTH_LEVEL_COLORS,
  HEALTH_LEVEL_BG_COLORS,
  TREND_COLORS,
  ALERT_SEVERITY_COLORS,
  ALERT_SEVERITY_BG_COLORS,
  RELATIONSHIP_STATUS_COLORS,
  TREND_ICONS,
} from './types/labels'

// ============================================================================
// Repository
// ============================================================================

export {
  relationshipRepository,
  type RelationshipRepository,
  type RelationshipListResponse,
} from './repositories/relationship.repository'

// ============================================================================
// Service
// ============================================================================

export { relationshipService, type RelationshipService } from './services/relationship.service'

// ============================================================================
// Hooks
// ============================================================================

export {
  // Query Keys
  relationshipKeys,
  // Relationship CRUD Hooks
  useRelationships,
  useRelationship,
  useRelationshipsForDossier,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  // Health Scoring Hooks
  useRelationshipHealthScore,
  useHealthScores,
  useHealthHistory,
  useCalculateHealthScores,
  // Alert Hooks
  useRelationshipAlerts,
  useMarkAlertRead,
  useDismissAlert,
  // Utility Hooks
  useInvalidateRelationships,
} from './hooks/useRelationships'
