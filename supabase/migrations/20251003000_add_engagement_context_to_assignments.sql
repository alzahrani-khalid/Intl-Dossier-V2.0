-- Migration: Add engagement context to assignments table
-- Feature: 014-full-assignment-detail
-- Task: T001

-- Create engagement workflow stage enum
CREATE TYPE engagement_workflow_stage AS ENUM (
  'todo',          -- Not started
  'in_progress',   -- Being worked on
  'review',        -- Awaiting review/approval
  'done'           -- Completed
);

-- Add engagement_id column to link assignments to parent engagement
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;

-- Add workflow_stage column
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS workflow_stage engagement_workflow_stage NOT NULL DEFAULT 'todo';

-- Index for querying assignments by engagement
CREATE INDEX IF NOT EXISTS idx_assignments_engagement
ON assignments(engagement_id)
WHERE engagement_id IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN assignments.engagement_id IS
  'Optional link to engagement (NULL for standalone assignments from intake)';

COMMENT ON COLUMN assignments.workflow_stage IS
  'Workflow stage for kanban board visualization in engagement context';

-- Create trigger function to sync workflow_stage with status
CREATE OR REPLACE FUNCTION sync_assignment_workflow_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Map assignment status to workflow stage
  NEW.workflow_stage := CASE NEW.status
    WHEN 'assigned' THEN 'todo'::engagement_workflow_stage
    WHEN 'in_progress' THEN 'in_progress'::engagement_workflow_stage
    WHEN 'completed' THEN 'done'::engagement_workflow_stage
    WHEN 'cancelled' THEN 'done'::engagement_workflow_stage
    ELSE NEW.workflow_stage
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync workflow_stage when status changes
DROP TRIGGER IF EXISTS sync_workflow_stage_on_status_change ON assignments;
CREATE TRIGGER sync_workflow_stage_on_status_change
  BEFORE INSERT OR UPDATE OF status ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_assignment_workflow_stage();
