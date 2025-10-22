-- Migration: Add RLS policies for tasks table
-- Purpose: Allow users to read tasks that are assigned to them
-- Date: 2025-10-18

BEGIN;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks that are assigned to them
CREATE POLICY "Users can view their assigned tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
  -- Allow if user has an assignment for this task
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.work_item_id = tasks.id
    AND assignments.work_item_type = 'task'
    AND assignments.assignee_id = auth.uid()
  )
  OR
  -- Allow if user created the task
  created_by = auth.uid()
  OR
  -- Allow if user last modified the task
  last_modified_by = auth.uid()
);

-- Policy: Users can create tasks
CREATE POLICY "Users can create tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- Policy: Users can update tasks they created or are assigned to
CREATE POLICY "Users can update their tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  -- Allow if user has an assignment for this task
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.work_item_id = tasks.id
    AND assignments.work_item_type = 'task'
    AND assignments.assignee_id = auth.uid()
  )
  OR
  -- Allow if user created the task
  created_by = auth.uid()
  OR
  -- Allow if user last modified the task
  last_modified_by = auth.uid()
)
WITH CHECK (
  last_modified_by = auth.uid()
);

-- Policy: Service role can do anything (for Edge Functions)
CREATE POLICY "Service role can manage all tasks"
ON tasks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
