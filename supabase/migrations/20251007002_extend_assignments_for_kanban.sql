-- Migration 2: Extend assignments table with SLA deadline columns
-- Feature: 016-implement-kanban
-- Date: 2025-10-07

-- Add dual SLA tracking columns to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS overall_sla_deadline timestamptz,
ADD COLUMN IF NOT EXISTS current_stage_sla_deadline timestamptz;

-- Create indexes for SLA deadline queries (important for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_assignments_overall_sla
  ON assignments(overall_sla_deadline) WHERE overall_sla_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_stage_sla
  ON assignments(current_stage_sla_deadline) WHERE current_stage_sla_deadline IS NOT NULL;

-- Create composite index for Kanban board queries (engagement + workflow_stage)
CREATE INDEX IF NOT EXISTS idx_assignments_engagement_stage
  ON assignments(engagement_id, workflow_stage) WHERE engagement_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN assignments.overall_sla_deadline IS 'Overall assignment SLA deadline from creation to completion (done stage). Remains constant throughout assignment lifecycle.';

COMMENT ON COLUMN assignments.current_stage_sla_deadline IS 'Current workflow stage SLA deadline. Updates on each stage transition. NULL for done/cancelled stages.';
