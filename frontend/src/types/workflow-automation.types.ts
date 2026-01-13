/**
 * Workflow Automation Types
 * No-code workflow builder for automating common processes
 */

// =============================================================================
// Enums / Union Types
// =============================================================================

export type WorkflowTriggerType =
  | 'ticket_created'
  | 'ticket_updated'
  | 'status_changed'
  | 'deadline_approaching'
  | 'deadline_overdue'
  | 'assignment_changed'
  | 'priority_changed'
  | 'field_changed'
  | 'comment_added'
  | 'document_uploaded'
  | 'engagement_created'
  | 'commitment_created'
  | 'commitment_due'
  | 'schedule_cron'
  | 'manual'

export type WorkflowActionType =
  | 'notify_user'
  | 'notify_role'
  | 'notify_assignee'
  | 'notify_webhook'
  | 'assign_user'
  | 'assign_role'
  | 'update_field'
  | 'update_status'
  | 'update_priority'
  | 'add_tag'
  | 'remove_tag'
  | 'create_task'
  | 'create_comment'
  | 'send_email'
  | 'call_webhook'
  | 'delay'
  | 'branch_condition'

export type WorkflowEntityType =
  | 'intake_ticket'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'dossier'
  | 'position'
  | 'document'
  | 'calendar_entry'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'between'
  | 'changed_to'
  | 'changed_from'
  | 'has_changed'

export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export type ConditionLogic = 'all' | 'any'

// =============================================================================
// Trigger Configuration Interfaces
// =============================================================================

export interface TriggerConfigBase {
  entity_type?: WorkflowEntityType
}

export interface DeadlineTriggerConfig extends TriggerConfigBase {
  deadline_days_before?: number
}

export interface CronTriggerConfig extends TriggerConfigBase {
  cron_expression?: string
}

export interface FieldChangeTriggerConfig extends TriggerConfigBase {
  field_name?: string
}

export type TriggerConfig =
  | TriggerConfigBase
  | DeadlineTriggerConfig
  | CronTriggerConfig
  | FieldChangeTriggerConfig

// =============================================================================
// Condition Interfaces
// =============================================================================

export interface WorkflowCondition {
  id?: string
  field: string
  operator: ConditionOperator
  value: unknown
}

// =============================================================================
// Action Configuration Interfaces
// =============================================================================

export interface ActionConfigBase {
  [key: string]: unknown
}

export interface NotifyUserConfig extends ActionConfigBase {
  user_id: string
  template?: string
}

export interface NotifyRoleConfig extends ActionConfigBase {
  role: string
  template?: string
}

export interface NotifyAssigneeConfig extends ActionConfigBase {
  template?: string
}

export interface UpdateStatusConfig extends ActionConfigBase {
  status: string
}

export interface UpdatePriorityConfig extends ActionConfigBase {
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface UpdateFieldConfig extends ActionConfigBase {
  field: string
  value: unknown
}

export interface AssignUserConfig extends ActionConfigBase {
  user_id: string
  notify?: boolean
}

export interface AssignRoleConfig extends ActionConfigBase {
  role: string
  strategy?: 'round_robin' | 'least_busy' | 'random'
  notify?: boolean
}

export interface CreateTaskConfig extends ActionConfigBase {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
}

export interface CreateCommentConfig extends ActionConfigBase {
  text: string
}

export interface AddTagConfig extends ActionConfigBase {
  tag_id: string
}

export interface RemoveTagConfig extends ActionConfigBase {
  tag_id: string
}

export interface CallWebhookConfig extends ActionConfigBase {
  webhook_id: string
  payload?: Record<string, unknown>
}

export interface SendEmailConfig extends ActionConfigBase {
  to: string
  template?: string
  subject?: string
  body?: string
}

export interface DelayConfig extends ActionConfigBase {
  minutes: number
}

export interface BranchConditionConfig extends ActionConfigBase {
  conditions: WorkflowCondition[]
  true_actions: WorkflowAction[]
  false_actions: WorkflowAction[]
}

export type ActionConfig =
  | NotifyUserConfig
  | NotifyRoleConfig
  | NotifyAssigneeConfig
  | UpdateStatusConfig
  | UpdatePriorityConfig
  | UpdateFieldConfig
  | AssignUserConfig
  | AssignRoleConfig
  | CreateTaskConfig
  | CreateCommentConfig
  | AddTagConfig
  | RemoveTagConfig
  | CallWebhookConfig
  | SendEmailConfig
  | DelayConfig
  | BranchConditionConfig

// =============================================================================
// Action Interface
// =============================================================================

export interface WorkflowAction {
  id?: string
  type: WorkflowActionType
  config: ActionConfig
}

// =============================================================================
// Main Rule Interface
// =============================================================================

export interface WorkflowRule {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  trigger_type: WorkflowTriggerType
  trigger_config: TriggerConfig
  entity_type: WorkflowEntityType
  conditions: WorkflowCondition[]
  condition_logic: ConditionLogic
  actions: WorkflowAction[]
  is_active: boolean
  run_once_per_entity: boolean
  max_executions_per_hour: number
  cooldown_minutes: number
  cron_expression?: string
  next_scheduled_run?: string
  organization_id?: string
  created_by: string
  created_at: string
  updated_at: string
  last_triggered_at?: string
  deleted_at?: string
}

export type WorkflowRuleCreate = Omit<
  WorkflowRule,
  | 'id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'last_triggered_at'
  | 'deleted_at'
  | 'next_scheduled_run'
>

export type WorkflowRuleUpdate = Partial<WorkflowRuleCreate>

// =============================================================================
// Execution Interfaces
// =============================================================================

export interface WorkflowExecutionLogEntry {
  action_index: number
  type: WorkflowActionType
  status: 'success' | 'failed' | 'skipped'
  executed_at: string
  result?: Record<string, unknown>
  error?: string
}

export interface WorkflowExecution {
  id: string
  rule_id: string
  entity_type: WorkflowEntityType
  entity_id: string
  status: WorkflowExecutionStatus
  trigger_context: Record<string, unknown>
  actions_executed: number
  actions_succeeded: number
  actions_failed: number
  execution_log: WorkflowExecutionLogEntry[]
  error_message?: string
  error_details?: Record<string, unknown>
  started_at?: string
  completed_at?: string
  duration_ms?: number
  triggered_by?: string
  created_at: string
  // Joined data
  workflow_rules?: Pick<WorkflowRule, 'name_en' | 'name_ar'>
}

// =============================================================================
// Notification Template Interface
// =============================================================================

export interface WorkflowNotificationTemplate {
  id: string
  code: string
  name_en: string
  name_ar: string
  subject_en: string
  subject_ar: string
  body_en: string
  body_ar: string
  channel: 'in_app' | 'email' | 'push' | 'all'
  available_variables: string[]
  is_system: boolean
  created_by?: string
  organization_id?: string
  created_at: string
  updated_at: string
}

// =============================================================================
// API Request/Response Interfaces
// =============================================================================

export interface WorkflowRulesListParams {
  page?: number
  limit?: number
  entity_type?: WorkflowEntityType
  trigger_type?: WorkflowTriggerType
  is_active?: boolean
  search?: string
}

export interface WorkflowRulesListResponse {
  data: WorkflowRule[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface WorkflowExecutionsListParams {
  page?: number
  limit?: number
  rule_id?: string
  entity_type?: WorkflowEntityType
  entity_id?: string
  status?: WorkflowExecutionStatus
}

export interface WorkflowExecutionsListResponse {
  data: WorkflowExecution[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface WorkflowTestRequest {
  rule_id: string
  entity_id?: string
  dry_run?: boolean
}

export interface WorkflowTestResponse {
  data: {
    rule_id: string
    rule_name: string
    entity_type: WorkflowEntityType
    entity_id: string | null
    dry_run: boolean
    conditions_matched: boolean
    conditions_details: Array<{
      field: string
      matched: boolean
      reason: string
    }>
    actions_to_execute: Array<{
      index: number
      type: WorkflowActionType
      config: ActionConfig
    }>
    would_execute: boolean
  }
}

export interface WorkflowTriggerRequest {
  trigger_type: WorkflowTriggerType
  entity_type: WorkflowEntityType
  entity_id: string
  trigger_context?: Record<string, unknown>
}

export interface WorkflowTriggerResponse {
  triggered_workflows: number
  executions: Array<{
    execution_id: string
    rule_id: string
    rule_name: string
  }>
}

// =============================================================================
// UI Helper Types
// =============================================================================

export interface TriggerTypeOption {
  value: WorkflowTriggerType
  label_en: string
  label_ar: string
  description_en: string
  description_ar: string
  icon: string
  category: 'event' | 'time' | 'manual'
}

export interface ActionTypeOption {
  value: WorkflowActionType
  label_en: string
  label_ar: string
  description_en: string
  description_ar: string
  icon: string
  category: 'notification' | 'assignment' | 'update' | 'create' | 'external' | 'control'
  configFields: ActionConfigField[]
}

export interface ActionConfigField {
  name: string
  label_en: string
  label_ar: string
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'user'
    | 'role'
    | 'tag'
    | 'webhook'
    | 'template'
    | 'status'
    | 'priority'
  required?: boolean
  options?: Array<{ value: string; label_en: string; label_ar: string }>
  placeholder_en?: string
  placeholder_ar?: string
}

export interface EntityTypeOption {
  value: WorkflowEntityType
  label_en: string
  label_ar: string
  icon: string
  availableFields: EntityField[]
}

export interface EntityField {
  name: string
  label_en: string
  label_ar: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  operators: ConditionOperator[]
  enumValues?: Array<{ value: string; label_en: string; label_ar: string }>
}

export interface ConditionOperatorOption {
  value: ConditionOperator
  label_en: string
  label_ar: string
  requiresValue: boolean
  valueType?: 'single' | 'list' | 'range' | 'none'
}

// =============================================================================
// Builder State Types
// =============================================================================

export interface WorkflowBuilderState {
  step: 'trigger' | 'conditions' | 'actions' | 'settings' | 'review'
  rule: Partial<WorkflowRuleCreate>
  errors: Record<string, string>
  isDirty: boolean
}
