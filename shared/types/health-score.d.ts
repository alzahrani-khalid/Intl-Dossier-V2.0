/**
 * Shared TypeScript types for Health Score Calculation API
 * Feature: 030-health-commitment
 * Date: 2025-11-15
 */

/**
 * Recency score enum (spec 009 thresholds)
 */
export type RecencyScore = 10 | 40 | 70 | 100;

/**
 * Health score component breakdown
 */
export interface HealthScoreComponents {
  /** Engagement frequency component (0-100) */
  engagementFrequency: number;
  /** Commitment fulfillment component (0-100) */
  commitmentFulfillment: number;
  /** Recency score component (10, 40, 70, or 100) */
  recencyScore: RecencyScore;
}

/**
 * Health score calculation request
 */
export interface HealthScoreRequest {
  /** Dossier UUID to calculate health score for */
  dossierId: string;
  /** Force recalculation even if current cached score exists */
  forceRecalculation?: boolean;
}

/**
 * Health score calculation response
 */
export interface HealthScoreResponse {
  /** Dossier UUID */
  dossierId: string;
  /** Overall health score (0-100, null if insufficient data) */
  overallScore: number | null;
  /** Component breakdown (null if insufficient data) */
  components: HealthScoreComponents | null;
  /** Whether there is sufficient data for calculation */
  sufficientData: boolean;
  /** Reason if insufficient data */
  reason?: string;
  /** When health score was calculated (ISO 8601) */
  calculatedAt: string;
  /** Calculation time in milliseconds */
  calculationTimeMs: number;
  /** Whether the score was served from cache */
  cached: boolean;
}

/**
 * Bulk health score calculation request
 */
export interface BulkHealthScoreRequest {
  /** Array of dossier UUIDs to calculate health scores for */
  dossierIds: string[];
  /** Force recalculation for all dossiers */
  forceRecalculation?: boolean;
}

/**
 * Bulk health score calculation response
 */
export interface BulkHealthScoreResponse {
  /** Array of health score results */
  results: HealthScoreResponse[];
  /** Total count of scores calculated */
  totalCount: number;
  /** Total calculation time in milliseconds */
  totalCalculationTimeMs: number;
}

/**
 * Health refresh trigger priority
 */
export type HealthRefreshPriority = 'high' | 'normal';

/**
 * Trigger health recalculation request
 */
export interface TriggerHealthRecalculationRequest {
  /** Array of dossier UUIDs to recalculate (max 100) */
  dossierIds: string[];
  /** Priority level (high = synchronous, normal = queued) */
  priority?: HealthRefreshPriority;
}

/**
 * Trigger health recalculation response
 */
export interface TriggerHealthRecalculationResponse {
  /** Whether trigger was successful */
  success: boolean;
  /** Number of dossiers to be recalculated */
  dossierCount: number;
  /** When recalculation was triggered (ISO 8601) */
  triggeredAt: string;
  /** Priority used */
  priority: HealthRefreshPriority;
  /** Estimated completion time for normal priority (ISO 8601) */
  estimatedCompletionTime?: string;
  /** Results for high priority (synchronous) */
  results?: HealthScoreResponse[];
}
