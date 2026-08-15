/**
 * Analytics Repository
 * @module domains/analytics/repositories/analytics.repository
 *
 * Analytics dashboard and benchmarking API operations.
 *
 * These are thin wrappers over apiGet on purpose (D-01): apiGet throws ApiError on a non-OK
 * response, so a rejection reaches TanStack Query's isError branch and the page renders the
 * shared error state. A catch that returned a plausible success value here is what made those
 * isError branches dead code.
 */

import { apiGet } from '@/lib/api-client'

export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
}

export async function getOrganizationBenchmarks(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/organization-benchmarks?${params.toString()}`, { baseUrl: 'express' })
}

export async function getCurrentStats(): Promise<unknown> {
  return apiGet('/organization-benchmarks?action=current-stats', { baseUrl: 'express' })
}
