/**
 * Workflow Automation Hooks
 * TanStack Query hooks for managing workflow automation rules and executions
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  WorkflowRule,
  WorkflowRuleCreate,
  WorkflowRuleUpdate,
  WorkflowExecution,
  WorkflowNotificationTemplate,
  WorkflowRulesListParams,
  WorkflowRulesListResponse,
  WorkflowExecutionsListParams,
  WorkflowExecutionsListResponse,
  WorkflowTestRequest,
  WorkflowTestResponse,
  WorkflowTriggerRequest,
  WorkflowTriggerResponse,
} from '@/types/workflow-automation.types'

// =============================================================================
// API Configuration
// =============================================================================

const WORKFLOW_RULES_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-rules`
const WORKFLOW_EXECUTOR_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-executor`

async function getAuthHeaders(): Promise<Headers> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  })
}

// =============================================================================
// Query Keys
// =============================================================================

export const workflowKeys = {
  all: ['workflow-automation'] as const,
  rules: () => [...workflowKeys.all, 'rules'] as const,
  rulesList: (params: WorkflowRulesListParams) =>
    [...workflowKeys.rules(), 'list', params] as const,
  rule: (id: string) => [...workflowKeys.rules(), id] as const,
  executions: () => [...workflowKeys.all, 'executions'] as const,
  executionsList: (params: WorkflowExecutionsListParams) =>
    [...workflowKeys.executions(), 'list', params] as const,
  ruleExecutions: (ruleId: string) => [...workflowKeys.executions(), 'rule', ruleId] as const,
  templates: () => [...workflowKeys.all, 'templates'] as const,
  stats: () => [...workflowKeys.all, 'stats'] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchWorkflowRules(
  params: WorkflowRulesListParams,
): Promise<WorkflowRulesListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.trigger_type) searchParams.set('trigger_type', params.trigger_type)
  if (params.is_active !== undefined) searchParams.set('is_active', String(params.is_active))
  if (params.search) searchParams.set('search', params.search)

  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}?${searchParams}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch workflow rules')
  }

  return response.json()
}

async function fetchWorkflowRule(id: string): Promise<{ data: WorkflowRule }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}/${id}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch workflow rule')
  }

  return response.json()
}

async function createWorkflowRule(data: WorkflowRuleCreate): Promise<{ data: WorkflowRule }> {
  const headers = await getAuthHeaders()
  const response = await fetch(WORKFLOW_RULES_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to create workflow rule')
  }

  return response.json()
}

async function updateWorkflowRule(
  id: string,
  data: WorkflowRuleUpdate,
): Promise<{ data: WorkflowRule }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to update workflow rule')
  }

  return response.json()
}

async function deleteWorkflowRule(id: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to delete workflow rule')
  }

  return response.json()
}

async function fetchWorkflowExecutions(
  params: WorkflowExecutionsListParams,
): Promise<WorkflowExecutionsListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.rule_id) searchParams.set('rule_id', params.rule_id)
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.entity_id) searchParams.set('entity_id', params.entity_id)
  if (params.status) searchParams.set('status', params.status)

  const headers = await getAuthHeaders()
  const url = params.rule_id
    ? `${WORKFLOW_RULES_ENDPOINT}/${params.rule_id}/executions?${searchParams}`
    : `${WORKFLOW_RULES_ENDPOINT}/executions?${searchParams}`

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch workflow executions')
  }

  return response.json()
}

async function fetchNotificationTemplates(): Promise<{ data: WorkflowNotificationTemplate[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}/templates`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch notification templates')
  }

  return response.json()
}

async function testWorkflowRule(params: WorkflowTestRequest): Promise<WorkflowTestResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_RULES_ENDPOINT}/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to test workflow rule')
  }

  return response.json()
}

async function triggerWorkflow(params: WorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_EXECUTOR_ENDPOINT}?action=trigger`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to trigger workflow')
  }

  return response.json()
}

async function retryWorkflowExecution(
  executionId: string,
): Promise<{ success: boolean; actions_reset: number }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${WORKFLOW_EXECUTOR_ENDPOINT}?action=retry`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ execution_id: executionId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to retry workflow execution')
  }

  return response.json()
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch paginated workflow rules
 */
export function useWorkflowRules(params: WorkflowRulesListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.rulesList(params),
    queryFn: () => fetchWorkflowRules(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch infinite scrolling workflow rules
 */
export function useInfiniteWorkflowRules(params: Omit<WorkflowRulesListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: workflowKeys.rulesList({ ...params, page: undefined }),
    queryFn: ({ pageParam = 1 }) => fetchWorkflowRules({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.total_pages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single workflow rule
 */
export function useWorkflowRule(id: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.rule(id),
    queryFn: () => fetchWorkflowRule(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Fetch workflow executions
 */
export function useWorkflowExecutions(params: WorkflowExecutionsListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.executionsList(params),
    queryFn: () => fetchWorkflowExecutions(params),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch executions for a specific rule
 */
export function useRuleExecutions(ruleId: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.ruleExecutions(ruleId),
    queryFn: () => fetchWorkflowExecutions({ rule_id: ruleId, limit: 50 }),
    enabled: enabled && !!ruleId,
    staleTime: 15 * 1000,
  })
}

/**
 * Fetch notification templates
 */
export function useNotificationTemplates() {
  return useQuery({
    queryKey: workflowKeys.templates(),
    queryFn: fetchNotificationTemplates,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new workflow rule
 */
export function useCreateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkflowRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

/**
 * Update a workflow rule
 */
export function useUpdateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkflowRuleUpdate }) =>
      updateWorkflowRule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
      queryClient.invalidateQueries({ queryKey: workflowKeys.rule(id) })
    },
  })
}

/**
 * Delete a workflow rule
 */
export function useDeleteWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkflowRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

/**
 * Toggle workflow rule active status
 */
export function useToggleWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateWorkflowRule(id, { is_active }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
      queryClient.invalidateQueries({ queryKey: workflowKeys.rule(id) })
    },
  })
}

/**
 * Duplicate a workflow rule
 */
export function useDuplicateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rule: WorkflowRule) => {
      const newRule: WorkflowRuleCreate = {
        name_en: `${rule.name_en} (Copy)`,
        name_ar: `${rule.name_ar} (نسخة)`,
        description_en: rule.description_en,
        description_ar: rule.description_ar,
        trigger_type: rule.trigger_type,
        trigger_config: rule.trigger_config,
        entity_type: rule.entity_type,
        conditions: rule.conditions,
        condition_logic: rule.condition_logic,
        actions: rule.actions,
        is_active: false, // Start as inactive
        run_once_per_entity: rule.run_once_per_entity,
        max_executions_per_hour: rule.max_executions_per_hour,
        cooldown_minutes: rule.cooldown_minutes,
        cron_expression: rule.cron_expression,
        organization_id: rule.organization_id,
      }
      return createWorkflowRule(newRule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

/**
 * Test a workflow rule
 */
export function useTestWorkflowRule() {
  return useMutation({
    mutationFn: testWorkflowRule,
  })
}

/**
 * Manually trigger a workflow
 */
export function useTriggerWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: triggerWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.executions() })
    },
  })
}

/**
 * Retry a failed workflow execution
 */
export function useRetryWorkflowExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryWorkflowExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.executions() })
    },
  })
}

// =============================================================================
// Invalidation Helpers
// =============================================================================

export function useInvalidateWorkflows() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: workflowKeys.all }),
    invalidateRules: () => queryClient.invalidateQueries({ queryKey: workflowKeys.rules() }),
    invalidateExecutions: () =>
      queryClient.invalidateQueries({ queryKey: workflowKeys.executions() }),
    invalidateRule: (id: string) =>
      queryClient.invalidateQueries({ queryKey: workflowKeys.rule(id) }),
  }
}
