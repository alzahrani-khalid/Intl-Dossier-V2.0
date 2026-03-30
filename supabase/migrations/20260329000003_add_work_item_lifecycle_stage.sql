-- Migration: Add optional lifecycle_stage to tasks table
-- Requirements: LIFE-05

-- Add nullable lifecycle_stage column to tasks
ALTER TABLE tasks
ADD COLUMN lifecycle_stage TEXT
CHECK (lifecycle_stage IS NULL OR lifecycle_stage IN ('intake','preparation','briefing','execution','follow_up','closed'));

-- Add index for grouping/filtering work items by lifecycle stage
CREATE INDEX idx_tasks_lifecycle_stage
ON tasks(lifecycle_stage)
WHERE lifecycle_stage IS NOT NULL;
