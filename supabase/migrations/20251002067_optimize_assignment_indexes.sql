-- T067: Optimize Assignment Indexes
-- Add composite and covering indexes for high-performance queries
-- Partial indexes for filtered queries (active assignments only)

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Composite index for "my assignments" query (assignee + status + SLA sorting)
CREATE INDEX IF NOT EXISTS idx_assignments_assignee_status_sla
ON assignments(assignee_id, status, sla_deadline)
WHERE status IN ('assigned', 'in_progress');

COMMENT ON INDEX idx_assignments_assignee_status_sla IS
'Optimizes queries for user-specific assignments filtered by status and sorted by SLA';

-- Composite index for unit-level assignment queries
CREATE INDEX IF NOT EXISTS idx_assignments_unit_status
ON assignments(
  (SELECT unit_id FROM staff_profiles WHERE user_id = assignments.assignee_id),
  status
);

COMMENT ON INDEX idx_assignments_unit_status IS
'Optimizes supervisor queries to view all assignments within their organizational unit';

-- ============================================================================
-- COVERING INDEXES (INCLUDE columns for index-only scans)
-- ============================================================================

-- Covering index for SLA monitoring queries
CREATE INDEX IF NOT EXISTS idx_assignments_sla_covering
ON assignments(status, sla_deadline)
INCLUDE (assignee_id, priority, warning_sent_at, escalated_at)
WHERE status IN ('assigned', 'in_progress');

COMMENT ON INDEX idx_assignments_sla_covering IS
'Index-only scan for SLA monitoring - includes all columns needed without table lookup';

-- Covering index for assignment count aggregation
CREATE INDEX IF NOT EXISTS idx_assignments_assignee_active_covering
ON assignments(assignee_id, status)
INCLUDE (work_item_type, priority)
WHERE status IN ('assigned', 'in_progress');

COMMENT ON INDEX idx_assignments_assignee_active_covering IS
'Fast counting of active assignments per staff member';

-- ============================================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================================================

-- Partial index for active assignments approaching SLA deadline
CREATE INDEX IF NOT EXISTS idx_assignments_sla_warning
ON assignments(sla_deadline)
WHERE status IN ('assigned', 'in_progress')
  AND warning_sent_at IS NULL;

COMMENT ON INDEX idx_assignments_sla_warning IS
'Optimizes pg_cron SLA monitoring for assignments needing warnings (75% threshold)';

-- Partial index for breached SLAs needing escalation
CREATE INDEX IF NOT EXISTS idx_assignments_sla_breach
ON assignments(sla_deadline)
WHERE status IN ('assigned', 'in_progress')
  AND escalated_at IS NULL
  AND sla_deadline < NOW();

COMMENT ON INDEX idx_assignments_sla_breach IS
'Optimizes pg_cron SLA monitoring for assignments needing escalation (100% breach)';

-- Partial index for active urgent assignments (high-priority queries)
CREATE INDEX IF NOT EXISTS idx_assignments_urgent_active
ON assignments(assignee_id, sla_deadline)
WHERE status IN ('assigned', 'in_progress')
  AND priority = 'urgent';

COMMENT ON INDEX idx_assignments_urgent_active IS
'Fast queries for urgent assignments requiring immediate attention';

-- ============================================================================
-- INDEXES FOR ASSIGNMENT QUEUE OPTIMIZATION
-- ============================================================================

-- B-tree index for priority-based queue ordering
CREATE INDEX IF NOT EXISTS idx_queue_priority_created_btree
ON assignment_queue(priority DESC, created_at ASC);

COMMENT ON INDEX idx_queue_priority_created_btree IS
'Ensures FIFO processing within priority levels (already exists from T008, but ensuring existence)';

-- GIN index for skill-based queue filtering (multi-value array matching)
CREATE INDEX IF NOT EXISTS idx_queue_required_skills_gin
ON assignment_queue USING GIN(required_skills);

COMMENT ON INDEX idx_queue_required_skills_gin IS
'Fast skill-based filtering for queue processing (overlaps with freed skills)';

-- Partial index for stale queue items (fallback processor target)
CREATE INDEX IF NOT EXISTS idx_queue_stale_items
ON assignment_queue(last_attempt_at, attempts)
WHERE attempts >= 5;

COMMENT ON INDEX idx_queue_stale_items IS
'Identifies queue items that have failed multiple assignment attempts';

-- ============================================================================
-- INDEXES FOR ESCALATION EVENT QUERIES
-- ============================================================================

-- Composite index for escalation recipient dashboard
CREATE INDEX IF NOT EXISTS idx_escalation_recipient_unresolved
ON escalation_events(escalated_to_id, resolved_at)
WHERE resolved_at IS NULL;

COMMENT ON INDEX idx_escalation_recipient_unresolved IS
'Fast queries for unresolved escalations assigned to a specific recipient';

-- Composite index for time-series escalation reports
CREATE INDEX IF NOT EXISTS idx_escalation_date_reason
ON escalation_events(escalated_at DESC, reason);

COMMENT ON INDEX idx_escalation_date_reason IS
'Optimizes escalation reporting queries grouped by date and reason';

-- ============================================================================
-- STATISTICS UPDATE (for query planner accuracy)
-- ============================================================================

-- Increase statistics target for frequently filtered columns
ALTER TABLE assignments ALTER COLUMN priority SET STATISTICS 1000;
ALTER TABLE assignments ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE assignments ALTER COLUMN sla_deadline SET STATISTICS 1000;

ALTER TABLE assignment_queue ALTER COLUMN priority SET STATISTICS 1000;
ALTER TABLE assignment_queue ALTER COLUMN required_skills SET STATISTICS 1000;

COMMENT ON COLUMN assignments.priority IS
'Statistics target increased to 1000 for accurate query planning on filtered queries';

-- ============================================================================
-- ANALYZE TABLES (refresh statistics after index creation)
-- ============================================================================

ANALYZE assignments;
ANALYZE assignment_queue;
ANALYZE escalation_events;
ANALYZE staff_profiles;

-- ============================================================================
-- PERFORMANCE VALIDATION QUERIES
-- ============================================================================

-- Use EXPLAIN ANALYZE to validate index usage
-- Example: EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM assignments WHERE assignee_id = '...' AND status = 'assigned';
-- Expected: "Index Scan using idx_assignments_assignee_status_sla"
