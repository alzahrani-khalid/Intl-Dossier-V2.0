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
 *
 * P96 DEAD-05 (Branch A — real data): these calls used to pass the api-client's Express base
 * option, and that backend serves no such route — every /analytics load 404'd. The deployed edge functions
 * `analytics-dashboard` and `organization-benchmarks` answer with real, table-derived payloads, so
 * the option is dropped and api-client's default ('edge') resolves
 * `${VITE_SUPABASE_URL}/functions/v1/<path>`. The throw-shape above is unchanged.
 */

import { apiGet } from '@/lib/api-client'
import type { AnalyticsDashboardResponse } from '@/types/analytics.types'

/** The five sections the deployed edge fn serves — ONE per call (`?endpoint=…`). */
export type AnalyticsEndpoint =
  | 'summary'
  | 'engagements'
  | 'relationships'
  | 'commitments'
  | 'workload'

/** `{ success, data: { <endpoint>: {…}, generatedAt, timeRange } }` — the section is unwrapped here. */
type AnalyticsSections = AnalyticsDashboardResponse['data']

export async function getAnalyticsEndpoint<E extends AnalyticsEndpoint>(
  endpoint: E,
  params?: { startDate?: string; endDate?: string },
): Promise<AnalyticsSections[E]> {
  const search = new URLSearchParams({ endpoint })
  if (params?.startDate !== undefined) search.set('startDate', params.startDate)
  if (params?.endDate !== undefined) search.set('endDate', params.endDate)

  const body = await apiGet<AnalyticsDashboardResponse>(`/analytics-dashboard?${search.toString()}`)
  return body.data[endpoint]
}

export async function getOrganizationBenchmarks(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/organization-benchmarks?${params.toString()}`)
}

export async function getCurrentStats(): Promise<unknown> {
  return apiGet('/organization-benchmarks?action=current-stats')
}
