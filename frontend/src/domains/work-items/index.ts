/**
 * Work Items Domain Barrel
 * @module domains/work-items
 *
 * Re-exports all hooks, repository, and types for the work-items domain.
 * Canonical import path for consumers: `@/domains/work-items`
 */

// Hooks — Work Item Dossier Links
export {
  useWorkItemDossierLinks,
  type WorkItemDossierLinksResponse,
  type UseWorkItemDossierLinksOptions,
} from './hooks/useWorkItemDossierLinks'

// Hooks — Workflow Automation
export {
  workflowKeys,
  useWorkflowRules,
  useInfiniteWorkflowRules,
  useWorkflowRule,
  useWorkflowExecutions,
  useRuleExecutions,
  useNotificationTemplates,
  useCreateWorkflowRule,
  useUpdateWorkflowRule,
  useDeleteWorkflowRule,
  useToggleWorkflowRule,
  useDuplicateWorkflowRule,
  useTestWorkflowRule,
  useTriggerWorkflow,
  useRetryWorkflowExecution,
  useInvalidateWorkflows,
} from './hooks/useWorkflowAutomation'

// Hooks — SLA Monitoring
export {
  useSLADashboard,
  useSLAComplianceByType,
  useSLAComplianceByAssignee,
  useSLAAtRiskItems,
  useSLABreachedItems,
  useSLAPolicies,
  useSLAPolicy,
  useCreateSLAPolicy,
  useUpdateSLAPolicy,
  useDeleteSLAPolicy,
  useSLAEscalations,
  useAcknowledgeEscalation,
  useResolveEscalation,
  useCheckSLABreaches,
  useSLARealtimeUpdates,
  type SLADashboardParams,
  type SLAComplianceByAssigneeParams,
  type SLAAtRiskParams,
  type SLAEscalationsParams,
} from './hooks/useSLAMonitoring'

// Hooks — Update Suggestion Action
export {
  useUpdateSuggestionAction,
  type UpdateSuggestionActionParams,
  type UpdateSuggestionActionResult,
} from './hooks/useUpdateSuggestionAction'

// Repository
export * as workItemsRepo from './repositories/work-items.repository'

// Types
export * from './types'
