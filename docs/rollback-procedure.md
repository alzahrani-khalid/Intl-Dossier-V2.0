# Rollback Procedure: Unified Tasks Model

**Feature**: Unified Tasks Model (spec 025)
**Date**: 2025-10-19
**Rollback Window**: 30 days from migration
**Severity**: Critical - Production Rollback

## When to Rollback

Execute this rollback procedure if any of the following critical issues occur:

### Critical Issues (Immediate Rollback)
- ❌ Data loss detected (tasks missing, contributors lost)
- ❌ Complete system unavailability (> 15 minutes downtime)
- ❌ Security breach or data exposure
- ❌ RLS policies allow unauthorized access
- ❌ Database corruption detected

### Severe Issues (Consider Rollback)
- ⚠️ > 50% of users unable to access tasks
- ⚠️ > 20% error rate in task operations
- ⚠️ Task list load times > 10s consistently
- ⚠️ Optimistic locking causing data conflicts
- ⚠️ Kanban board completely non-functional

### Monitor Issues (Fix Forward, Don't Rollback)
- ℹ️ Individual users report UI quirks
- ℹ️ Performance slightly slower than baseline
- ℹ️ Minor translation issues
- ℹ️ Cosmetic RTL layout issues

---

## Pre-Rollback Checklist

### 1. Incident Assessment
- [ ] Document the issue (screenshots, error logs, affected users)
- [ ] Verify issue is not transient (wait 5 minutes, check if resolved)
- [ ] Check Supabase dashboard for database health
- [ ] Review Edge Function logs for errors
- [ ] Confirm issue affects multiple users, not single user

### 2. Decision Authorization
- [ ] Notify on-call engineer
- [ ] Get approval from technical lead
- [ ] For critical issues: Get emergency rollback auth from director
- [ ] Post incident notification to users

### 3. Backup Current State (BEFORE Rollback)
```bash
# Create snapshot of current (broken) state for forensics
supabase db backup create --project-ref zkrcjzdemdmwhearhfgg --description "Pre-rollback-snapshot"

# Export recent task data for analysis
supabase db query "
COPY (
  SELECT *
  FROM tasks
  WHERE created_at > NOW() - INTERVAL '7 days'
) TO '/tmp/tasks_pre_rollback.csv' CSV HEADER;

COPY (
  SELECT *
  FROM task_contributors
  WHERE added_at > NOW() - INTERVAL '7 days'
) TO '/tmp/contributors_pre_rollback.csv' CSV HEADER;
" --project-ref zkrcjzdemdmwhearhfgg
```

---

## Rollback Execution

**Estimated Time**: 10-15 minutes
**Downtime**: 5-10 minutes

### Phase 1: Revert Frontend (2 minutes)

#### Step 1: Identify Previous Stable Version
```bash
# Find commit before unified tasks model merge
git log --oneline --graph --all | grep "025-unified-tasks-model" -B 5

# Example output:
# abc123d feat: implement user story 5 (SLA tracking)
# def456e feat: complete unified tasks model MVP
# ghi789f Merge branch '024-intake-entity-linking' ← ROLLBACK TO THIS

export ROLLBACK_COMMIT="ghi789f"
```

#### Step 2: Checkout Previous Frontend Version
```bash
cd frontend

# Checkout previous stable commit
git checkout $ROLLBACK_COMMIT -- .

# Verify correct version
git diff HEAD

# Build production bundle
pnpm build
```

#### Step 3: Deploy Reverted Frontend
```bash
# Deploy to production hosting
vercel --prod

# OR your hosting platform
# netlify deploy --prod
# aws s3 sync dist/ s3://your-bucket/
```

#### Step 4: Verify Frontend Rollback
```bash
# Test production URL
open https://your-production-domain.com

# Manual checks:
# ✓ Login works
# ✓ Old assignments UI loads
# ✓ No task-related errors in console
```

---

### Phase 2: Revert Edge Functions (2 minutes)

#### Step 1: Checkout Previous Edge Functions
```bash
cd supabase/functions

# Checkout old function implementations
git checkout $ROLLBACK_COMMIT -- .

# Verify correct versions
git status
```

#### Step 2: Deploy Old Edge Functions
```bash
# Deploy assignments-related functions (old API)
supabase functions deploy assignments-get --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy assignments-create --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy assignments-update --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy assignments-my-assignments --project-ref zkrcjzdemdmwhearhfgg

# Verify deployments
supabase functions list --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 3: Test Old Edge Functions
```bash
export SUPABASE_TOKEN="your-jwt-token"

# Test old assignments-get endpoint
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-get" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"

# Expected: 200 OK with assignments list
```

---

### Phase 3: Revert Database Schema (5 minutes)

**⚠️ CRITICAL: This is the most dangerous step. Double-check everything.**

#### Step 1: Verify Rollback Backup Exists
```bash
# List recent backups
supabase db backup list --project-ref zkrcjzdemdmwhearhfgg

# Verify pre-rollback snapshot created
# Expected: "Pre-rollback-snapshot" backup in list
```

#### Step 2: Drop New Tables
```bash
# WARNING: This will delete tasks and task_contributors tables
# Data is preserved in assignments_deprecated table

supabase db query "
BEGIN;

-- Record row counts before drop
DO $$
DECLARE
  tasks_count INT;
  assignments_deprecated_count INT;
BEGIN
  SELECT COUNT(*) INTO tasks_count FROM tasks;
  SELECT COUNT(*) INTO assignments_deprecated_count FROM assignments_deprecated;

  RAISE NOTICE 'Tasks count: %, Assignments_deprecated count: %', tasks_count, assignments_deprecated_count;

  IF tasks_count != assignments_deprecated_count THEN
    RAISE EXCEPTION 'Row count mismatch! Tasks: %, Assignments_deprecated: %', tasks_count, assignments_deprecated_count;
  END IF;
END $$;

-- Drop new tables
DROP TABLE IF EXISTS task_contributors CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Verify drops succeeded
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name IN ('tasks', 'task_contributors');
-- Expected: 0

COMMIT;
" --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 3: Restore Old Assignments Table
```bash
supabase db query "
BEGIN;

-- Rename deprecated table back to assignments
ALTER TABLE assignments_deprecated RENAME TO assignments;

-- Verify rename succeeded
SELECT COUNT(*) FROM assignments;
-- Expected: Same count as tasks before drop

COMMIT;
" --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 4: Restore Old RLS Policies
```bash
# Fetch old RLS policies from backup commit
git show $ROLLBACK_COMMIT:supabase/migrations/<old-rls-migration>.sql > /tmp/old_rls.sql

# Apply old RLS policies
supabase db query --file /tmp/old_rls.sql --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 5: Restore Old Indexes
```bash
# Fetch old indexes from backup commit
git show $ROLLBACK_COMMIT:supabase/migrations/<old-indexes-migration>.sql > /tmp/old_indexes.sql

# Apply old indexes
supabase db query --file /tmp/old_indexes.sql --project-ref zkrcjzdemdmwhearhfgg
```

---

### Phase 4: Verification (5 minutes)

#### Step 1: Database Integrity Checks
```bash
# Verify assignments table restored
supabase db query "
SELECT
  COUNT(*) as total_assignments,
  COUNT(DISTINCT assignee_id) as unique_assignees,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_assignments
FROM assignments;
" --project-ref zkrcjzdemdmwhearhfgg

# Verify no orphaned records
supabase db query "
SELECT COUNT(*) as orphaned_assignments
FROM assignments
WHERE assignee_id NOT IN (SELECT id FROM auth.users);
" --project-ref zkrcjzdemdmwhearhfgg
# Expected: 0

# Verify RLS policies active
supabase db query "
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'assignments'
ORDER BY policyname;
" --project-ref zkrcjzdemdmwhearhfgg
```

#### Step 2: End-to-End Smoke Tests
```bash
# Test production endpoints
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-get" \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
# Expected: 200 OK with assignments list

curl -X POST "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-create" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assignee_id":"<user-id>","status":"pending","priority":"medium","work_item_type":"dossier","work_item_id":"<dossier-id>"}'
# Expected: 201 Created with assignment object
```

#### Step 3: User Acceptance Testing
- [ ] Login as test user
- [ ] Navigate to "My Assignments" page
- [ ] Verify assignments list loads
- [ ] Create new assignment
- [ ] Update assignment status
- [ ] Verify kanban board displays correctly (if old kanban exists)
- [ ] No console errors

---

## Post-Rollback Actions

### Immediate Actions (Within 1 Hour)

#### 1. User Communication
```
Subject: System Restored - Unified Tasks Rollback Complete

Dear Users,

We have successfully rolled back the recent unified tasks model update due to [brief description of issue].

Current Status:
✓ System is fully operational
✓ All your assignments and data are intact
✓ Previous functionality restored

We apologize for any inconvenience this may have caused.

- The Engineering Team
```

#### 2. Incident Documentation
Create incident report with:
- [ ] Timeline of events
- [ ] Root cause analysis
- [ ] Data impact assessment
- [ ] User impact metrics
- [ ] Actions taken
- [ ] Lessons learned

#### 3. Monitoring
```bash
# Monitor key metrics for next 24 hours
# - Assignment list load times
# - Error rates
# - Database query performance
# - User login success rate

# Check slow queries
supabase db query "
SELECT * FROM pg_stat_statements
WHERE query LIKE '%assignments%'
ORDER BY mean_exec_time DESC
LIMIT 10;
" --project-ref zkrcjzdemdmwhearhfgg
```

### Short-Term Actions (Within 1 Week)

#### 1. Post-Mortem Meeting
- [ ] Schedule meeting with all stakeholders
- [ ] Review incident timeline
- [ ] Identify root cause
- [ ] Document preventive measures
- [ ] Update runbooks

#### 2. Code Analysis
```bash
# Analyze what went wrong
git diff $ROLLBACK_COMMIT..HEAD

# Review problematic code
# - Migration scripts
# - RLS policies
# - Edge Functions
# - Frontend integration
```

#### 3. Fix Planning
- [ ] Create bug tickets for identified issues
- [ ] Update unified tasks model implementation
- [ ] Enhance testing (unit, integration, E2E)
- [ ] Plan incremental rollout strategy

### Long-Term Actions (Within 1 Month)

#### 1. Improved Testing
- [ ] Add migration rollback tests
- [ ] Enhance RLS policy tests
- [ ] Add performance benchmarks
- [ ] Create staging environment

#### 2. Gradual Re-Deployment Strategy
```
Phase 1: Fix all identified issues
Phase 2: Deploy to staging, test for 1 week
Phase 3: Canary deployment (5% of users)
Phase 4: Gradual rollout (25% → 50% → 100%)
Phase 5: Monitor for 1 week before cleanup
```

#### 3. Cleanup Old Schema (After 30 Days)
```bash
# Only after confirming new deployment is stable
# Remove assignments_deprecated table
supabase db query "
DROP TABLE IF EXISTS assignments_deprecated CASCADE;
" --project-ref zkrcjzdemdmwhearhfgg
```

---

## Data Recovery Options

### If Rollback Causes Data Loss

#### Option 1: Restore from Pre-Rollback Snapshot
```bash
# Restore from pre-rollback snapshot
supabase db backup restore <pre-rollback-snapshot-id> --project-ref zkrcjzdemdmwhearhfgg
```

#### Option 2: Merge Data from CSV Exports
```bash
# Re-import tasks data if needed
psql $DATABASE_URL -c "\COPY tasks FROM '/tmp/tasks_pre_rollback.csv' CSV HEADER"

# Re-import contributors data if needed
psql $DATABASE_URL -c "\COPY task_contributors FROM '/tmp/contributors_pre_rollback.csv' CSV HEADER"
```

#### Option 3: Manual Data Recovery
```bash
# Identify missing data
supabase db query "
SELECT *
FROM assignments
WHERE id NOT IN (SELECT id FROM tasks);
" --project-ref zkrcjzdemdmwhearhfgg

# Manually re-create missing records
```

---

## Emergency Contacts

**On-Call Engineer**: [Name] - [Phone] - [Email]
**Technical Lead**: [Name] - [Phone] - [Email]
**Database Admin**: [Name] - [Phone] - [Email]
**Emergency Rollback Auth**: [Director Name] - [Phone] - [Email]
**Supabase Support**: support@supabase.com

---

## Rollback History Log

| Date | Time | Issue | Rollback By | Success | Notes |
|------|------|-------|-------------|---------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

---

**Rollback Executed By**: _________________
**Date/Time**: _________________
**Authorization**: _________________
**Outcome**: _________________
**Notes**: _________________
