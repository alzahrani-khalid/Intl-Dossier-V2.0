/**
 * Analytics Domain Barrel
 * @module domains/analytics
 */

// Hooks
export {
  analyticsKeys,
  useAnalyticsDashboard,
  useAnalyticsExport,
} from './hooks/useAnalyticsDashboard'

export {
  benchmarkKeys,
  useOrganizationBenchmarks,
  useCurrentStats,
  useBenchmarkPreview,
} from './hooks/useOrganizationBenchmarks'

// Repository
export * as analyticsRepo from './repositories/analytics.repository'

// Types
export * from './types'
