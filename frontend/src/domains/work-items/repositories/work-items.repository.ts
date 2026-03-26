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
