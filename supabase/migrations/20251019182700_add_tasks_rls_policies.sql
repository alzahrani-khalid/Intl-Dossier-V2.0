-- Migration: Create RLS policies for tasks and task_contributors tables
-- Security: Users can only view tasks they're assigned to, created, or contributed to
-- Part of: 025-unified-tasks-model implementation

-- ============================================================================
-- TASKS TABLE RLS POLICIES
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view tasks they are assigned to, created, or contributed to
CREATE POLICY tasks_select_policy ON tasks
FOR SELECT
USING (
  auth.uid() = assignee_id
  OR auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM task_contributors
    WHERE task_id = tasks.id
      AND user_id = auth.uid()
      AND removed_at IS NULL
  )
);

COMMENT ON POLICY tasks_select_policy ON tasks IS 'Users can view tasks they are assigned to, created, or actively contributing to';

-- Policy 2: INSERT - Users can create tasks where they are the assignee or creator
CREATE POLICY tasks_insert_policy ON tasks
FOR INSERT
WITH CHECK (
  auth.uid() = assignee_id
  OR auth.uid() = created_by
);

COMMENT ON POLICY tasks_insert_policy ON tasks IS 'Users can create tasks where they are the assignee or creator';

-- Policy 3: UPDATE - Users can update tasks they own (assignee or creator)
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE
USING (
  auth.uid() = assignee_id
  OR auth.uid() = created_by
)
WITH CHECK (
  auth.uid() = assignee_id
  OR auth.uid() = created_by
);

COMMENT ON POLICY tasks_update_policy ON tasks IS 'Task owners (assignee or creator) can update tasks';

-- Policy 4: DELETE - Users can soft-delete tasks they own
-- Note: This is actually an UPDATE since we use soft deletes (is_deleted = true)
CREATE POLICY tasks_delete_policy ON tasks
FOR UPDATE
USING (
  (auth.uid() = assignee_id OR auth.uid() = created_by)
  AND is_deleted = false
)
WITH CHECK (
  is_deleted = true
);

COMMENT ON POLICY tasks_delete_policy ON tasks IS 'Task owners can soft-delete tasks (set is_deleted = true)';

-- ============================================================================
-- TASK_CONTRIBUTORS TABLE RLS POLICIES
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE task_contributors ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view contributors on tasks they have access to
CREATE POLICY contributors_select_policy ON task_contributors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (
        auth.uid() = tasks.assignee_id
        OR auth.uid() = tasks.created_by
        OR auth.uid() = task_contributors.user_id
      )
  )
);

COMMENT ON POLICY contributors_select_policy ON task_contributors IS 'Users can view contributors on tasks they have access to';

-- Policy 2: INSERT - Task owners can add contributors
CREATE POLICY contributors_insert_policy ON task_contributors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
);

COMMENT ON POLICY contributors_insert_policy ON task_contributors IS 'Task owners (assignee or creator) can add contributors';

-- Policy 3: UPDATE - Task owners can remove contributors (set removed_at)
CREATE POLICY contributors_update_policy ON task_contributors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
);

COMMENT ON POLICY contributors_update_policy ON task_contributors IS 'Task owners can remove contributors (soft delete via removed_at)';

-- ============================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON task_contributors TO authenticated;

-- Grant sequence permissions (for auto-increment IDs if needed)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
