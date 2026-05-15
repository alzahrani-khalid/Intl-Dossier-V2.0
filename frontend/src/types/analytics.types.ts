/**
 * Analytics Dashboard Types
 * Feature: analytics-dashboard
 *
 * Type definitions for the high-level analytics dashboard including
 * engagement metrics, relationship health trends, commitment fulfillment
 * rates, and workload distribution.
 */

// ============================================================================
// Time Range Types
// ============================================================================

export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'custom'

export interface DateRange {
  start: string
  end: string
}

export interface TimeRangeOption {
  value: TimeRange
  labelKey: string
  days: number
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '7d', labelKey: 'timeRange.7d', days: 7 },
  { value: '30d', labelKey: 'timeRange.30d', days: 30 },
  { value: '90d', labelKey: 'timeRange.90d', days: 90 },
  { value: '365d', labelKey: 'timeRange.365d', days: 365 },
]

// ============================================================================
// Engagement Metrics Types
// ============================================================================

export interface EngagementMetrics {
  totalEngagements: number
  engagementsByType: EngagementTypeBreakdown[]
  engagementsByOutcome: EngagementOutcomeBreakdown[]
  engagementTrend: TimeSeriesDataPoint[]
  avgEngagementsPerWeek: number
  changeFromPrevious: number // percentage change
}

export interface EngagementTypeBreakdown {
  type: string
  count: number
  percentage: number
}

export interface EngagementOutcomeBreakdown {
  outcome: 'positive' | 'neutral' | 'negative'
  count: number
  percentage: number
}

// ============================================================================
// Relationship Health Trends Types
// ============================================================================

export interface RelationshipHealthTrends {
  healthDistribution: HealthDistribution
  averageScore: number
  previousAverageScore: number
  scoreTrend: TimeSeriesDataPoint[]
  byHealthLevel: HealthLevelBreakdown[]
  byTrend: TrendBreakdown[]
  criticalRelationships: number
  improvingRelationships: number
  decliningRelationships: number
}

export interface HealthDistribution {
  excellent: number
  good: number
  fair: number
  poor: number
  critical: number
  unknown: number
}

export interface HealthLevelBreakdown {
  level: string
  count: number
  percentage: number
  color: string
}

export interface TrendBreakdown {
  trend: 'improving' | 'stable' | 'declining'
  count: number
  percentage: number
}

// ============================================================================
// Commitment Fulfillment Types
// ============================================================================

export interface CommitmentFulfillment {
  totalCommitments: number
  completedOnTime: number
  completedLate: number
  overdue: number
  pending: number
  fulfillmentRate: number // percentage
  onTimeRate: number // percentage
  avgCompletionDays: number
  fulfillmentTrend: TimeSeriesDataPoint[]
  bySource: CommitmentSourceBreakdown[]
  byTrackingType: CommitmentTrackingBreakdown[]
}

export interface CommitmentSourceBreakdown {
  source: 'commitment' | 'task' | 'intake'
  total: number
  completed: number
  overdue: number
  fulfillmentRate: number
}

export interface CommitmentTrackingBreakdown {
  trackingType: 'delivery' | 'follow_up' | 'sla'
  total: number
  completed: number
  fulfillmentRate: number
}

// ============================================================================
// Workload Distribution Types
// ============================================================================

export interface WorkloadDistribution {
  totalActiveItems: number
  byUser: UserWorkload[]
  byPriority: PriorityBreakdown[]
  byStatus: StatusBreakdown[]
  avgItemsPerUser: number
  maxItemsPerUser: number
  overloadedUsers: number // users with > 20 items
  idleUsers: number // users with 0 items
}

export interface UserWorkload {
  userId: string
  userName: string
  userNameAr?: string
  avatarUrl: string | null
  totalItems: number
  overdueItems: number
  highPriorityItems: number
  workloadPercentage: number // relative to max
}

export interface PriorityBreakdown {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  count: number
  percentage: number
  color: string
}

export interface StatusBreakdown {
  status: string
  count: number
  percentage: number
}

// ============================================================================
// Time Series Types
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

// ============================================================================
// Dashboard Summary Types
// ============================================================================

export interface AnalyticsSummary {
  // Key metrics
  totalEngagements: number
  avgHealthScore: number
  fulfillmentRate: number
  totalActiveWork: number
  // Changes from previous period
  engagementsChange: number
  healthScoreChange: number
  fulfillmentRateChange: number
  activeWorkChange: number
  // Alerts
  criticalAlerts: number
  overdueItems: number
  relationshipsNeedingAttention: number
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'png'

export type ExportSection = 'summary' | 'engagements' | 'relationships' | 'commitments' | 'workload'

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AnalyticsDashboardResponse {
  success: true
  data: {
    summary?: AnalyticsSummary
    engagements?: EngagementMetrics
    relationships?: RelationshipHealthTrends
    commitments?: CommitmentFulfillment
    workload?: WorkloadDistribution
    generatedAt: string
    timeRange: {
      start: string
      end: string
      label: string
    }
  }
}

export interface AnalyticsErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

// ============================================================================
// Chart Configuration Types
// ============================================================================

export const DEFAULT_CHART_COLORS = [
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#3B82F6', // blue
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#10B981', // emerald
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#F59E0B', // amber
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#EF4444', // red
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#8B5CF6', // violet
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#EC4899', // pink
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#06B6D4', // cyan
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  '#84CC16', // lime
]

export const HEALTH_LEVEL_COLORS: Record<string, string> = {
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  excellent: '#10B981',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  good: '#34D399',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  fair: '#FBBF24',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  poor: '#F97316',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  critical: '#EF4444',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  unknown: '#9CA3AF',
}

export const PRIORITY_COLORS: Record<string, string> = {
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  low: '#9CA3AF',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  medium: '#3B82F6',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  high: '#F59E0B',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  urgent: '#EF4444',
}

export const TREND_COLORS: Record<string, string> = {
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  improving: '#10B981',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  stable: '#9CA3AF',
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#analytics.types
  declining: '#EF4444',
}

// ============================================================================
// URL State Types
// ============================================================================

export interface AnalyticsUrlState {
  timeRange?: TimeRange
  startDate?: string
  endDate?: string
  tab?: 'overview' | 'engagements' | 'relationships' | 'commitments' | 'workload'
}

// ============================================================================
// Helper Functions
// ============================================================================
