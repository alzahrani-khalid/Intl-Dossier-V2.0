/**
 * Import Repository
 * @module domains/import/repositories/import.repository
 *
 * Data import, webhook, and availability polling API operations.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Data Import
// ============================================================================

export async function importData(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-import', data)
}

export async function getImportStatus(jobId: string): Promise<unknown> {
  return apiGet(`/data-import?job_id=${jobId}`)
}

// ============================================================================
// Webhooks
// ============================================================================

export async function getWebhooks(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/webhooks${query ? `?${query}` : ''}`)
}

export async function getWebhook(id: string): Promise<unknown> {
  return apiGet(`/webhooks?id=${id}`)
}

export async function createWebhook(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/webhooks', data)
}

export async function updateWebhook(data: Record<string, unknown>): Promise<unknown> {
  return apiPut('/webhooks', data)
}

export async function deleteWebhook(id: string): Promise<unknown> {
  return apiDelete(`/webhooks?id=${id}`)
}

export async function toggleWebhook(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/webhooks', { ...data, action: 'toggle' })
}

export async function testWebhook(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/webhooks/test', data)
}

export async function getWebhookDeliveries(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/webhooks/deliveries${query ? `?${query}` : ''}`)
}

export async function getWebhookStats(webhookId: string, days: number = 30): Promise<unknown> {
  return apiGet(`/webhooks/stats?webhook_id=${webhookId}&days=${days}`)
}

export async function getWebhookTemplates(): Promise<unknown> {
  return apiGet('/webhooks/templates')
}

// ============================================================================
// Availability Polling
// ============================================================================

export async function getPollingConfigs(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/availability-polling${query ? `?${query}` : ''}`)
}

export async function getPollingConfig(id: string): Promise<unknown> {
  return apiGet(`/availability-polling/${id}`)
}

export async function createPollingConfig(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/availability-polling', data)
}

export async function updatePollingConfig(
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPut(`/availability-polling/${id}`, data)
}

export async function deletePollingConfig(id: string): Promise<unknown> {
  return apiDelete(`/availability-polling/${id}`)
}

export async function triggerPoll(id: string): Promise<unknown> {
  return apiPost(`/availability-polling/${id}/poll`, {})
}

export async function getPollingHistory(id: string, params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/availability-polling/${id}/history${query ? `?${query}` : ''}`)
}

export async function getPollingStats(): Promise<unknown> {
  return apiGet('/availability-polling/stats')
}
