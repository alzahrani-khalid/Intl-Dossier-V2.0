/**
 * Briefings Repository
 * @module domains/briefings/repositories/briefings.repository
 *
 * Briefing pack and calendar sync API operations.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Briefing Pack Status
// ============================================================================

export async function getBriefingPackStatus(jobId: string): Promise<unknown> {
  return apiGet(`/briefing-packs/jobs/${jobId}/status`)
}

// ============================================================================
// Generate Briefing Pack
// ============================================================================

export async function generateBriefingPack(
  engagementId: string,
  data?: Record<string, unknown>,
): Promise<unknown> {
  return apiPost(`/engagements/${engagementId}/briefing-packs`, data ?? {})
}

// ============================================================================
// Calendar Sync
// ============================================================================

export async function getCalendarStatus(): Promise<unknown> {
  return apiGet('/calendar-sync')
}

export async function syncCalendar(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/calendar-sync', data)
}

export async function getCalendarEvents(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/calendar-sync/events${query ? `?${query}` : ''}`)
}

export async function connectCalendar(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/calendar-sync/connect', data)
}

export async function disconnectCalendar(provider: string): Promise<unknown> {
  return apiDelete(`/calendar-sync/disconnect?provider=${provider}`)
}

export async function updateCalendarSettings(data: Record<string, unknown>): Promise<unknown> {
  return apiPut('/calendar-sync/settings', data)
}
