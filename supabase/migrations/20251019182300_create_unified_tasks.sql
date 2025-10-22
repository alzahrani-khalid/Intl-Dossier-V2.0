-- Migration: Create unified tasks table
-- Consolidates assignments + tasks into single unified structure
-- Part of: 025-unified-tasks-model implementation

-- Create tasks table (unified assignments + task details)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task identity
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,

  -- Assignment context (WHO)
  assignee_id UUID NOT NULL REFERENCES auth.users(id),

  -- Engagement context (for kanban boards)
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,

  -- Lifecycle status
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  workflow_stage TEXT NOT NULL CHECK (workflow_stage IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),

  -- Priority and SLA
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  sla_deadline TIMESTAMPTZ,

  -- Work item linkage (single item)
  work_item_type TEXT CHECK (work_item_type IN ('dossier', 'position', 'ticket', 'generic')),
  work_item_id UUID,

  -- Multiple work items support (JSONB)
  source JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Soft delete for audit compliance
  is_deleted BOOLEAN NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT tasks_generic_no_work_item CHECK (
    work_item_type IS NULL OR work_item_type != 'generic' OR work_item_id IS NULL
  ),
  CONSTRAINT tasks_sla_future CHECK (
    sla_deadline IS NULL OR sla_deadline > created_at
  ),
  CONSTRAINT tasks_completed_metadata CHECK (
    (status != 'completed' AND completed_by IS NULL AND completed_at IS NULL) OR
    (status = 'completed' AND completed_by IS NOT NULL AND completed_at IS NOT NULL)
  )
);

-- Add comment for documentation
COMMENT ON TABLE tasks IS 'Unified tasks table consolidating assignments and task details (spec 025-unified-tasks-model)';
COMMENT ON COLUMN tasks.title IS 'Descriptive task title replacing cryptic assignment IDs';
COMMENT ON COLUMN tasks.source IS 'JSONB for multiple work items: {"dossier_ids": [...], "position_ids": [...], "ticket_ids": [...]}';
COMMENT ON COLUMN tasks.updated_at IS 'Used for optimistic locking via timestamp comparison';
COMMENT ON COLUMN tasks.engagement_id IS 'Optional engagement context for kanban board grouping';

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
