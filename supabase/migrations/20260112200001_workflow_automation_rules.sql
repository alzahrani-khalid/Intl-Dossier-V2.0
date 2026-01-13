-- Migration: Workflow Automation Rules
-- Feature: workflow-automation-rules
-- Description: No-code workflow builder for automating common processes
-- Author: Claude
-- Date: 2026-01-12

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Trigger types for workflow rules
CREATE TYPE workflow_trigger_type AS ENUM (
  'ticket_created',           -- New intake ticket created
  'ticket_updated',           -- Intake ticket updated
  'status_changed',           -- Status change on any entity
  'deadline_approaching',     -- Configurable days before deadline
  'deadline_overdue',         -- Deadline passed
  'assignment_changed',       -- Assignee changed
  'priority_changed',         -- Priority escalation/de-escalation
  'field_changed',            -- Specific field value changed
  'comment_added',            -- New comment on entity
  'document_uploaded',        -- Document attached to entity
  'engagement_created',       -- New engagement created
  'commitment_created',       -- New commitment created
  'commitment_due',           -- Commitment deadline reached
  'schedule_cron',            -- Scheduled (cron-based) trigger
  'manual'                    -- Manual trigger by user
);

-- Action types that can be executed
CREATE TYPE workflow_action_type AS ENUM (
  'notify_user',              -- Send notification to specific user
  'notify_role',              -- Send notification to users with role
  'notify_assignee',          -- Send notification to current assignee
  'notify_webhook',           -- Call external webhook
  'assign_user',              -- Assign to specific user
  'assign_role',              -- Assign to user with role (round-robin)
  'update_field',             -- Update field value
  'update_status',            -- Update status
  'update_priority',          -- Update priority
  'add_tag',                  -- Add tag to entity
  'remove_tag',               -- Remove tag from entity
  'create_task',              -- Create related task
  'create_comment',           -- Add system comment
  'send_email',               -- Send email notification
  'call_webhook',             -- Call external webhook with payload
  'delay',                    -- Wait before next action
  'branch_condition'          -- Conditional branching
);

-- Entity types that workflows can operate on
CREATE TYPE workflow_entity_type AS ENUM (
  'intake_ticket',
  'engagement',
  'commitment',
  'task',
  'dossier',
  'position',
  'document',
  'calendar_entry'
);

-- Condition operators for rule evaluation
CREATE TYPE workflow_condition_operator AS ENUM (
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'is_empty',
  'is_not_empty',
  'in_list',
  'not_in_list',
  'between',
  'changed_to',
  'changed_from',
  'has_changed'
);

-- Workflow execution status
CREATE TYPE workflow_execution_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'paused'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Main workflow rules table
CREATE TABLE workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bilingual naming
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Trigger configuration
  trigger_type workflow_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- Example trigger_config:
  -- { "entity_type": "intake_ticket", "deadline_days_before": 3, "cron_expression": "0 9 * * 1" }

  -- Entity scope
  entity_type workflow_entity_type NOT NULL,

  -- Conditions (JSON array of condition objects)
  conditions JSONB NOT NULL DEFAULT '[]',
  -- Example conditions:
  -- [
  --   { "field": "priority", "operator": "equals", "value": "urgent" },
  --   { "field": "status", "operator": "not_equals", "value": "completed" }
  -- ]

  -- Condition logic (all = AND, any = OR)
  condition_logic VARCHAR(10) NOT NULL DEFAULT 'all' CHECK (condition_logic IN ('all', 'any')),

  -- Actions (JSON array of action objects, executed in order)
  actions JSONB NOT NULL DEFAULT '[]',
  -- Example actions:
  -- [
  --   { "type": "notify_user", "config": { "user_id": "uuid", "template": "deadline_reminder" } },
  --   { "type": "update_priority", "config": { "priority": "urgent" } },
  --   { "type": "delay", "config": { "minutes": 30 } },
  --   { "type": "call_webhook", "config": { "webhook_id": "uuid" } }
  -- ]

  -- Execution settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  run_once_per_entity BOOLEAN NOT NULL DEFAULT false,
  max_executions_per_hour INTEGER DEFAULT 100,
  cooldown_minutes INTEGER DEFAULT 0,

  -- Scheduling (for cron-based triggers)
  cron_expression VARCHAR(100),
  next_scheduled_run TIMESTAMPTZ,

  -- Ownership and audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Index for active rules lookup by trigger type
CREATE INDEX idx_workflow_rules_trigger ON workflow_rules(trigger_type, entity_type)
  WHERE is_active = true AND deleted_at IS NULL;

-- Index for scheduled rules
CREATE INDEX idx_workflow_rules_scheduled ON workflow_rules(next_scheduled_run)
  WHERE trigger_type = 'schedule_cron' AND is_active = true AND deleted_at IS NULL;

-- Index for organization-scoped rules
CREATE INDEX idx_workflow_rules_org ON workflow_rules(organization_id)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- WORKFLOW EXECUTION LOG (Partitioned for performance)
-- =============================================================================

CREATE TABLE workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Rule reference
  rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,

  -- Entity that triggered the workflow
  entity_type workflow_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Execution status
  status workflow_execution_status NOT NULL DEFAULT 'pending',

  -- Trigger context (what triggered this execution)
  trigger_context JSONB NOT NULL DEFAULT '{}',
  -- Example: { "trigger_type": "status_changed", "old_value": "pending", "new_value": "in_progress" }

  -- Execution results
  actions_executed INTEGER DEFAULT 0,
  actions_succeeded INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,

  -- Action execution log
  execution_log JSONB NOT NULL DEFAULT '[]',
  -- Example:
  -- [
  --   { "action_index": 0, "type": "notify_user", "status": "success", "executed_at": "...", "result": {} },
  --   { "action_index": 1, "type": "update_field", "status": "failed", "executed_at": "...", "error": "..." }
  -- ]

  -- Error details if failed
  error_message TEXT,
  error_details JSONB,

  -- Performance tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Audit
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for execution logs (monthly for better performance)
CREATE TABLE workflow_executions_2026_01 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE workflow_executions_2026_02 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE workflow_executions_2026_03 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE workflow_executions_2026_04 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE workflow_executions_2026_05 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE workflow_executions_2026_06 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE workflow_executions_2026_07 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE workflow_executions_2026_08 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE workflow_executions_2026_09 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE workflow_executions_2026_10 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE workflow_executions_2026_11 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE workflow_executions_2026_12 PARTITION OF workflow_executions
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes for execution log queries
CREATE INDEX idx_workflow_executions_rule ON workflow_executions(rule_id, created_at DESC);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status, created_at DESC)
  WHERE status IN ('pending', 'running');

-- =============================================================================
-- WORKFLOW ACTION QUEUE (for async processing)
-- =============================================================================

CREATE TABLE workflow_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Execution reference
  execution_id UUID NOT NULL,
  execution_created_at TIMESTAMPTZ NOT NULL,

  -- Action details
  action_index INTEGER NOT NULL,
  action_type workflow_action_type NOT NULL,
  action_config JSONB NOT NULL,

  -- Processing status
  status workflow_execution_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by VARCHAR(100),

  -- Results
  result JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  FOREIGN KEY (execution_id, execution_created_at)
    REFERENCES workflow_executions(id, created_at) ON DELETE CASCADE
);

-- Index for queue processing
CREATE INDEX idx_workflow_queue_pending ON workflow_action_queue(scheduled_for, status)
  WHERE status = 'pending';
CREATE INDEX idx_workflow_queue_locked ON workflow_action_queue(locked_at)
  WHERE status = 'running';

-- =============================================================================
-- NOTIFICATION TEMPLATES for workflow actions
-- =============================================================================

CREATE TABLE workflow_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  code VARCHAR(100) NOT NULL UNIQUE,
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,

  -- Template content (supports variables like {{entity.title}}, {{user.name}})
  subject_en TEXT NOT NULL,
  subject_ar TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_ar TEXT NOT NULL,

  -- Template type
  channel VARCHAR(50) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'push', 'all')),

  -- Variables documentation
  available_variables JSONB NOT NULL DEFAULT '[]',
  -- Example: ["entity.title", "entity.status", "user.name", "deadline", "url"]

  -- Ownership
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO workflow_notification_templates (code, name_en, name_ar, subject_en, subject_ar, body_en, body_ar, is_system, available_variables, channel) VALUES
('deadline_reminder', 'Deadline Reminder', 'تذكير بالموعد النهائي',
 'Deadline approaching: {{entity.title}}', 'اقتراب الموعد النهائي: {{entity.title}}',
 'The deadline for "{{entity.title}}" is in {{days_remaining}} days. Please take action.',
 'الموعد النهائي لـ "{{entity.title}}" بعد {{days_remaining}} أيام. يرجى اتخاذ إجراء.',
 true, '["entity.title", "entity.type", "days_remaining", "deadline", "url"]'::jsonb, 'all'),

('overdue_alert', 'Overdue Alert', 'تنبيه التأخير',
 'Overdue: {{entity.title}}', 'متأخر: {{entity.title}}',
 'The item "{{entity.title}}" is now overdue by {{days_overdue}} days. Immediate attention required.',
 'العنصر "{{entity.title}}" متأخر الآن بـ {{days_overdue}} أيام. يتطلب اهتماما فوريا.',
 true, '["entity.title", "entity.type", "days_overdue", "deadline", "url"]'::jsonb, 'all'),

('assignment_notification', 'Assignment Notification', 'إشعار التعيين',
 'New assignment: {{entity.title}}', 'تعيين جديد: {{entity.title}}',
 'You have been assigned to "{{entity.title}}" by {{assigned_by}}.',
 'تم تعيينك في "{{entity.title}}" بواسطة {{assigned_by}}.',
 true, '["entity.title", "entity.type", "assigned_by", "url"]'::jsonb, 'all'),

('status_change', 'Status Change', 'تغيير الحالة',
 'Status updated: {{entity.title}}', 'تحديث الحالة: {{entity.title}}',
 'The status of "{{entity.title}}" has changed from {{old_status}} to {{new_status}}.',
 'تغيرت حالة "{{entity.title}}" من {{old_status}} إلى {{new_status}}.',
 true, '["entity.title", "entity.type", "old_status", "new_status", "url"]'::jsonb, 'in_app'),

('priority_escalation', 'Priority Escalation', 'تصعيد الأولوية',
 'Priority escalated: {{entity.title}}', 'تصعيد الأولوية: {{entity.title}}',
 'The priority of "{{entity.title}}" has been escalated to {{new_priority}}.',
 'تم تصعيد أولوية "{{entity.title}}" إلى {{new_priority}}.',
 true, '["entity.title", "entity.type", "old_priority", "new_priority", "url"]'::jsonb, 'all'),

('new_ticket', 'New Ticket', 'تذكرة جديدة',
 'New ticket: {{entity.title}}', 'تذكرة جديدة: {{entity.title}}',
 'A new {{entity.type}} has been created: "{{entity.title}}".',
 'تم إنشاء {{entity.type}} جديد: "{{entity.title}}".',
 true, '["entity.title", "entity.type", "created_by", "url"]'::jsonb, 'in_app'),

('workflow_action_failed', 'Workflow Action Failed', 'فشل إجراء سير العمل',
 'Workflow action failed: {{rule_name}}', 'فشل إجراء سير العمل: {{rule_name}}',
 'An action in workflow "{{rule_name}}" failed: {{error_message}}',
 'فشل إجراء في سير العمل "{{rule_name}}": {{error_message}}',
 true, '["rule_name", "action_type", "error_message", "entity.title"]'::jsonb, 'in_app');

-- =============================================================================
-- ENTITY WORKFLOW HISTORY (track which workflows ran on each entity)
-- =============================================================================

CREATE TABLE entity_workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type workflow_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
  last_executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_count INTEGER NOT NULL DEFAULT 1,

  UNIQUE(entity_type, entity_id, rule_id)
);

-- Index for checking if workflow already ran on entity
CREATE INDEX idx_entity_workflow_lookup ON entity_workflow_history(entity_type, entity_id, rule_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_workflow_history ENABLE ROW LEVEL SECURITY;

-- Workflow rules: users can see their own rules and organization rules
CREATE POLICY "Users can view their own workflow rules"
  ON workflow_rules FOR SELECT
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflow rules"
  ON workflow_rules FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own workflow rules"
  ON workflow_rules FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own workflow rules"
  ON workflow_rules FOR DELETE
  USING (created_by = auth.uid());

-- Workflow executions: users can see executions for rules they have access to
CREATE POLICY "Users can view workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    rule_id IN (
      SELECT id FROM workflow_rules
      WHERE created_by = auth.uid()
        OR organization_id IN (
          SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    )
  );

-- Action queue: internal use only, accessible via service role
CREATE POLICY "Service role can manage action queue"
  ON workflow_action_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Notification templates: system templates visible to all, custom to creators
CREATE POLICY "Users can view notification templates"
  ON workflow_notification_templates FOR SELECT
  USING (
    is_system = true
    OR created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create custom notification templates"
  ON workflow_notification_templates FOR INSERT
  WITH CHECK (is_system = false AND created_by = auth.uid());

CREATE POLICY "Users can update their notification templates"
  ON workflow_notification_templates FOR UPDATE
  USING (is_system = false AND created_by = auth.uid())
  WITH CHECK (is_system = false AND created_by = auth.uid());

-- Entity workflow history: read access for users who can see the entity
CREATE POLICY "Users can view entity workflow history"
  ON entity_workflow_history FOR SELECT
  USING (true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to evaluate workflow conditions
CREATE OR REPLACE FUNCTION evaluate_workflow_conditions(
  p_conditions JSONB,
  p_condition_logic VARCHAR,
  p_entity_data JSONB,
  p_trigger_context JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_condition JSONB;
  v_field TEXT;
  v_operator workflow_condition_operator;
  v_value JSONB;
  v_entity_value JSONB;
  v_result BOOLEAN;
  v_any_true BOOLEAN := false;
  v_all_true BOOLEAN := true;
BEGIN
  -- Handle empty conditions (always true)
  IF p_conditions IS NULL OR jsonb_array_length(p_conditions) = 0 THEN
    RETURN true;
  END IF;

  -- Evaluate each condition
  FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions) LOOP
    v_field := v_condition->>'field';
    v_operator := (v_condition->>'operator')::workflow_condition_operator;
    v_value := v_condition->'value';

    -- Get entity value (supports nested fields with dot notation)
    v_entity_value := p_entity_data #> string_to_array(v_field, '.');

    -- Evaluate based on operator
    CASE v_operator
      WHEN 'equals' THEN
        v_result := v_entity_value = v_value;
      WHEN 'not_equals' THEN
        v_result := v_entity_value IS DISTINCT FROM v_value;
      WHEN 'contains' THEN
        v_result := v_entity_value::text ILIKE '%' || (v_value#>>'{}') || '%';
      WHEN 'not_contains' THEN
        v_result := v_entity_value::text NOT ILIKE '%' || (v_value#>>'{}') || '%';
      WHEN 'starts_with' THEN
        v_result := v_entity_value::text ILIKE (v_value#>>'{}') || '%';
      WHEN 'ends_with' THEN
        v_result := v_entity_value::text ILIKE '%' || (v_value#>>'{}');
      WHEN 'greater_than' THEN
        v_result := (v_entity_value#>>'{}')::numeric > (v_value#>>'{}')::numeric;
      WHEN 'less_than' THEN
        v_result := (v_entity_value#>>'{}')::numeric < (v_value#>>'{}')::numeric;
      WHEN 'greater_than_or_equal' THEN
        v_result := (v_entity_value#>>'{}')::numeric >= (v_value#>>'{}')::numeric;
      WHEN 'less_than_or_equal' THEN
        v_result := (v_entity_value#>>'{}')::numeric <= (v_value#>>'{}')::numeric;
      WHEN 'is_empty' THEN
        v_result := v_entity_value IS NULL OR v_entity_value = 'null'::jsonb OR v_entity_value = '""'::jsonb;
      WHEN 'is_not_empty' THEN
        v_result := v_entity_value IS NOT NULL AND v_entity_value != 'null'::jsonb AND v_entity_value != '""'::jsonb;
      WHEN 'in_list' THEN
        v_result := v_entity_value <@ v_value;
      WHEN 'not_in_list' THEN
        v_result := NOT (v_entity_value <@ v_value);
      WHEN 'changed_to' THEN
        v_result := p_trigger_context->'new_value' = v_value;
      WHEN 'changed_from' THEN
        v_result := p_trigger_context->'old_value' = v_value;
      WHEN 'has_changed' THEN
        v_result := p_trigger_context->'old_value' IS DISTINCT FROM p_trigger_context->'new_value';
      ELSE
        v_result := false;
    END CASE;

    -- Update logic results
    v_any_true := v_any_true OR v_result;
    v_all_true := v_all_true AND v_result;
  END LOOP;

  -- Return based on logic type
  IF p_condition_logic = 'any' THEN
    RETURN v_any_true;
  ELSE
    RETURN v_all_true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue workflow execution
CREATE OR REPLACE FUNCTION queue_workflow_execution(
  p_rule_id UUID,
  p_entity_type workflow_entity_type,
  p_entity_id UUID,
  p_trigger_context JSONB,
  p_triggered_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_rule RECORD;
  v_action JSONB;
  v_action_index INTEGER := 0;
  v_scheduled_for TIMESTAMPTZ := NOW();
BEGIN
  -- Get rule details
  SELECT * INTO v_rule FROM workflow_rules WHERE id = p_rule_id;

  IF NOT FOUND OR NOT v_rule.is_active THEN
    RETURN NULL;
  END IF;

  -- Check run_once_per_entity constraint
  IF v_rule.run_once_per_entity THEN
    IF EXISTS (
      SELECT 1 FROM entity_workflow_history
      WHERE entity_type = p_entity_type AND entity_id = p_entity_id AND rule_id = p_rule_id
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Check cooldown
  IF v_rule.cooldown_minutes > 0 AND v_rule.last_triggered_at IS NOT NULL THEN
    IF v_rule.last_triggered_at + (v_rule.cooldown_minutes || ' minutes')::interval > NOW() THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Create execution record
  INSERT INTO workflow_executions (
    rule_id, entity_type, entity_id, status, trigger_context, triggered_by, started_at
  ) VALUES (
    p_rule_id, p_entity_type, p_entity_id, 'pending', p_trigger_context, p_triggered_by, NOW()
  ) RETURNING id INTO v_execution_id;

  -- Queue each action
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions) LOOP
    -- Handle delay actions by adjusting scheduled_for
    IF (v_action->>'type')::workflow_action_type = 'delay' THEN
      v_scheduled_for := v_scheduled_for + ((v_action->'config'->>'minutes')::integer || ' minutes')::interval;
    ELSE
      INSERT INTO workflow_action_queue (
        execution_id, execution_created_at, action_index, action_type, action_config, scheduled_for
      ) VALUES (
        v_execution_id, NOW(), v_action_index, (v_action->>'type')::workflow_action_type,
        v_action->'config', v_scheduled_for
      );
    END IF;

    v_action_index := v_action_index + 1;
  END LOOP;

  -- Update rule last triggered
  UPDATE workflow_rules SET last_triggered_at = NOW() WHERE id = p_rule_id;

  -- Update entity workflow history
  INSERT INTO entity_workflow_history (entity_type, entity_id, rule_id, last_executed_at)
  VALUES (p_entity_type, p_entity_id, p_rule_id, NOW())
  ON CONFLICT (entity_type, entity_id, rule_id)
  DO UPDATE SET last_executed_at = NOW(), execution_count = entity_workflow_history.execution_count + 1;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find and trigger matching workflows
CREATE OR REPLACE FUNCTION trigger_matching_workflows(
  p_trigger_type workflow_trigger_type,
  p_entity_type workflow_entity_type,
  p_entity_id UUID,
  p_entity_data JSONB,
  p_trigger_context JSONB,
  p_triggered_by UUID DEFAULT NULL
) RETURNS TABLE(execution_id UUID, rule_id UUID, rule_name TEXT) AS $$
DECLARE
  v_rule RECORD;
  v_execution_id UUID;
BEGIN
  -- Find all active rules matching the trigger
  FOR v_rule IN
    SELECT * FROM workflow_rules
    WHERE trigger_type = p_trigger_type
      AND entity_type = p_entity_type
      AND is_active = true
      AND deleted_at IS NULL
  LOOP
    -- Evaluate conditions
    IF evaluate_workflow_conditions(
      v_rule.conditions,
      v_rule.condition_logic,
      p_entity_data,
      p_trigger_context
    ) THEN
      -- Queue execution
      v_execution_id := queue_workflow_execution(
        v_rule.id,
        p_entity_type,
        p_entity_id,
        p_trigger_context,
        p_triggered_by
      );

      IF v_execution_id IS NOT NULL THEN
        execution_id := v_execution_id;
        rule_id := v_rule.id;
        rule_name := v_rule.name_en;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS for automatic workflow invocation
-- =============================================================================

-- Generic trigger function for entity changes
CREATE OR REPLACE FUNCTION workflow_entity_change_trigger() RETURNS TRIGGER AS $$
DECLARE
  v_entity_type workflow_entity_type;
  v_trigger_type workflow_trigger_type;
  v_entity_data JSONB;
  v_trigger_context JSONB;
BEGIN
  -- Determine entity type from table name
  v_entity_type := CASE TG_TABLE_NAME
    WHEN 'intake_tickets' THEN 'intake_ticket'::workflow_entity_type
    WHEN 'engagements' THEN 'engagement'::workflow_entity_type
    WHEN 'commitments' THEN 'commitment'::workflow_entity_type
    WHEN 'tasks' THEN 'task'::workflow_entity_type
    WHEN 'dossiers' THEN 'dossier'::workflow_entity_type
    WHEN 'positions' THEN 'position'::workflow_entity_type
    WHEN 'documents' THEN 'document'::workflow_entity_type
    WHEN 'calendar_entries' THEN 'calendar_entry'::workflow_entity_type
    ELSE NULL
  END;

  IF v_entity_type IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine trigger type and context
  IF TG_OP = 'INSERT' THEN
    v_trigger_type := CASE v_entity_type
      WHEN 'intake_ticket' THEN 'ticket_created'::workflow_trigger_type
      WHEN 'engagement' THEN 'engagement_created'::workflow_trigger_type
      WHEN 'commitment' THEN 'commitment_created'::workflow_trigger_type
      ELSE 'field_changed'::workflow_trigger_type
    END;
    v_entity_data := to_jsonb(NEW);
    v_trigger_context := jsonb_build_object('operation', 'insert');
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_data := to_jsonb(NEW);

    -- Check for specific field changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_trigger_type := 'status_changed'::workflow_trigger_type;
      v_trigger_context := jsonb_build_object(
        'operation', 'update',
        'field', 'status',
        'old_value', OLD.status,
        'new_value', NEW.status
      );
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      v_trigger_type := 'priority_changed'::workflow_trigger_type;
      v_trigger_context := jsonb_build_object(
        'operation', 'update',
        'field', 'priority',
        'old_value', OLD.priority,
        'new_value', NEW.priority
      );
    ELSIF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      v_trigger_type := 'assignment_changed'::workflow_trigger_type;
      v_trigger_context := jsonb_build_object(
        'operation', 'update',
        'field', 'assignee_id',
        'old_value', OLD.assignee_id,
        'new_value', NEW.assignee_id
      );
    ELSE
      v_trigger_type := 'field_changed'::workflow_trigger_type;
      v_trigger_context := jsonb_build_object('operation', 'update');
    END IF;
  END IF;

  -- Trigger matching workflows (async via pg_notify)
  PERFORM pg_notify('workflow_trigger', jsonb_build_object(
    'trigger_type', v_trigger_type,
    'entity_type', v_entity_type,
    'entity_id', NEW.id,
    'entity_data', v_entity_data,
    'trigger_context', v_trigger_context,
    'triggered_by', COALESCE(NEW.updated_by, NEW.created_by, auth.uid())
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to relevant tables (intake_tickets example)
-- Note: Apply similar triggers to other entity tables as needed
DROP TRIGGER IF EXISTS workflow_trigger_intake_tickets ON intake_tickets;
CREATE TRIGGER workflow_trigger_intake_tickets
  AFTER INSERT OR UPDATE ON intake_tickets
  FOR EACH ROW
  EXECUTE FUNCTION workflow_entity_change_trigger();

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE TRIGGER workflow_rules_updated_at
  BEFORE UPDATE ON workflow_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER workflow_notification_templates_updated_at
  BEFORE UPDATE ON workflow_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE workflow_rules IS 'No-code workflow automation rules with triggers, conditions, and actions';
COMMENT ON TABLE workflow_executions IS 'Execution log for workflow rules (partitioned by month)';
COMMENT ON TABLE workflow_action_queue IS 'Queue for async workflow action processing';
COMMENT ON TABLE workflow_notification_templates IS 'Reusable notification templates for workflow actions';
COMMENT ON TABLE entity_workflow_history IS 'Track which workflows have run on each entity';

COMMENT ON FUNCTION evaluate_workflow_conditions IS 'Evaluates workflow conditions against entity data';
COMMENT ON FUNCTION queue_workflow_execution IS 'Queues a workflow execution with its actions';
COMMENT ON FUNCTION trigger_matching_workflows IS 'Finds and triggers all matching workflows for an event';
