-- Migration: T007 - Create assignments table
-- Description: Core assignment records linking work items to staff with SLA tracking
-- Dependencies: T001 (enums), T004 (staff_profiles), T006 (sla_configs)

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL,
  work_item_type work_item_type NOT NULL,
  assignee_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id), -- NULL if auto-assigned
  sla_deadline TIMESTAMPTZ NOT NULL,
  priority priority_level NOT NULL,
  status assignment_status NOT NULL DEFAULT 'assigned',
  warning_sent_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalation_recipient_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  override_reason TEXT, -- Populated if manual override
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (escalated_at IS NULL OR escalated_at >= assigned_at),
  CHECK (completed_at IS NULL OR completed_at >= assigned_at),

  -- Prevent duplicate active assignments for same work item
  CONSTRAINT unique_active_assignment UNIQUE (work_item_id, work_item_type)
    DEFERRABLE INITIALLY DEFERRED
);

-- Create partial unique constraint for active assignments only
CREATE UNIQUE INDEX idx_assignments_active_unique
  ON assignments (work_item_id, work_item_type)
  WHERE status IN ('assigned', 'in_progress');

-- Performance indexes
CREATE INDEX idx_assignments_assignee ON assignments(assignee_id);
CREATE INDEX idx_assignments_sla ON assignments(sla_deadline)
  WHERE status IN ('assigned', 'in_progress');
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_work_item ON assignments(work_item_id, work_item_type);
CREATE INDEX idx_assignments_priority ON assignments(priority DESC);

-- Comments
COMMENT ON TABLE assignments IS 'Work item assignments with SLA tracking and escalation status';
COMMENT ON COLUMN assignments.sla_deadline IS 'Calculated deadline (assigned_at + deadline_hours from sla_configs)';
COMMENT ON COLUMN assignments.warning_sent_at IS 'When 75% SLA warning was sent (NULL if not sent)';
COMMENT ON COLUMN assignments.override_reason IS 'Required when assigned_by is not NULL (manual override)';
