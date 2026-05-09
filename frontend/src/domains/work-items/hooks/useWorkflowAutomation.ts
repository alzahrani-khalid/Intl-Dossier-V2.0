/**
 * Workflow Automation Hooks
 * @module domains/work-items/hooks/useWorkflowAutomation
 *
 * TanStack Query hooks for managing workflow automation rules and executions.
 * All API calls route through the work-items repository.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import * as WorkItemsRepo from '../repositories/work-items.repository'
import type {
  WorkflowRule,
  WorkflowRuleCreate,
  WorkflowRuleUpdate,
  WorkflowRulesListParams,
  WorkflowExecutionsListParams,
} from '@/types/workflow-automation.types'

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
// Query Hooks
// =============================================================================

export function useWorkflowRules(params: WorkflowRulesListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.rulesList(params),
    queryFn: () => WorkItemsRepo.getWorkflowRules(params),
    staleTime: STALE_TIME.LIVE,
    gcTime: 5 * 60 * 1000,
  })
}

export function useInfiniteWorkflowRules(
  params: Omit<WorkflowRulesListParams, 'page'>,
): ReturnType<typeof useInfiniteQuery> {
  return useInfiniteQuery({
    queryKey: workflowKeys.rulesList({ ...params, page: undefined }),
    queryFn: ({ pageParam = 1 }) => WorkItemsRepo.getWorkflowRules({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = (lastPage as { pagination: { page: number; total_pages: number } }).pagination
      if (page.page < page.total_pages) {
        return page.page + 1
      }
      return undefined
    },
    staleTime: STALE_TIME.LIVE,
    gcTime: 5 * 60 * 1000,
  })
}

export function useWorkflowRule(id: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.rule(id),
    queryFn: () => WorkItemsRepo.getWorkflowRule(id),
    enabled: enabled && !!id,
    staleTime: STALE_TIME.LIVE,
  })
}

export function useWorkflowExecutions(params: WorkflowExecutionsListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.executionsList(params),
    queryFn: () => WorkItemsRepo.getWorkflowExecutions(params),
    staleTime: STALE_TIME.LIVE,
    gcTime: 5 * 60 * 1000,
  })
}

export function useRuleExecutions(ruleId: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.ruleExecutions(ruleId),
    queryFn: () => WorkItemsRepo.getWorkflowExecutions({ rule_id: ruleId, limit: 50 }),
    enabled: enabled && !!ruleId,
    staleTime: STALE_TIME.LIVE,
  })
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: workflowKeys.templates(),
    queryFn: WorkItemsRepo.getNotificationTemplates,
    staleTime: STALE_TIME.STATIC,
    gcTime: 30 * 60 * 1000,
  })
}

// =============================================================================
// Mutation Hooks
// =============================================================================

export function useCreateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: WorkItemsRepo.createWorkflowRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

export function useUpdateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkflowRuleUpdate }) =>
      WorkItemsRepo.updateWorkflowRule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
      queryClient.invalidateQueries({ queryKey: workflowKeys.rule(id) })
    },
  })
}

export function useDeleteWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: WorkItemsRepo.deleteWorkflowRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

export function useToggleWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      WorkItemsRepo.updateWorkflowRule(id, { is_active }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
      queryClient.invalidateQueries({ queryKey: workflowKeys.rule(id) })
    },
  })
}

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
        is_active: false,
        run_once_per_entity: rule.run_once_per_entity,
        max_executions_per_hour: rule.max_executions_per_hour,
        cooldown_minutes: rule.cooldown_minutes,
        cron_expression: rule.cron_expression,
        organization_id: rule.organization_id,
      }
      return WorkItemsRepo.createWorkflowRule(newRule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.rules() })
    },
  })
}

export function useTestWorkflowRule() {
  return useMutation({
    mutationFn: WorkItemsRepo.testWorkflowRule,
  })
}

export function useTriggerWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: WorkItemsRepo.triggerWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.executions() })
    },
  })
}

export function useRetryWorkflowExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: WorkItemsRepo.retryWorkflowExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.executions() })
    },
  })
}

// =============================================================================
// Invalidation Helpers
// =============================================================================

export function useInvalidateWorkflows(): {
  invalidateAll: () => void
  invalidateRules: () => void
  invalidateExecutions: () => void
  invalidateRule: (id: string) => void
} {
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
