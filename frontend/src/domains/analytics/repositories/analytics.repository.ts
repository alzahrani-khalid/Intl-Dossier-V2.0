/**
 * Analytics Repository
 * @module domains/analytics/repositories/analytics.repository
 *
 * Analytics dashboard and benchmarking API operations.
 */

import { apiGet } from '@/lib/api-client'

export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`)
}

export async function getOrganizationBenchmarks(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/organization-benchmarks?${params.toString()}`)
}

export async function getCurrentStats(): Promise<unknown> {
  return apiGet('/organization-benchmarks?action=current-stats')
}
