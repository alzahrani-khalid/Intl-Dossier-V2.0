/**
 * Misc Repository
 * @module domains/misc/repositories/misc.repository
 *
 * Miscellaneous API operations: comments, stakeholders, reports,
 * scenarios, multi-lang, sample data, onboarding, etc.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// ============================================================================
// Comments
// ============================================================================

export async function getComments(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/entity-comments?${params.toString()}`)
}

export async function createComment(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/entity-comments', data)
}

export async function updateComment(id: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPut(`/entity-comments/${id}`, data)
}

export async function deleteComment(id: string): Promise<unknown> {
  return apiDelete(`/entity-comments/${id}`)
}

export async function getCommentThread(commentId: string): Promise<unknown> {
  return apiGet(`/entity-comments/${commentId}/thread`)
}

export async function reactToComment(commentId: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPost(`/entity-comments/${commentId}/reactions`, data)
}

export async function resolveComment(commentId: string): Promise<unknown> {
  return apiPost(`/entity-comments/${commentId}/resolve`, {})
}

export async function mentionUsers(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/entity-comments/mentions', data)
}

// ============================================================================
// Stakeholder Timeline
// ============================================================================

export async function getStakeholderTimeline(
  stakeholderId: string,
  params?: URLSearchParams,
): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/stakeholder-timeline/${stakeholderId}${query ? `?${query}` : ''}`)
}

export async function addTimelineEvent(
  stakeholderId: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPost(`/stakeholder-timeline/${stakeholderId}`, data)
}

export async function getTimelineCategories(): Promise<unknown> {
  return apiGet('/stakeholder-timeline/categories')
}

export async function getTimelineExport(
  stakeholderId: string,
  format: string,
): Promise<unknown> {
  return apiGet(`/stakeholder-timeline/${stakeholderId}/export?format=${format}`)
}

export async function getTimelineStats(stakeholderId: string): Promise<unknown> {
  return apiGet(`/stakeholder-timeline/${stakeholderId}/stats`)
}

export async function compareTimelines(stakeholderIds: string[]): Promise<unknown> {
  return apiPost('/stakeholder-timeline/compare', { stakeholder_ids: stakeholderIds })
}

// ============================================================================
// Stakeholder Influence
// ============================================================================

export async function getInfluenceData(
  stakeholderId: string,
  params?: URLSearchParams,
): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/stakeholder-influence/${stakeholderId}${query ? `?${query}` : ''}`)
}

export async function updateInfluenceScore(
  stakeholderId: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPost(`/stakeholder-influence/${stakeholderId}`, data)
}

export async function getInfluenceNetwork(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/stakeholder-influence/network${query ? `?${query}` : ''}`)
}

export async function getInfluenceHistory(
  stakeholderId: string,
  params?: URLSearchParams,
): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/stakeholder-influence/${stakeholderId}/history${query ? `?${query}` : ''}`)
}

export async function compareInfluence(stakeholderIds: string[]): Promise<unknown> {
  return apiPost('/stakeholder-influence/compare', { stakeholder_ids: stakeholderIds })
}

// ============================================================================
// Report Builder
// ============================================================================

export async function getReportTemplates(): Promise<unknown> {
  return apiGet('/report-builder/templates')
}

export async function generateReport(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/report-builder/generate', data)
}

export async function getReportStatus(reportId: string): Promise<unknown> {
  return apiGet(`/report-builder/${reportId}/status`)
}

export async function getReportHistory(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/report-builder/history${query ? `?${query}` : ''}`)
}

// ============================================================================
// Scenario Sandbox
// ============================================================================

export async function getScenarios(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/scenario-sandbox${query ? `?${query}` : ''}`)
}

export async function createScenario(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/scenario-sandbox', data)
}

export async function runScenario(scenarioId: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPost(`/scenario-sandbox/${scenarioId}/run`, data)
}

export async function getScenarioResults(scenarioId: string): Promise<unknown> {
  return apiGet(`/scenario-sandbox/${scenarioId}/results`)
}

// ============================================================================
// Multi-Language Content
// ============================================================================

export async function getTranslations(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/multi-lang-content?${params.toString()}`)
}

export async function saveTranslation(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/multi-lang-content', data)
}

// ============================================================================
// Sample Data
// ============================================================================

export async function getSampleDataSets(): Promise<unknown> {
  return apiGet('/sample-data?action=list-templates')
}

export async function loadSampleData(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/sample-data?action=populate', data)
}

export async function clearSampleData(): Promise<unknown> {
  return apiPost('/sample-data?action=remove', {})
}

export async function getSampleDataStatus(): Promise<unknown> {
  return apiGet('/sample-data?action=status')
}

// ============================================================================
// Onboarding Checklist
// ============================================================================

export async function getOnboardingChecklist(): Promise<unknown> {
  return apiGet('/onboarding-checklist')
}

export async function updateChecklistItem(
  itemId: string,
  data: Record<string, unknown>,
): Promise<unknown> {
  return apiPut(`/onboarding-checklist/${itemId}`, data)
}

export async function dismissOnboarding(): Promise<unknown> {
  return apiPost('/onboarding-checklist/dismiss', {})
}

export async function resetOnboarding(): Promise<unknown> {
  return apiPost('/onboarding-checklist/reset', {})
}

// ============================================================================
// Progressive Disclosure
// ============================================================================

export async function getDisclosureState(params?: URLSearchParams): Promise<unknown> {
  const query = params?.toString()
  return apiGet(`/progressive-disclosure${query ? `?${query}` : ''}`)
}

export async function updateDisclosureState(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/progressive-disclosure', data)
}

export async function getFeatureGates(): Promise<unknown> {
  return apiGet('/progressive-disclosure/gates')
}

export async function unlockFeature(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/progressive-disclosure/unlock', data)
}

export async function getUserProgress(): Promise<unknown> {
  return apiGet('/progressive-disclosure/progress')
}

export async function recordInteraction(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/progressive-disclosure/interaction', data)
}

// ============================================================================
// Pull to Refresh
// ============================================================================

export async function refreshData(data: Record<string, unknown>): Promise<unknown> {
  return apiPost('/pull-to-refresh', data)
}
