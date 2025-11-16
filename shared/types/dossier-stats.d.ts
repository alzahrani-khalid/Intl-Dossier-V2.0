/**
 * Shared TypeScript types for Dossier Stats API
 * Feature: 030-health-commitment
 * Date: 2025-11-15
 */

/**
 * Commitment metrics for a dossier
 */
export interface CommitmentMetrics {
  /** Total non-cancelled commitments */
  total: number;
  /** Active commitments (pending or in_progress) */
  active: number;
  /** Overdue commitments (past due date, not completed/cancelled) */
  overdue: number;
  /** Fulfilled commitments (completed status) */
  fulfilled: number;
  /** Upcoming commitments (due within 30 days, not completed/cancelled) */
  upcoming: number;
  /** Fulfillment rate (0-100%) */
  fulfillmentRate: number;
}

/**
 * Engagement metrics for a dossier
 */
export interface EngagementMetrics {
  /** Total engagements in last 365 days */
  total365d: number;
  /** Recent engagements in last 90 days */
  recent90d: number;
  /** Latest engagement date (ISO 8601) */
  latestEngagementDate: string | null;
  /** Engagement frequency score (0-100) */
  frequencyScore: number;
}

/**
 * Document metrics for a dossier
 */
export interface DocumentMetrics {
  /** Total documents */
  total: number;
}

/**
 * Health score component breakdown
 */
export interface HealthComponents {
  /** Engagement frequency component (0-100) */
  engagementFrequency: number;
  /** Commitment fulfillment component (0-100) */
  commitmentFulfillment: number;
  /** Recency score component (10, 40, 70, or 100) */
  recencyScore: 10 | 40 | 70 | 100;
}

/**
 * Health score data
 */
export interface HealthScore {
  /** Overall health score (0-100, null if insufficient data) */
  overallScore: number | null;
  /** Component breakdown */
  components: HealthComponents | null;
  /** Whether there is sufficient data for health score calculation */
  sufficientData: boolean;
  /** Reason if insufficient data */
  reason?: string;
  /** When health score was calculated (ISO 8601) */
  calculatedAt: string;
}

/**
 * Data freshness indicators
 */
export interface DataFreshness {
  /** Whether data is current (<60 minutes old) */
  isCurrent: boolean;
  /** Last refresh timestamp (ISO 8601) */
  lastRefreshedAt: string;
  /** Seconds since last refresh */
  ageSeconds: number;
}

/**
 * Complete dossier stats response
 */
export interface DossierStats {
  /** Dossier UUID */
  dossierId: string;
  /** Commitment metrics */
  commitments: CommitmentMetrics;
  /** Engagement metrics */
  engagements: EngagementMetrics;
  /** Document metrics */
  documents: DocumentMetrics;
  /** Health score data */
  health: HealthScore;
  /** Data freshness indicators */
  dataFreshness: DataFreshness;
}

/**
 * Bulk dossier stats response
 */
export interface BulkDossierStatsResponse {
  /** Array of dossier stats */
  stats: DossierStats[];
  /** Total count of stats returned */
  totalCount: number;
}

/**
 * Health tier for color-coding
 */
export type HealthTier = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Health distribution for aggregations
 */
export interface HealthDistribution {
  /** Excellent health (80-100) */
  excellent: number;
  /** Good health (60-79) */
  good: number;
  /** Fair health (40-59) */
  fair: number;
  /** Poor health (0-39) */
  poor: number;
}

/**
 * Dashboard health aggregation by group
 */
export interface HealthAggregation {
  /** Group value (e.g., region name, bloc name) */
  groupValue: string;
  /** Average health score for group */
  averageHealthScore: number;
  /** Number of dossiers in group */
  dossierCount: number;
  /** Health distribution breakdown */
  healthDistribution: HealthDistribution;
}

/**
 * Dashboard aggregations response
 */
export interface DashboardAggregationsResponse {
  /** Aggregations grouped by specified field */
  aggregations: HealthAggregation[];
  /** Field used for grouping */
  groupBy: 'region' | 'bloc' | 'classification';
  /** Total dossiers included */
  totalDossiers: number;
}
