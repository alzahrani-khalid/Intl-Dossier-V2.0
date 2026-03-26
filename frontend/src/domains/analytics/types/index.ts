/**
 * Analytics Domain Types
 * @module domains/analytics/types
 */

export interface AnalyticsDashboardParams {
  timeRange?: string
  entityType?: string
  metric?: string
}

export interface BenchmarkParams {
  action?: string
  timeRange?: string
  metric?: string
}
