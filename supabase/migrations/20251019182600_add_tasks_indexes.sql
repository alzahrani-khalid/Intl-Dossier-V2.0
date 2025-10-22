-- Migration: Create performance indexes for tasks table
-- Composite partial indexes for variable load optimization (10-1000+ tasks)
-- Part of: 025-unified-tasks-model implementation

-- Index 1: My active tasks (most common query pattern)
-- Supports: WHERE assignee_id = ? AND status != 'completed' AND is_deleted = false
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_active
ON tasks(assignee_id, status, created_at DESC)
WHERE is_deleted = false;

COMMENT ON INDEX idx_tasks_assignee_active IS 'Optimizes "My Tasks" queries for variable loads (10-1000+ tasks per user)';

-- Index 2: Kanban board queries
-- Supports: WHERE engagement_id = ? AND is_deleted = false ORDER BY workflow_stage
CREATE INDEX IF NOT EXISTS idx_tasks_engagement_stage
ON tasks(engagement_id, workflow_stage, created_at DESC)
WHERE is_deleted = false;

COMMENT ON INDEX idx_tasks_engagement_stage IS 'Optimizes engagement kanban board rendering (<3s for 100 tasks)';

-- Index 3: SLA monitoring and warnings
-- Supports: WHERE sla_deadline < now() + interval '4 hours' AND status NOT IN ('completed', 'cancelled')
CREATE INDEX IF NOT EXISTS idx_tasks_sla_warning
ON tasks(sla_deadline, assignee_id)
WHERE is_deleted = false AND status NOT IN ('completed', 'cancelled');

COMMENT ON INDEX idx_tasks_sla_warning IS 'Optimizes SLA breach detection and warning queries';

-- Index 4: Work item reverse lookup
-- Supports: WHERE work_item_type = ? AND work_item_id = ? AND is_deleted = false
CREATE INDEX IF NOT EXISTS idx_tasks_work_item_lookup
ON tasks(work_item_type, work_item_id)
WHERE is_deleted = false;

COMMENT ON INDEX idx_tasks_work_item_lookup IS 'Optimizes reverse lookup: Find all tasks for specific dossier/position/ticket';

-- Index 5: General created_at for sorting
-- Supports: ORDER BY created_at DESC for recent tasks
CREATE INDEX IF NOT EXISTS idx_tasks_created_at
ON tasks(created_at DESC);

COMMENT ON INDEX idx_tasks_created_at IS 'Optimizes general chronological sorting of tasks';

-- Optional: Full-text search index (if title/description search needed)
-- Uncomment if search functionality is required
/*
CREATE INDEX IF NOT EXISTS idx_tasks_search
ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')))
WHERE is_deleted = false;

COMMENT ON INDEX idx_tasks_search IS 'Full-text search on task titles and descriptions';
*/

-- Analyze tables for query planner statistics
ANALYZE tasks;
ANALYZE task_contributors;
