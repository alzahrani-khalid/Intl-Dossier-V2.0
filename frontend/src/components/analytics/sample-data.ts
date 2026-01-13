/**
 * Sample Data Generator for Analytics Preview
 * Feature: analytics-preview
 *
 * Generates realistic sample data for analytics charts when no real data is available.
 * This helps users understand what insights they'll gain once they start using the system.
 */

import type {
  EngagementMetrics,
  RelationshipHealthTrends,
  CommitmentFulfillment,
  WorkloadDistribution,
  AnalyticsSummary,
  TimeSeriesDataPoint,
} from '@/types/analytics.types'

/**
 * Generate date labels for a time series
 */
function generateDateSeries(days: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

/**
 * Generate a smooth trend line with some variation
 */
function generateTrendValues(
  length: number,
  baseValue: number,
  variance: number,
  trend: 'up' | 'down' | 'stable' = 'stable',
): number[] {
  const values: number[] = []
  let currentValue = baseValue - (trend === 'up' ? variance : 0) + (trend === 'down' ? variance : 0)

  for (let i = 0; i < length; i++) {
    // Add some random variation
    const randomVariation = (Math.random() - 0.5) * variance * 0.4

    // Apply trend
    if (trend === 'up') {
      currentValue += variance / length + randomVariation
    } else if (trend === 'down') {
      currentValue -= variance / length + randomVariation
    } else {
      currentValue += randomVariation
    }

    // Clamp to reasonable bounds
    currentValue = Math.max(0, Math.min(100, currentValue))
    values.push(Math.round(currentValue * 10) / 10)
  }

  return values
}

/**
 * Generate sample engagement metrics
 */
export function generateSampleEngagementMetrics(): EngagementMetrics {
  const dates = generateDateSeries(30)
  const trendValues = generateTrendValues(dates.length, 45, 20, 'up')

  const engagementTrend: TimeSeriesDataPoint[] = dates.map((date, index) => ({
    date,
    value: Math.round(trendValues[index]),
    label: `${Math.round(trendValues[index])} engagements`,
  }))

  return {
    totalEngagements: 156,
    engagementsByType: [
      { type: 'meeting', count: 52, percentage: 33.3 },
      { type: 'call', count: 38, percentage: 24.4 },
      { type: 'email', count: 31, percentage: 19.9 },
      { type: 'visit', count: 18, percentage: 11.5 },
      { type: 'event', count: 12, percentage: 7.7 },
      { type: 'other', count: 5, percentage: 3.2 },
    ],
    engagementsByOutcome: [
      { outcome: 'positive', count: 98, percentage: 62.8 },
      { outcome: 'neutral', count: 45, percentage: 28.8 },
      { outcome: 'negative', count: 13, percentage: 8.3 },
    ],
    engagementTrend,
    avgEngagementsPerWeek: 12.3,
    changeFromPrevious: 15.2,
  }
}

/**
 * Generate sample relationship health trends
 */
export function generateSampleRelationshipHealthTrends(): RelationshipHealthTrends {
  const dates = generateDateSeries(30)
  const scoreValues = generateTrendValues(dates.length, 72, 10, 'up')

  const scoreTrend: TimeSeriesDataPoint[] = dates.map((date, index) => ({
    date,
    value: scoreValues[index],
    label: `${scoreValues[index].toFixed(1)}`,
  }))

  return {
    healthDistribution: {
      excellent: 12,
      good: 35,
      fair: 28,
      poor: 8,
      critical: 3,
      unknown: 2,
    },
    averageScore: 75.4,
    previousAverageScore: 71.2,
    scoreTrend,
    byHealthLevel: [
      { level: 'excellent', count: 12, percentage: 13.6, color: '#10B981' },
      { level: 'good', count: 35, percentage: 39.8, color: '#34D399' },
      { level: 'fair', count: 28, percentage: 31.8, color: '#FBBF24' },
      { level: 'poor', count: 8, percentage: 9.1, color: '#F97316' },
      { level: 'critical', count: 3, percentage: 3.4, color: '#EF4444' },
      { level: 'unknown', count: 2, percentage: 2.3, color: '#9CA3AF' },
    ],
    byTrend: [
      { trend: 'improving', count: 28, percentage: 31.8 },
      { trend: 'stable', count: 48, percentage: 54.5 },
      { trend: 'declining', count: 12, percentage: 13.6 },
    ],
    criticalRelationships: 3,
    improvingRelationships: 28,
    decliningRelationships: 12,
  }
}

/**
 * Generate sample commitment fulfillment data
 */
export function generateSampleCommitmentFulfillment(): CommitmentFulfillment {
  const dates = generateDateSeries(30)
  const fulfillmentValues = generateTrendValues(dates.length, 78, 15, 'up')

  const fulfillmentTrend: TimeSeriesDataPoint[] = dates.map((date, index) => ({
    date,
    value: fulfillmentValues[index],
    label: `${fulfillmentValues[index].toFixed(1)}%`,
  }))

  return {
    totalCommitments: 124,
    completedOnTime: 68,
    completedLate: 18,
    overdue: 12,
    pending: 26,
    fulfillmentRate: 85.5,
    onTimeRate: 79.1,
    avgCompletionDays: 4.2,
    fulfillmentTrend,
    bySource: [
      { source: 'commitment', total: 52, completed: 45, overdue: 4, fulfillmentRate: 86.5 },
      { source: 'task', total: 48, completed: 38, overdue: 5, fulfillmentRate: 79.2 },
      { source: 'intake', total: 24, completed: 21, overdue: 3, fulfillmentRate: 87.5 },
    ],
    byTrackingType: [
      { trackingType: 'delivery', total: 58, completed: 49, fulfillmentRate: 84.5 },
      { trackingType: 'follow_up', total: 42, completed: 37, fulfillmentRate: 88.1 },
      { trackingType: 'sla', total: 24, completed: 18, fulfillmentRate: 75.0 },
    ],
  }
}

/**
 * Generate sample workload distribution data
 */
export function generateSampleWorkloadDistribution(): WorkloadDistribution {
  return {
    totalActiveItems: 187,
    byUser: [
      {
        userId: 'demo-1',
        userName: 'Ahmed Al-Farsi',
        userNameAr: 'أحمد الفارسي',
        avatarUrl: null,
        totalItems: 28,
        overdueItems: 3,
        highPriorityItems: 8,
        workloadPercentage: 100,
      },
      {
        userId: 'demo-2',
        userName: 'Sarah Johnson',
        avatarUrl: null,
        totalItems: 24,
        overdueItems: 2,
        highPriorityItems: 6,
        workloadPercentage: 85.7,
      },
      {
        userId: 'demo-3',
        userName: 'Mohammed Hassan',
        userNameAr: 'محمد حسان',
        avatarUrl: null,
        totalItems: 22,
        overdueItems: 1,
        highPriorityItems: 5,
        workloadPercentage: 78.6,
      },
      {
        userId: 'demo-4',
        userName: 'Lisa Chen',
        avatarUrl: null,
        totalItems: 20,
        overdueItems: 2,
        highPriorityItems: 4,
        workloadPercentage: 71.4,
      },
      {
        userId: 'demo-5',
        userName: 'Khalid Al-Rashid',
        userNameAr: 'خالد الراشد',
        avatarUrl: null,
        totalItems: 18,
        overdueItems: 0,
        highPriorityItems: 3,
        workloadPercentage: 64.3,
      },
      {
        userId: 'demo-6',
        userName: 'Emma Wilson',
        avatarUrl: null,
        totalItems: 16,
        overdueItems: 1,
        highPriorityItems: 4,
        workloadPercentage: 57.1,
      },
      {
        userId: 'demo-7',
        userName: 'Omar Mahmoud',
        userNameAr: 'عمر محمود',
        avatarUrl: null,
        totalItems: 14,
        overdueItems: 0,
        highPriorityItems: 2,
        workloadPercentage: 50.0,
      },
      {
        userId: 'demo-8',
        userName: 'Jennifer Brown',
        avatarUrl: null,
        totalItems: 12,
        overdueItems: 1,
        highPriorityItems: 2,
        workloadPercentage: 42.9,
      },
      {
        userId: 'demo-9',
        userName: 'Fatima Al-Saud',
        userNameAr: 'فاطمة آل سعود',
        avatarUrl: null,
        totalItems: 10,
        overdueItems: 0,
        highPriorityItems: 1,
        workloadPercentage: 35.7,
      },
      {
        userId: 'demo-10',
        userName: 'David Kim',
        avatarUrl: null,
        totalItems: 8,
        overdueItems: 0,
        highPriorityItems: 1,
        workloadPercentage: 28.6,
      },
    ],
    byPriority: [
      { priority: 'low', count: 45, percentage: 24.1, color: '#9CA3AF' },
      { priority: 'medium', count: 78, percentage: 41.7, color: '#3B82F6' },
      { priority: 'high', count: 48, percentage: 25.7, color: '#F59E0B' },
      { priority: 'urgent', count: 16, percentage: 8.6, color: '#EF4444' },
    ],
    byStatus: [
      { status: 'pending', count: 62, percentage: 33.2 },
      { status: 'in_progress', count: 78, percentage: 41.7 },
      { status: 'review', count: 28, percentage: 15.0 },
      { status: 'completed', count: 19, percentage: 10.2 },
    ],
    avgItemsPerUser: 18.7,
    maxItemsPerUser: 28,
    overloadedUsers: 2,
    idleUsers: 0,
  }
}

/**
 * Generate sample analytics summary
 */
export function generateSampleAnalyticsSummary(): AnalyticsSummary {
  return {
    totalEngagements: 156,
    avgHealthScore: 75.4,
    fulfillmentRate: 85.5,
    totalActiveWork: 187,
    engagementsChange: 15.2,
    healthScoreChange: 4.2,
    fulfillmentRateChange: 8.3,
    activeWorkChange: -5.2,
    criticalAlerts: 3,
    overdueItems: 12,
    relationshipsNeedingAttention: 12,
  }
}

/**
 * Generate all sample data for analytics preview
 */
export function generateAllSampleData() {
  return {
    summary: generateSampleAnalyticsSummary(),
    engagements: generateSampleEngagementMetrics(),
    relationships: generateSampleRelationshipHealthTrends(),
    commitments: generateSampleCommitmentFulfillment(),
    workload: generateSampleWorkloadDistribution(),
  }
}
