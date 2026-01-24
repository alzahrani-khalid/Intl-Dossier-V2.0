/**
 * Workflow Automation Hooks
 * @module hooks/useWorkflowAutomation
 *
 * TanStack Query hooks for managing workflow automation rules, executions,
 * notifications, and triggers with comprehensive CRUD operations.
 *
 * @description
 * This module provides comprehensive workflow automation management with:
 * - Rule CRUD operations (create, read, update, delete, duplicate)
 * - Execution history tracking and retry capabilities
 * - Manual workflow triggering
 * - Test mode for validating rules before activation
 * - Notification template management
 * - Infinite scrolling support for large rule lists
 * - Rule activation toggle (enable/disable)
 * - Automatic cache invalidation strategies
 *
 * Workflow automation features:
 * - Trigger types: onCreate, onUpdate, onDelete, onSchedule (cron)
 * - Condition logic: AND/OR combinations with field comparisons
 * - Action types: sendEmail, createNotification, updateField, callWebhook
 * - Execution tracking: success, failure, retries
 * - Rate limiting: max executions per hour, cooldown periods
 *
 * @example
 * // Fetch workflow rules with filtering
 * const { data: rules } = useWorkflowRules({
 *   entity_type: 'engagement',
 *   is_active: true,
 *   search: 'notification',
 * });
 *
 * @example
 * // Create a new automation rule
 * const { mutate: createRule } = useCreateWorkflowRule();
 *
 * createRule({
 *   name_en: 'Notify on High Priority',
 *   trigger_type: 'onCreate',
 *   entity_type: 'engagement',
 *   conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
 *   actions: [{ type: 'sendEmail', config: { template: 'high_priority' } }],
 * });
 *
 * @example
 * // Test a rule before activating
 * const { mutate: testRule } = useTestWorkflowRule();
 *
 * testRule({
 *   rule_id: 'uuid-123',
 *   test_data: { priority: 'high', title: 'Test Engagement' },
 * });
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
// Query Keys Factory
// =============================================================================

/**
 * Query key factory for workflow automation queries
 *
 * @description
 * Provides hierarchical cache keys for TanStack Query to enable
 * granular cache invalidation and efficient workflow query management.
 */
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
 * Hook to fetch paginated workflow rules with filtering
 *
 * @description
 * Fetches workflow automation rules with optional filtering by entity type,
 * trigger type, active status, and search query. Results are paginated.
 *
 * @param params - Optional filters for entity type, trigger, active status, search, and pagination
 * @returns TanStack Query result with paginated workflow rules
 *
 * @example
 * const { data, isLoading } = useWorkflowRules({
 *   entity_type: 'dossier',
 *   is_active: true,
 *   page: 1,
 *   limit: 20,
 * });
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
 * Hook to fetch workflow rules with infinite scrolling
 *
 * @description
 * Provides infinite scroll pagination for workflow rules. Automatically
 * fetches the next page when scrolling reaches the bottom.
 *
 * @param params - Filters without page parameter (page is auto-managed)
 * @returns TanStack InfiniteQuery result with pages of workflow rules
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteWorkflowRules({ entity_type: 'engagement' });
 *
 * // In scroll handler
 * if (hasNextPage && !isFetchingNextPage) {
 *   fetchNextPage();
 * }
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
 * Hook to fetch a single workflow rule by ID
 *
 * @description
 * Fetches complete details of a specific workflow rule including trigger config,
 * conditions, actions, and execution statistics.
 *
 * @param id - The workflow rule UUID
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with workflow rule details
 *
 * @example
 * const { data: rule, isLoading } = useWorkflowRule('uuid-123');
 * if (rule) {
 *   console.log(`${rule.name_en}: ${rule.is_active ? 'Active' : 'Inactive'}`);
 * }
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
 * Hook to fetch workflow execution history with filtering
 *
 * @description
 * Fetches execution logs for workflow automation with filtering by rule,
 * entity, and execution status. Useful for monitoring and debugging.
 *
 * @param params - Optional filters for rule_id, entity, status, and pagination
 * @returns TanStack Query result with paginated execution history
 *
 * @example
 * const { data: executions } = useWorkflowExecutions({
 *   status: 'failed',
 *   limit: 50,
 * });
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
 * Hook to fetch execution history for a specific rule
 *
 * @description
 * Retrieves execution logs for a single workflow rule, limited to 50 most recent.
 * Useful for rule detail pages and debugging.
 *
 * @param ruleId - The workflow rule UUID
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with rule-specific execution history
 *
 * @example
 * const { data: executions } = useRuleExecutions('uuid-123');
 * const successRate = executions.filter(e => e.status === 'success').length / executions.length;
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
 * Hook to fetch available notification templates
 *
 * @description
 * Retrieves all notification templates available for workflow actions.
 * Templates include subject/body patterns with variable placeholders.
 * Cached for 30 minutes as templates rarely change.
 *
 * @returns TanStack Query result with notification template array
 *
 * @example
 * const { data: templates } = useNotificationTemplates();
 * <Select>
 *   {templates?.map(t => (
 *     <option key={t.id} value={t.id}>{t.name_en}</option>
 *   ))}
 * </Select>
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
 * Hook to create a new workflow automation rule
 *
 * @description
 * Mutation hook for creating workflow rules. Automatically invalidates
 * all workflow rule queries on success to refresh the UI.
 *
 * @returns TanStack Mutation with mutate function accepting WorkflowRuleCreate
 *
 * @example
 * const { mutate: createRule, isPending } = useCreateWorkflowRule();
 *
 * createRule({
 *   name_en: 'High Priority Alert',
 *   trigger_type: 'onCreate',
 *   entity_type: 'engagement',
 *   conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
 *   actions: [{ type: 'sendEmail', config: { template: 'alert' } }],
 *   is_active: true,
 * });
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
 * Hook to update an existing workflow rule
 *
 * @description
 * Mutation hook for updating workflow rules. Invalidates both the specific
 * rule and all rule list queries on success.
 *
 * @returns TanStack Mutation with mutate function accepting id and WorkflowRuleUpdate
 *
 * @example
 * const { mutate: updateRule } = useUpdateWorkflowRule();
 *
 * updateRule({
 *   id: 'uuid-123',
 *   data: { is_active: false, name_en: 'Updated Name' },
 * });
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
 * Hook to delete a workflow rule
 *
 * @description
 * Mutation hook for deleting workflow rules. Automatically invalidates
 * all rule queries on success.
 *
 * @returns TanStack Mutation with mutate function accepting rule ID
 *
 * @example
 * const { mutate: deleteRule } = useDeleteWorkflowRule();
 *
 * deleteRule('uuid-123', {
 *   onSuccess: () => toast.success('Rule deleted'),
 * });
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
 * Hook to toggle a workflow rule's active status
 *
 * @description
 * Convenience mutation for quickly enabling/disabling rules.
 * Invalidates affected queries on success.
 *
 * @returns TanStack Mutation with mutate function accepting id and is_active
 *
 * @example
 * const { mutate: toggleRule } = useToggleWorkflowRule();
 *
 * toggleRule({ id: 'uuid-123', is_active: false });
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
 * Hook to duplicate an existing workflow rule
 *
 * @description
 * Creates a copy of a workflow rule with "(Copy)" suffix. The duplicate
 * starts as inactive to allow configuration before activation.
 *
 * @returns TanStack Mutation with mutate function accepting WorkflowRule
 *
 * @example
 * const { mutate: duplicateRule } = useDuplicateWorkflowRule();
 *
 * duplicateRule(existingRule, {
 *   onSuccess: (newRule) => {
 *     navigate(`/workflows/${newRule.data.id}/edit`);
 *   },
 * });
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
 * Hook to test a workflow rule with sample data
 *
 * @description
 * Runs a workflow rule in test mode with provided sample data.
 * Returns which conditions matched and which actions would execute
 * without actually executing them.
 *
 * @returns TanStack Mutation with mutate function accepting WorkflowTestRequest
 *
 * @example
 * const { mutate: testRule, data: testResult } = useTestWorkflowRule();
 *
 * testRule({
 *   rule_id: 'uuid-123',
 *   test_data: {
 *     priority: 'high',
 *     title: 'Test Engagement',
 *     status: 'active',
 *   },
 * });
 *
 * // testResult shows which conditions matched and actions that would run
 */
export function useTestWorkflowRule() {
  return useMutation({
    mutationFn: testWorkflowRule,
  })
}

/**
 * Hook to manually trigger a workflow execution
 *
 * @description
 * Forces execution of a workflow rule on a specific entity, bypassing
 * normal trigger conditions. Useful for testing or manual intervention.
 *
 * @returns TanStack Mutation with mutate function accepting WorkflowTriggerRequest
 *
 * @example
 * const { mutate: trigger } = useTriggerWorkflow();
 *
 * trigger({
 *   rule_id: 'uuid-123',
 *   entity_type: 'engagement',
 *   entity_id: 'uuid-456',
 *   force: true,
 * });
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
 * Hook to retry a failed workflow execution
 *
 * @description
 * Resets a failed execution and retries all failed actions.
 * Useful for recovering from transient failures (network issues, etc.).
 *
 * @returns TanStack Mutation with mutate function accepting execution ID
 *
 * @example
 * const { mutate: retry } = useRetryWorkflowExecution();
 *
 * retry('execution-uuid', {
 *   onSuccess: (result) => {
 *     toast.success(`${result.actions_reset} actions retried`);
 *   },
 * });
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
// Cache Invalidation Helpers
// =============================================================================

/**
 * Hook to manually invalidate workflow queries
 *
 * @description
 * Provides granular cache invalidation functions for workflow queries.
 * Useful when you need to refresh data programmatically.
 *
 * @returns Object with invalidation functions for all workflow query types
 *
 * @example
 * const { invalidateRules, invalidateExecutions } = useInvalidateWorkflows();
 *
 * // After external change
 * await invalidateRules();
 * await invalidateExecutions();
 */
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
