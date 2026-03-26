/**
 * Work Items Domain Types
 * @module domains/work-items/types
 *
 * Re-exports types used across the work-items domain hooks and repository.
 */

// Work Item Dossier Links types
export type {
  WorkItemType,
  WorkItemDossierLink,
} from '@/types/dossier-context.types'

export type { WorkItemDossierLinksResponse } from '../hooks/useWorkItemDossierLinks'
export type { UseWorkItemDossierLinksOptions } from '../hooks/useWorkItemDossierLinks'

// Workflow Automation types
export type {
  WorkflowRule,
  WorkflowRuleCreate,
  WorkflowRuleUpdate,
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

// SLA Monitoring types
export type {
  SLADashboardOverview,
  SLAComplianceByType,
  SLAComplianceByAssignee,
  SLAAtRiskItem,
  SLABreachedItem,
  SLAPolicy,
  SLAPolicyInput,
  SLAEscalation,
  SLAEntityType,
  SLAEscalationStatus,
} from '@/types/sla.types'

// Update Suggestion Action types
export type {
  UpdateSuggestionActionParams,
  UpdateSuggestionActionResult,
} from '../hooks/useUpdateSuggestionAction'
