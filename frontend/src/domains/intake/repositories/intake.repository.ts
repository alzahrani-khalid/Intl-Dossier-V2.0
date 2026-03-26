/**
 * Intake Repository
 * @module domains/intake/repositories/intake.repository
 *
 * All intake/ticket-related API operations targeting Edge Functions.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Tickets CRUD
// ============================================================================

export async function createTicket(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-create', data)
}

export async function listTickets(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/intake-tickets-list?${params.toString()}`)
}

export async function getTicket(ticketId: string): Promise<unknown> {
  return apiGet(`/intake-tickets-get?id=${ticketId}`)
}

export async function updateTicket(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-update', data)
}

// ============================================================================
// Triage
// ============================================================================

export async function getTriageSuggestions(ticketId: string): Promise<unknown> {
  return apiGet(`/intake-tickets-triage/${ticketId}/triage`)
}

export async function applyTriage(
  ticketId: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPost(`/intake-tickets-triage/${ticketId}/triage`, data)
}

// ============================================================================
// Assignment & Conversion
// ============================================================================

export async function assignTicket(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-assign', data)
}

export async function convertTicket(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-convert', data)
}

// ============================================================================
// Duplicates & Merge
// ============================================================================

export async function findDuplicates(
  ticketId: string,
  threshold: number = 0.65,
): Promise<unknown> {
  return apiGet(`/intake-tickets-duplicates?id=${ticketId}&threshold=${threshold}`)
}

export async function mergeTickets(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-merge', data)
}

// ============================================================================
// Close
// ============================================================================

export async function closeTicket(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-close', data)
}

// ============================================================================
// Attachments
// ============================================================================

export async function uploadAttachment(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/intake-tickets-attachments', data)
}

export async function deleteAttachment(attachmentId: string): Promise<unknown> {
  return apiDelete(`/intake-tickets-attachments?id=${attachmentId}`)
}

// ============================================================================
// Health Checks
// ============================================================================

export async function getIntakeHealth(): Promise<unknown> {
  return apiGet('/intake-health')
}

export async function getAIHealth(): Promise<unknown> {
  return apiGet('/intake-ai-health')
}

// ============================================================================
// Queue Filters
// ============================================================================

export async function getFilteredAssignments(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/waiting-queue-filters/assignments?${params}`)
}

export async function getFilterPreferences(): Promise<unknown> {
  return apiGet('/waiting-queue-filters/preferences')
}

export async function saveFilterPreferences(data: Record<string, unknown>): Promise<unknown> {
  return apiPut('/waiting-queue-filters/preferences', data)
}

// ============================================================================
// Waiting Queue Actions
// ============================================================================

export async function sendReminder(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/waiting-queue-reminder/send', data)
}

export async function sendBulkReminders(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/waiting-queue-reminder/send-bulk', data)
}

export async function getReminderJobStatus(jobId: string): Promise<unknown> {
  return apiGet(`/waiting-queue-reminder/status/${jobId}`)
}

export async function escalateAssignment(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/waiting-queue-escalation/escalate', data)
}

export async function acknowledgeEscalation(escalationId: string): Promise<unknown> {
  return apiPost(`/waiting-queue-escalation/${escalationId}/acknowledge`, {})
}

export async function resolveEscalation(
  escalationId: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPost(`/waiting-queue-escalation/${escalationId}/resolve`, data)
}
