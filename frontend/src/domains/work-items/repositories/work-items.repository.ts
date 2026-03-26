/**
 * Work Items Repository
 * @module domains/work-items/repositories/work-items.repository
 *
 * Plain function exports for all work-item-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 *
 * Note: Some hooks in this domain (useWorkItemDossierLinks, useSLAMonitoring)
 * use Supabase client directly or custom fetch patterns rather than the shared
 * apiClient, because they interact with Supabase tables directly or use
 * specialized Edge Function endpoints with custom error handling.
 * The repository still centralizes the API functions that CAN use apiClient.
 */

import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api-client'
import type {
  SLADashboardOverview,
  SLAComplianceByType,
  SLAComplianceByAssignee,
  SLAAtRiskItem,
  SLABreachedItem,
  SLAPolicy,
  SLAPolicyInput,
  SLAEscalation,
} from '@/types/sla.types'
import type {
  WorkflowRulesListParams,
  WorkflowRulesListResponse,
  WorkflowRule,
  WorkflowRuleCreate,
  WorkflowRuleUpdate,
  WorkflowExecutionsListParams,
  WorkflowExecutionsListResponse,
  WorkflowNotificationTemplate,
  WorkflowTestRequest,
  WorkflowTestResponse,
  WorkflowTriggerRequest,
  WorkflowTriggerResponse,
} from '@/types/workflow-automation.types'

// ============================================================================
// Workflow Rules
// ============================================================================

export async function getWorkflowRules(
  params: WorkflowRulesListParams,
): Promise<WorkflowRulesListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.trigger_type) searchParams.set('trigger_type', params.trigger_type)
  if (params.is_active !== undefined) searchParams.set('is_active', String(params.is_active))
  if (params.search) searchParams.set('search', params.search)

  return apiGet<WorkflowRulesListResponse>(`/workflow-rules?${searchParams}`)
}

export async function getWorkflowRule(id: string): Promise<{ data: WorkflowRule }> {
  return apiGet<{ data: WorkflowRule }>(`/workflow-rules/${id}`)
}

export async function createWorkflowRule(
  data: WorkflowRuleCreate,
): Promise<{ data: WorkflowRule }> {
  return apiPost<{ data: WorkflowRule }>('/workflow-rules', data)
}

export async function updateWorkflowRule(
  id: string,
  data: WorkflowRuleUpdate,
): Promise<{ data: WorkflowRule }> {
  return apiPatch<{ data: WorkflowRule }>(`/workflow-rules/${id}`, data)
}

export async function deleteWorkflowRule(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/workflow-rules/${id}`)
}

// ============================================================================
// Workflow Executions
// ============================================================================

export async function getWorkflowExecutions(
  params: WorkflowExecutionsListParams,
): Promise<WorkflowExecutionsListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.rule_id) searchParams.set('rule_id', params.rule_id)
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.entity_id) searchParams.set('entity_id', params.entity_id)
  if (params.status) searchParams.set('status', params.status)

  const path = params.rule_id
    ? `/workflow-rules/${params.rule_id}/executions?${searchParams}`
    : `/workflow-rules/executions?${searchParams}`

  return apiGet<WorkflowExecutionsListResponse>(path)
}

// ============================================================================
// Workflow Templates
// ============================================================================

export async function getNotificationTemplates(): Promise<{
  data: WorkflowNotificationTemplate[]
}> {
  return apiGet<{ data: WorkflowNotificationTemplate[] }>('/workflow-rules/templates')
}

// ============================================================================
// Workflow Testing & Triggering
// ============================================================================

export async function testWorkflowRule(
  params: WorkflowTestRequest,
): Promise<WorkflowTestResponse> {
  return apiPost<WorkflowTestResponse>('/workflow-rules/test', params)
}

export async function triggerWorkflow(
  params: WorkflowTriggerRequest,
): Promise<WorkflowTriggerResponse> {
  return apiPost<WorkflowTriggerResponse>('/workflow-executor?action=trigger', params)
}

export async function retryWorkflowExecution(
  executionId: string,
): Promise<{ success: boolean; actions_reset: number }> {
  return apiPost<{ success: boolean; actions_reset: number }>(
    '/workflow-executor?action=retry',
    { execution_id: executionId },
  )
}

// ============================================================================
// SLA Monitoring (Edge Function)
// ============================================================================

/** Wrapper that unwraps the { data: T } envelope from SLA edge function responses */
async function slaGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    })
  }
  const query = searchParams.toString()
  const path = `/sla-monitoring/${endpoint}${query ? `?${query}` : ''}`
  const result = await apiGet<{ data: T }>(path)
  return result.data
}

async function slaPost<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const result = await apiPost<{ data: T }>(`/sla-monitoring/${endpoint}`, body ?? {})
  return result.data
}

async function slaPut<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const result = await apiPut<{ data: T }>(`/sla-monitoring/${endpoint}`, body)
  return result.data
}

async function slaDelete(endpoint: string): Promise<void> {
  await apiDelete<void>(`/sla-monitoring/${endpoint}`)
}

export async function getSLADashboard(params?: {
  entity_type?: string
  start_date?: string
  end_date?: string
}): Promise<SLADashboardOverview> {
  return slaGet('dashboard', params)
}

export async function getSLAComplianceByType(params?: {
  entity_type?: string
  start_date?: string
  end_date?: string
}): Promise<SLAComplianceByType[]> {
  return slaGet('compliance/type', params)
}

export async function getSLAComplianceByAssignee(params?: {
  start_date?: string
  end_date?: string
  limit?: number
}): Promise<SLAComplianceByAssignee[]> {
  return slaGet('compliance/assignee', params)
}

export async function getSLAAtRiskItems(params?: {
  entity_type?: string
  threshold?: number
  limit?: number
}): Promise<SLAAtRiskItem[]> {
  return slaGet('at-risk', params)
}

export async function getSLABreachedItems(): Promise<SLABreachedItem[]> {
  return slaGet('breached')
}

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  return slaGet('policies')
}

export async function getSLAPolicy(
  policyId: string,
): Promise<SLAPolicy> {
  return slaGet(`policies/${policyId}`)
}

export async function createSLAPolicy(
  input: SLAPolicyInput,
): Promise<SLAPolicy> {
  return slaPost('policies', input as unknown as Record<string, unknown>)
}

export async function updateSLAPolicy(
  id: string,
  input: Record<string, unknown>,
): Promise<SLAPolicy> {
  return slaPut(`policies/${id}`, input)
}

export async function deleteSLAPolicy(policyId: string): Promise<void> {
  return slaDelete(`policies/${policyId}`)
}

export async function getSLAEscalations(params?: {
  status?: string
  entity_type?: string
  limit?: number
}): Promise<SLAEscalation[]> {
  return slaGet('escalations', params)
}

export async function acknowledgeSLAEscalation(
  escalationId: string,
): Promise<SLAEscalation> {
  return slaPost(`escalations/${escalationId}/acknowledge`)
}

export async function resolveSLAEscalation(
  escalationId: string,
  notes?: string,
): Promise<SLAEscalation> {
  return slaPost(`escalations/${escalationId}/resolve`, notes ? { notes } : undefined)
}

export async function checkSLABreaches(): Promise<{ breaches_detected: number }> {
  return slaPost('check-breaches')
}

// ============================================================================
// Suggestion Actions
// ============================================================================

export async function updateSuggestionAction(
  engagementId: string,
  suggestionId: string,
  action: 'accepted' | 'rejected' | 'ignored',
): Promise<{ suggestion: { id: string; user_action: string; actioned_at: string } }> {
  return apiPost<{ suggestion: { id: string; user_action: string; actioned_at: string } }>(
    `/engagements/${engagementId}/positions/suggestions`,
    { suggestion_id: suggestionId, action },
  )
}
