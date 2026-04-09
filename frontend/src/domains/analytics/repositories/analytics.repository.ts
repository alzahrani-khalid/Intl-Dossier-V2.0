/**
 * Analytics Repository
 * @module domains/analytics/repositories/analytics.repository
 *
 * Analytics dashboard and benchmarking API operations.
 */

import { apiGet } from '@/lib/api-client'

export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  try {
    return await apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
  } catch (error: unknown) {
    console.warn(
      'Analytics dashboard endpoint not available',
      error instanceof Error ? error.message : error,
    )
    return { data: null }
  }
}

export async function getOrganizationBenchmarks(params: URLSearchParams): Promise<unknown> {
  try {
    return await apiGet(`/organization-benchmarks?${params.toString()}`, { baseUrl: 'express' })
  } catch (error: unknown) {
    console.warn(
      'Organization benchmarks endpoint not available',
      error instanceof Error ? error.message : error,
    )
    return { data: null }
  }
}

export async function getCurrentStats(): Promise<unknown> {
  try {
    return await apiGet('/organization-benchmarks?action=current-stats', { baseUrl: 'express' })
  } catch (error: unknown) {
    console.warn(
      'Current stats endpoint not available',
      error instanceof Error ? error.message : error,
    )
    return { data: null }
  }
}
