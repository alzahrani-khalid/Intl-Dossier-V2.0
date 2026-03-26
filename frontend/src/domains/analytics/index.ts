/**
 * Analytics Domain Barrel
 * @module domains/analytics
 */

// Hooks
export {
  analyticsKeys,
  useAnalyticsDashboard,
} from './hooks/useAnalyticsDashboard'

export {
  benchmarkKeys,
  useOrganizationBenchmarks,
  useCurrentStats,
} from './hooks/useOrganizationBenchmarks'

// Repository
export * as analyticsRepo from './repositories/analytics.repository'

// Types
export * from './types'
