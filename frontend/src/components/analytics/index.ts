/**
 * Analytics Components Index
 * Feature: analytics-dashboard
 */

export { SummaryCard } from './SummaryCard'
export { EngagementMetricsChart } from './EngagementMetricsChart'
export { RelationshipHealthChart } from './RelationshipHealthChart'
export { CommitmentFulfillmentChart } from './CommitmentFulfillmentChart'
export { WorkloadDistributionChart } from './WorkloadDistributionChart'
// P96 DEAD-05: AnalyticsPreviewOverlay ("Insights you'll gain") and the generateSample*
// generators were deleted — /analytics reads the deployed edge fn, and a fabricated sparkline
// over live chrome is the forbidden shape, not a fallback.
