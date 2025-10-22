# Migration Runbook: Unified Tasks Model

**Feature**: Unified Tasks Model (spec 025)
**Date**: 2025-10-19
**Author**: System
**Estimated Downtime**: < 5 minutes

## Overview

This runbook provides step-by-step instructions for migrating from the legacy 3-layer architecture (Assignments → Tasks → Work Items) to the unified 2-layer model (Tasks → Work Items) in production.

---

## Pre-Migration Checklist

### 1. Backup Verification
```bash
# Verify recent backup exists
supabase db backup list --project-ref zkrcjzdemdmwhearhfgg

# Create fresh backup before migration
supabase db backup create --project-ref zkrcjzdemdmwhearhfgg
```

### 2. System Health Check
```bash
# Check database connection
supabase db query "SELECT 1" --project-ref zkrcjzdemdmwhearhfgg

# Verify current row counts
supabase db query "SELECT
  (SELECT COUNT(*) FROM assignments) as assignments_count,
  (SELECT COUNT(*) FROM tasks WHERE assignment_id IS NOT NULL) as old_tasks_count" \
  --project-ref zkrcjzdemdmwhearhfgg
```

### 3. Code Deployment Preparation
```bash
# Ensure all code is committed
git status

# Verify on correct branch
git branch --show-current  # Should be: 025-unified-tasks-model

# Pull latest changes
git pull origin 025-unified-tasks-model

# Run all tests locally
pnpm test
pnpm test:e2e
```

### 4. Communication
- [ ] Notify users of upcoming 5-minute maintenance window
- [ ] Post maintenance banner on application
- [ ] Prepare rollback communication template

---

## Migration Steps

### Phase 1: Database Schema Migration (2 minutes)

#### Step 1: Link to Production Project
```bash
supabase link --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 2: Review Pending Migrations
```bash
# List migrations that will be applied
supabase db diff

# Expected migrations:
# - 20251019183000_transform_tasks_to_unified_model.sql
# - 20251019182400_create_task_contributors.sql
# - 20251019182500_migrate_assignments_to_tasks.sql
# - 20251019182600_add_tasks_indexes.sql
# - 20251019182700_add_tasks_rls_policies.sql
```

#### Step 3: Apply Migrations
```bash
# Apply all pending migrations
supabase db push --project-ref zkrcjzdemdmwhearhfgg

# Expected output:
# ✓ Migration 20251019183000_transform_tasks_to_unified_model.sql applied
# ✓ Migration 20251019182400_create_task_contributors.sql applied
# ✓ Migration 20251019182500_migrate_assignments_to_tasks.sql applied
# ✓ Migration 20251019182600_add_tasks_indexes.sql applied
# ✓ Migration 20251019182700_add_tasks_rls_policies.sql applied
```

#### Step 4: Verify Migration Success
```bash
# Check row counts match
supabase db query "
SELECT
  (SELECT COUNT(*) FROM assignments_deprecated) as old_assignments,
  (SELECT COUNT(*) FROM tasks) as new_tasks,
  (SELECT COUNT(*) FROM tasks WHERE assignee_id IS NULL) as orphaned_tasks
" --project-ref zkrcjzdemdmwhearhfgg

# Expected: old_assignments == new_tasks, orphaned_tasks == 0

# Sample data comparison
supabase db query "
SELECT
  a.id,
  a.assignee_id as old_assignee,
  t.assignee_id as new_assignee,
  a.status as old_status,
  t.status as new_status,
  t.title as new_title
FROM assignments_deprecated a
INNER JOIN tasks t ON a.id = t.id
LIMIT 5
" --project-ref zkrcjzdemdmwhearhfgg

# Verify indexes created
supabase db query "
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('tasks', 'task_contributors')
ORDER BY tablename, indexname
" --project-ref zkrcjzdemdmwhearhfgg

# Verify RLS policies active
supabase db query "
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('tasks', 'task_contributors')
ORDER BY tablename, policyname
" --project-ref zkrcjzdemdmwhearhfgg
```

---

### Phase 2: Backend Service Deployment (1 minute)

#### Step 1: Deploy Edge Functions
```bash
cd supabase/functions

# Deploy all task-related functions
supabase functions deploy tasks-get --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy tasks-create --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy tasks-update --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy contributors-add --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy contributors-remove --project-ref zkrcjzdemdmwhearhfgg

# Verify deployments
supabase functions list --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 2: Test Edge Functions
```bash
# Get auth token (from Supabase dashboard or login)
export SUPABASE_TOKEN="your-jwt-token"

# Test tasks-get endpoint
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/tasks-get?filter=assigned" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"

# Expected: 200 OK with tasks list

# Test tasks-create endpoint
curl -X POST "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/tasks-create" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Migration Task","assignee_id":"<user-id>","status":"pending","workflow_stage":"todo","priority":"medium"}'

# Expected: 201 Created with task object
```

---

### Phase 3: Frontend Deployment (2 minutes)

#### Step 1: Build Production Bundle
```bash
cd frontend

# Build optimized production bundle
pnpm build

# Verify build output
ls -lh dist/
```

#### Step 2: Deploy to Hosting Platform
```bash
# Example: Vercel deployment
vercel --prod

# OR your hosting platform
# (Netlify, Cloudflare Pages, AWS S3 + CloudFront, etc.)
```

#### Step 3: Smoke Test Production
```bash
# Test production endpoints
open https://your-production-domain.com/tasks

# Manual verification checklist:
# ✓ Login works
# ✓ Tasks list loads with titles (not IDs)
# ✓ Task detail page shows title
# ✓ Task creation works
# ✓ Contributors can be added
# ✓ Kanban board displays correctly
# ✓ Drag-and-drop updates workflow stage
# ✓ SLA indicators show correctly
```

---

## Post-Migration Verification

### 1. Data Integrity Checks
```bash
# Check for data anomalies
supabase db query "
-- Tasks with missing assignees
SELECT COUNT(*) as missing_assignees
FROM tasks
WHERE assignee_id IS NULL;

-- Tasks with invalid status
SELECT COUNT(*) as invalid_status
FROM tasks
WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed', 'cancelled');

-- Tasks with invalid workflow_stage
SELECT COUNT(*) as invalid_workflow_stage
FROM tasks
WHERE workflow_stage NOT IN ('todo', 'in_progress', 'review', 'done', 'cancelled');

-- Orphaned contributors (task doesn't exist)
SELECT COUNT(*) as orphaned_contributors
FROM task_contributors tc
LEFT JOIN tasks t ON tc.task_id = t.id
WHERE t.id IS NULL;
" --project-ref zkrcjzdemdmwhearhfgg

# All counts should be 0
```

### 2. Performance Checks
```bash
# Test task list query performance
supabase db query "
EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE assignee_id = '<test-user-id>'
  AND is_deleted = false
ORDER BY created_at DESC
LIMIT 50;
" --project-ref zkrcjzdemdmwhearhfgg

# Expected: Query execution time < 100ms, uses idx_tasks_assignee_active

# Test kanban board query performance
supabase db query "
EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE engagement_id = '<test-engagement-id>'
  AND is_deleted = false
ORDER BY workflow_stage, created_at DESC;
" --project-ref zkrcjzdemdmwhearhfgg

# Expected: Query execution time < 200ms, uses idx_tasks_engagement_stage
```

### 3. User Acceptance Testing
- [ ] Login as test user
- [ ] Create new task with descriptive title
- [ ] Verify task appears in "My Tasks" with title (not ID)
- [ ] Add contributor to task
- [ ] Verify contributor sees task in "Tasks I Contributed To"
- [ ] Open engagement kanban board
- [ ] Drag task from "todo" to "in_progress"
- [ ] Verify task updates immediately
- [ ] Open task in two browser tabs
- [ ] Edit in both tabs
- [ ] Verify conflict dialog appears
- [ ] Complete task with breached SLA
- [ ] Verify SLA indicator shows "Breached"

---

## Rollback Procedure

**Use within 30-day window if critical issues arise**

### Step 1: Revert Frontend Deployment
```bash
# Revert to previous frontend version
git checkout <previous-commit>
cd frontend
pnpm build
vercel --prod
```

### Step 2: Revert Edge Functions
```bash
# Checkout previous Edge Functions
git checkout <previous-commit> supabase/functions

# Redeploy old functions
cd supabase/functions
supabase functions deploy assignments-get --project-ref zkrcjzdemdmwhearhfgg
# ... deploy other old functions
```

### Step 3: Revert Database Schema
```bash
# WARNING: This will drop new tables and restore old schema
supabase db query "
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS task_contributors CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Restore old assignments table
ALTER TABLE assignments_deprecated RENAME TO assignments;

-- Restore old RLS policies (from backup)
-- ... (policies from pre-migration backup)

COMMIT;
" --project-ref zkrcjzdemdmwhearhfgg
```

### Step 4: Verify Rollback
```bash
# Check old table restored
supabase db query "
SELECT COUNT(*) FROM assignments;
" --project-ref zkrcjzdemdmwhearhfgg

# Test old endpoints
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-get" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

### Step 5: Communicate Rollback
- [ ] Notify users that system has been restored
- [ ] Post incident report explaining issues
- [ ] Schedule post-mortem meeting

---

## Monitoring & Observability

### Key Metrics to Monitor (First 24 Hours)

1. **Task List Performance**
   - Target: < 2s page load
   - Alert threshold: > 3s

2. **Kanban Board Rendering**
   - Target: < 3s for 100 tasks
   - Alert threshold: > 5s

3. **Auto-Retry Success Rate**
   - Target: 99% success rate
   - Alert threshold: < 95%

4. **Database Query Performance**
   - Target: Task queries < 100ms
   - Alert threshold: > 500ms

5. **Error Rates**
   - Target: < 1% error rate
   - Alert threshold: > 5%

### Monitoring Tools
```bash
# Supabase dashboard
open https://app.supabase.com/project/zkrcjzdemdmwhearhfgg

# Check slow queries
supabase db query "
SELECT * FROM pg_stat_statements
WHERE query LIKE '%tasks%'
ORDER BY mean_exec_time DESC
LIMIT 10;
" --project-ref zkrcjzdemdmwhearhfgg

# Check index usage
supabase db query "
SELECT
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('tasks', 'task_contributors')
ORDER BY idx_scan DESC;
" --project-ref zkrcjzdemdmwhearhfgg
```

---

## Troubleshooting Common Issues

### Issue 1: Tasks Not Appearing in List
**Symptoms**: Users report empty task lists despite having tasks

**Root Cause**: RLS policies may be blocking legitimate queries

**Resolution**:
```bash
# Check RLS policy for SELECT
supabase db query "
SELECT * FROM pg_policies
WHERE tablename = 'tasks'
AND cmd = 'SELECT';
" --project-ref zkrcjzdemdmwhearhfgg

# Test query as specific user
supabase db query "
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{\"sub\": \"<user-id>\"}';
SELECT * FROM tasks WHERE assignee_id = '<user-id>';
" --project-ref zkrcjzdemdmwhearhfgg
```

### Issue 2: Contributor Access Denied
**Symptoms**: Contributors cannot view tasks they were added to

**Root Cause**: RLS policy may not properly check task_contributors table

**Resolution**:
```bash
# Verify contributor record exists
supabase db query "
SELECT * FROM task_contributors
WHERE user_id = '<contributor-id>'
AND task_id = '<task-id>'
AND removed_at IS NULL;
" --project-ref zkrcjzdemdmwhearhfgg

# Check RLS policy includes contributor check
supabase db query "
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'tasks'
AND policyname LIKE '%select%';
" --project-ref zkrcjzdemdmwhearhfgg
```

### Issue 3: Optimistic Locking Conflicts on Every Save
**Symptoms**: Users always see conflict dialog even when editing alone

**Root Cause**: Frontend not sending correct `updated_at` timestamp

**Resolution**:
- Check browser console for errors
- Verify TanStack Query is sending `updated_at` in mutation payload
- Verify backend is comparing timestamps correctly

```typescript
// Frontend fix
const task = useQuery(['task', taskId]);
await updateTask({
  ...changes,
  updated_at: task.data.updated_at // Must match server timestamp
});
```

### Issue 4: Kanban Drag-and-Drop Fails Silently
**Symptoms**: Tasks don't update when dragged to new column

**Root Cause**: Network errors or optimistic locking conflicts

**Resolution**:
- Check browser console for network errors
- Verify Edge Function `tasks-update` is deployed
- Check for optimistic locking conflicts

```bash
# Test update endpoint directly
curl -X PATCH "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/tasks-update" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"<task-id>","workflow_stage":"in_progress","updated_at":"<current-timestamp>"}'
```

---

## Contact Information

**On-Call Engineer**: [Name]
**Escalation**: [Manager Name]
**Emergency Rollback Auth**: [Director Name]

---

## Post-Migration Review

**Schedule**: 1 week after migration

**Agenda**:
- [ ] Review migration success metrics
- [ ] Analyze any incidents or rollbacks
- [ ] Document lessons learned
- [ ] Update runbook with improvements
- [ ] Schedule assignments_deprecated table cleanup (after 30 days)

---

**Migration Completed By**: _________________
**Date/Time**: _________________
**Notes**: _________________
