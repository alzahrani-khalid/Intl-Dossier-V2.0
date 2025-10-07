-- Migration: Create assignment_checklist_items table
-- Feature: 014-full-assignment-detail
-- Task: T005

CREATE TABLE IF NOT EXISTS assignment_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 500),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries with sequence ordering
CREATE INDEX IF NOT EXISTS idx_checklist_assignment
ON assignment_checklist_items(assignment_id, sequence);

-- Enable RLS
ALTER TABLE assignment_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users with view permission can read checklist
CREATE POLICY checklist_select ON assignment_checklist_items
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Users with view permission can manage checklist
CREATE POLICY checklist_insert ON assignment_checklist_items
FOR INSERT
WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

CREATE POLICY checklist_update ON assignment_checklist_items
FOR UPDATE
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

CREATE POLICY checklist_delete ON assignment_checklist_items
FOR DELETE
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- Comment on table
COMMENT ON TABLE assignment_checklist_items IS
  'Individual checklist items for tracking assignment progress';
