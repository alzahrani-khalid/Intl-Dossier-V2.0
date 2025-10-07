-- Migration: Create assignment_observers table
-- Feature: 014-full-assignment-detail
-- Task: T007

CREATE TABLE IF NOT EXISTS assignment_observers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'other')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_observer_per_assignment UNIQUE(assignment_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_observers_assignment
ON assignment_observers(assignment_id);

CREATE INDEX IF NOT EXISTS idx_observers_user
ON assignment_observers(user_id);

-- Enable RLS
ALTER TABLE assignment_observers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Assignment assignee and observers can read observers list
CREATE POLICY observers_select ON assignment_observers
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE assignee_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

-- RLS Policy: Observers can be added by Edge Functions (validated server-side)
-- This policy allows authenticated users to insert if they have permission
CREATE POLICY observers_insert ON assignment_observers
FOR INSERT
WITH CHECK (
  -- Check will be enforced by Edge Function logic
  -- User must have appropriate role and assignment access
  auth.uid() IS NOT NULL
);

-- RLS Policy: Observers can be removed by Edge Functions or themselves
CREATE POLICY observers_delete ON assignment_observers
FOR DELETE
USING (
  user_id = auth.uid() OR
  assignment_id IN (
    SELECT id FROM assignments WHERE assignee_id = auth.uid()
  )
);

-- Comment on table
COMMENT ON TABLE assignment_observers IS
  'Users added as observers to assignments (typically supervisors after escalation)';
