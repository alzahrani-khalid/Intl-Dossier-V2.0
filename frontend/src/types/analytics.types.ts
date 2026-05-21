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

// D-58-06-A-09: chart palette collapsed from 8 raw hex hues onto 7 semantic
// CSS variables (Recharts/D3 require raw color strings, not Tailwind classes,
// so we use var() references that adapt to theme changes). Two same-family
// pairs collapse onto a shared var by design (D-07 + chart-palette constraint):
//   blue (3B82F6) → --color-accent
//   emerald (10B981), lime (84CC16) → --heroui-success (within-family collapse)
//   amber (F59E0B) → --heroui-warning
//   red (EF4444)   → --heroui-danger
//   violet (8B5CF6), pink (EC4899) → --color-secondary [D-07 collision]
//   cyan (06B6D4)  → --color-info
export const DEFAULT_CHART_COLORS = [
  'var(--color-accent)', // accent (was blue)
  'var(--heroui-success)', // success (was emerald)
  'var(--heroui-warning)', // warning (was amber)
  'var(--heroui-danger)', // danger (was red)
  'var(--color-secondary)', // secondary (was violet) [D-07]
  'var(--color-secondary)', // secondary (was pink) [D-07 collapse]
  'var(--color-info)', // info (was cyan)
  'var(--heroui-success)', // success (was lime — within-family collapse)
]

// D-58-06-A-09: 6-level health gradient → CSS var() refs:
//   excellent (10B981 emerald), good (34D399 lighter emerald) → success (collapse)
//   fair (FBBF24 yellow), poor (F97316 orange) → warning (collapse)
//   critical (EF4444 red) → danger
//   unknown (9CA3AF gray) → muted-foreground
export const HEALTH_LEVEL_COLORS: Record<string, string> = {
  excellent: 'var(--heroui-success)',
  good: 'var(--heroui-success)',
  fair: 'var(--heroui-warning)',
  poor: 'var(--heroui-warning)',
  critical: 'var(--heroui-danger)',
  unknown: 'var(--color-muted-foreground)',
}

// D-58-06-A-09: priority palette → CSS var() refs: low=muted / medium=accent /
// high=warning / urgent=danger.
export const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--color-muted-foreground)',
  medium: 'var(--color-accent)',
  high: 'var(--heroui-warning)',
  urgent: 'var(--heroui-danger)',
}

// D-58-06-A-09: trend palette → CSS var() refs: improving=success /
// stable=muted / declining=danger.
export const TREND_COLORS: Record<string, string> = {
  improving: 'var(--heroui-success)',
  stable: 'var(--color-muted-foreground)',
  declining: 'var(--heroui-danger)',
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
