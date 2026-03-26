/**
 * Audit Repository
 * @module domains/audit/repositories/audit.repository
 *
 * All audit, compliance, and data retention API operations.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Audit Logs
// ============================================================================

export async function getAuditLogs(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/audit-logs-viewer?${params.toString()}`)
}

export async function getAuditLogDetails(logId: string): Promise<unknown> {
  return apiGet(`/audit-logs-viewer/${logId}`)
}

export async function getAuditLogStats(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/audit-logs-viewer/stats${query ? `?${query}` : ''}`)
}

export async function exportAuditLogs(params: Record<string, unknown>): Promise<unknown> {
  return apiPost('/audit-logs-viewer/export', params)
}

// ============================================================================
// Compliance Rules
// ============================================================================

export async function getComplianceRules(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/compliance${query ? `?${query}` : ''}`)
}

export async function getComplianceRule(id: string): Promise<unknown> {
  return apiGet(`/compliance/${id}`)
}

export async function createComplianceRule(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/compliance', data)
}

export async function updateComplianceRule(
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPut(`/compliance/${id}`, data)
}

export async function deleteComplianceRule(id: string): Promise<unknown> {
  return apiDelete(`/compliance/${id}`)
}

export async function runComplianceCheck(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/compliance/check', data)
}

// ============================================================================
// Data Retention Policies
// ============================================================================

export async function getRetentionPolicies(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/data-retention/policies${query ? `?${query}` : ''}`)
}

export async function getRetentionPolicy(id: string): Promise<unknown> {
  return apiGet(`/data-retention/policies/${id}`)
}

export async function createRetentionPolicy(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-retention/policies', data)
}

export async function updateRetentionPolicy(
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPut(`/data-retention/policies/${id}`, data)
}

export async function deleteRetentionPolicy(id: string): Promise<unknown> {
  return apiDelete(`/data-retention/policies/${id}`)
}

// ============================================================================
// Legal Holds
// ============================================================================

export async function getLegalHolds(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/data-retention/legal-holds${query ? `?${query}` : ''}`)
}

export async function getLegalHold(id: string): Promise<unknown> {
  return apiGet(`/data-retention/legal-holds/${id}`)
}

export async function createLegalHold(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-retention/legal-holds', data)
}

export async function updateLegalHold(
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPut(`/data-retention/legal-holds/${id}`, data)
}

export async function releaseLegalHold(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-retention/release-hold', data)
}

export async function deleteLegalHold(id: string): Promise<unknown> {
  return apiDelete(`/data-retention/legal-holds/${id}`)
}

// ============================================================================
// Retention Statistics & Execution
// ============================================================================

export async function getRetentionStatistics(): Promise<unknown> {
  return apiGet('/data-retention/statistics')
}

export async function getPendingActions(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/data-retention/pending-actions${query ? `?${query}` : ''}`)
}

export async function getExpiringRecords(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/data-retention/expiring${query ? `?${query}` : ''}`)
}

export async function getExecutionLog(): Promise<unknown> {
  return apiGet('/data-retention/execution-log')
}

export async function runRetentionProcessor(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/retention-processor', data)
}

export async function applyRetentionPolicy(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-retention/apply-policy', data)
}

export async function createManualHold(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/data-retention/manual-hold', data)
}
