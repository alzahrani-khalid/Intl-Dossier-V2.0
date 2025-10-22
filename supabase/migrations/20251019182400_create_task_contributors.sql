-- Migration: Create task_contributors table
-- Tracks team collaboration beyond the primary assignee
-- Part of: 025-unified-tasks-model implementation

-- Create task_contributors table
CREATE TABLE IF NOT EXISTS task_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Contributor role
  role TEXT NOT NULL CHECK (role IN ('helper', 'reviewer', 'advisor', 'observer', 'supervisor')),

  -- Optional contribution notes
  notes TEXT,

  -- Audit trail
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ,

  -- Prevent duplicate contributors
  UNIQUE(task_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE task_contributors IS 'Team collaboration tracking for tasks (spec 025-unified-tasks-model)';
COMMENT ON COLUMN task_contributors.role IS 'Type of contribution: helper, reviewer, advisor, observer, supervisor';
COMMENT ON COLUMN task_contributors.removed_at IS 'Soft delete timestamp for audit trail compliance';
COMMENT ON CONSTRAINT task_contributors_task_id_user_id_key ON task_contributors IS 'Prevents same user from being added twice as contributor';

-- Create indexes for common queries
CREATE INDEX idx_contributors_task ON task_contributors(task_id);
CREATE INDEX idx_contributors_user_active ON task_contributors(user_id) WHERE removed_at IS NULL;
