-- Migration: Add waiting queue performance indexes
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Optimize query performance for waiting queue filtering and sorting

-- Composite index for filtered waiting queue queries
-- Supports: WHERE status IN ('pending', 'assigned') ORDER BY assigned_at DESC
CREATE INDEX IF NOT EXISTS idx_assignments_queue_filters
ON assignments(status, workflow_stage, assigned_at DESC)
WHERE status IN ('pending', 'assigned');

-- Index for aging calculations (days waiting)
-- Supports: WHERE assigned_at < NOW() - INTERVAL 'X days'
CREATE INDEX IF NOT EXISTS idx_assignments_aging
ON assignments((EXTRACT(EPOCH FROM (NOW() - assigned_at)) / 86400))
WHERE status = 'pending';

-- Index for assignee-based filtering
-- Supports: WHERE assignee_id = $1 AND status IN ('pending', 'assigned')
CREATE INDEX IF NOT EXISTS idx_assignments_assignee
ON assignments(assignee_id)
WHERE status IN ('pending', 'assigned');

-- Index for priority-based sorting
-- Supports: ORDER BY priority, assigned_at
CREATE INDEX IF NOT EXISTS idx_assignments_priority
ON assignments(priority, assigned_at DESC)
WHERE status IN ('pending', 'assigned');

-- Index for work_item_type filtering
-- Supports: WHERE work_item_type = $1 AND status IN ('pending', 'assigned')
CREATE INDEX IF NOT EXISTS idx_assignments_work_item_type
ON assignments(work_item_type, status)
WHERE status IN ('pending', 'assigned');

-- Add comments for index documentation
COMMENT ON INDEX idx_assignments_queue_filters IS 'Optimizes waiting queue queries with status/workflow_stage filters and assigned_at sorting';
COMMENT ON INDEX idx_assignments_aging IS 'Optimizes aging bucket calculations (0-2 days, 3-6 days, 7+ days)';
COMMENT ON INDEX idx_assignments_assignee IS 'Optimizes assignee-based filtering in waiting queue';
COMMENT ON INDEX idx_assignments_priority IS 'Optimizes priority-based sorting in waiting queue';
COMMENT ON INDEX idx_assignments_work_item_type IS 'Optimizes work item type filtering (dossier, ticket, position, task)';
