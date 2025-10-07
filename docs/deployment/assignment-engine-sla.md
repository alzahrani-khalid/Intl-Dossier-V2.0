# Assignment Engine & SLA Deployment Guide

**Feature**: Assignment Engine & SLA
**Version**: 1.0.0
**Last Updated**: 2025-10-02

## Overview

This guide walks through deploying the Assignment Engine & SLA feature to a Supabase project. The deployment includes database migrations, Edge Functions, pg_cron jobs, and Supabase Realtime configuration.

**Estimated Deployment Time**: 30-45 minutes
**Downtime Required**: None (migrations are backward compatible)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Migrations](#database-migrations)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [pg_cron Jobs Setup](#pgcron-jobs-setup)
6. [Supabase Realtime Configuration](#supabase-realtime-configuration)
7. [Performance Tuning](#performance-tuning)
8. [Post-Deployment Validation](#post-deployment-validation)
9. [Rollback Procedure](#rollback-procedure)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- [Supabase CLI](https://supabase.com/docs/guides/cli) v1.100.0 or later
- [Node.js](https://nodejs.org/) v18+ LTS
- [Docker](https://www.docker.com/) (for local testing)
- Git (for version control)

### Access Requirements
- Supabase project admin access
- Database connection credentials (service role key)
- GitHub/GitLab repository access (for CI/CD)

### Environment Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd /path/to/project
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Backup production database: `supabase db dump -f backup-$(date +%Y%m%d).sql`
- [ ] Test migrations on staging environment
- [ ] Review migration order (T001-T023 are sequential)
- [ ] Verify Supabase project plan supports pg_cron (Pro plan or higher)
- [ ] Confirm edge function limits (10 functions on Pro, 500 on Team/Enterprise)
- [ ] Notify stakeholders of deployment window

---

## Database Migrations

### Migration Order (CRITICAL)

Migrations **MUST** be run in this exact sequence. Each migration depends on previous ones.

#### Step 1: Helper Functions (T000)

```bash
supabase migration apply 20251002000_create_helper_functions
```

**What it does**:
- Creates `increment_version_column()` for optimistic locking
- Creates `update_updated_at_column()` for timestamp maintenance

**Rollback**: Drop functions if needed
```sql
DROP FUNCTION IF EXISTS increment_version_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

#### Step 2: Enumerations (T001)

```bash
supabase migration apply 20251002001_create_assignment_enums
```

**What it does**:
- Creates `availability_status`, `work_item_type`, `priority_level`, `assignment_status`, `escalation_reason` enums

**Rollback**:
```sql
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS work_item_type CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS escalation_reason CASCADE;
```

#### Step 3: Core Tables (T002-T010)

Run these migrations in sequence:

```bash
# Organizational units
supabase migration apply 20251002002_create_organizational_units

# Skills
supabase migration apply 20251002003_create_skills

# Staff profiles (depends on T002, T003)
supabase migration apply 20251002004_create_staff_profiles

# Assignment rules (depends on T002, T003, T004)
supabase migration apply 20251002005_create_assignment_rules

# SLA configs (seed data included)
supabase migration apply 20251002006_create_sla_configs

# Assignments table (depends on T004, T006)
supabase migration apply 20251002007_create_assignments

# Assignment queue
supabase migration apply 20251002008_create_assignment_queue

# Escalation events (depends on T007)
supabase migration apply 20251002009_create_escalation_events

# Capacity snapshots (depends on T002)
supabase migration apply 20251002010_create_capacity_snapshots
```

**Validation after each table**:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'staff_profiles';

-- Check foreign keys
SELECT constraint_name, table_name FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'staff_profiles';
```

#### Step 4: Database Functions & Triggers (T012-T016)

These can be applied in parallel if using multiple sessions, but sequential is safer:

```bash
supabase migration apply 20251002012_create_sla_functions
supabase migration apply 20251002013_create_assignment_count_function
supabase migration apply 20251002014_create_queue_processing_trigger
supabase migration apply 20251002015_create_sla_monitoring_function
supabase migration apply 20251002016_create_escalation_resolver
```

**Validation**:
```sql
-- Check functions exist
SELECT proname FROM pg_proc WHERE proname IN (
  'calculate_sla_deadline_fn',
  'update_staff_assignment_count',
  'process_queue_on_capacity_change',
  'sla_check_and_escalate',
  'get_escalation_recipient'
);

-- Check triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE event_object_table IN ('assignments', 'staff_profiles');
```

#### Step 5: pg_cron Jobs (T017-T019a)

```bash
supabase migration apply 20251002017_setup_sla_cron
supabase migration apply 20251002018_setup_capacity_snapshot_cron
supabase migration apply 20251002019_setup_queue_fallback_cron
supabase migration apply 20251002019a_setup_escalation_cleanup_cron
```

**Validation**:
```sql
-- Check pg_cron jobs (requires pg_cron extension enabled)
SELECT * FROM cron.job WHERE jobname IN (
  'sla-monitoring',
  'capacity-snapshot',
  'queue-fallback-processor',
  'escalation-cleanup'
);
```

**Note**: If pg_cron jobs fail, check:
1. Supabase project is on Pro plan or higher
2. Extension `pg_cron` is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

#### Step 6: RLS Policies (T020-T023)

```bash
supabase migration apply 20251002020_rls_staff_profiles
supabase migration apply 20251002021_rls_assignments
supabase migration apply 20251002022_rls_escalation_events
supabase migration apply 20251002023_rls_assignment_queue
```

**Validation**:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('staff_profiles', 'assignments', 'escalation_events', 'assignment_queue');

-- Check policies exist
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE tablename IN ('staff_profiles', 'assignments');
```

#### Step 7: Realtime & Optimization (T066-T068)

```bash
supabase migration apply 20251002066_realtime_rls_policies
supabase migration apply 20251002067_optimize_assignment_indexes
supabase migration apply 20251002068_create_eligible_staff_function
```

**Validation**:
```sql
-- Check Realtime enabled
SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'assignments' AND indexname LIKE 'idx_%';
```

### Migration Completion Checklist

After all migrations:

- [ ] All 24 migrations applied successfully
- [ ] No errors in migration logs
- [ ] Foreign keys intact: `SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';`
- [ ] Triggers active: `SELECT COUNT(*) FROM information_schema.triggers;`
- [ ] RLS enabled on all tables
- [ ] pg_cron jobs scheduled and active

---

## Edge Functions Deployment

### Function List

Deploy these 7 Edge Functions in any order (they're independent):

1. `assignments-auto-assign` (T046)
2. `assignments-manual-override` (T047)
3. `assignments-queue` (T048)
4. `assignments-my-assignments` (T049)
5. `assignments-escalate` (T050)
6. `capacity-check` (T051)
7. `staff-availability` (T052)

### Deployment Steps

#### Option 1: Deploy All Functions (Recommended)

```bash
# From project root
supabase functions deploy
```

#### Option 2: Deploy Individual Functions

```bash
# Deploy auto-assign endpoint
supabase functions deploy assignments-auto-assign

# Deploy manual override endpoint
supabase functions deploy assignments-manual-override

# Deploy queue endpoint
supabase functions deploy assignments-queue

# Deploy my-assignments endpoint
supabase functions deploy assignments-my-assignments

# Deploy escalate endpoint
supabase functions deploy assignments-escalate

# Deploy capacity check endpoint
supabase functions deploy capacity-check

# Deploy staff availability endpoint
supabase functions deploy staff-availability
```

#### Option 3: CI/CD (GitHub Actions)

Add to `.github/workflows/deploy-edge-functions.yml`:

```yaml
name: Deploy Edge Functions
on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Deploy functions
        run: |
          supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Post-Deployment Validation

Test each endpoint:

```bash
# Set environment variables
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SUPABASE_ANON_KEY="YOUR_ANON_KEY"

# Test auto-assign endpoint
curl -X POST "$SUPABASE_URL/functions/v1/assignments/auto-assign" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "work_item_id": "test-001",
    "work_item_type": "ticket",
    "required_skills": ["test-skill"],
    "priority": "normal"
  }'

# Test queue endpoint
curl "$SUPABASE_URL/functions/v1/assignments/queue" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Test capacity check
curl "$SUPABASE_URL/functions/v1/capacity/check?unit_id=YOUR_UNIT_ID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected responses:
- `200 OK` or `202 Accepted` for successful requests
- `401 Unauthorized` if token missing/invalid
- `400 Bad Request` for validation errors

---

## pg_cron Jobs Setup

### Job Schedule Verification

Check that all 4 cron jobs are running:

```sql
-- View all scheduled jobs
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job;
```

Expected jobs:

| Job Name | Schedule | Function |
|----------|----------|----------|
| `sla-monitoring` | `*/30 * * * * *` (every 30 sec) | `sla_check_and_escalate()` |
| `capacity-snapshot` | `0 0 * * *` (daily midnight) | `INSERT INTO capacity_snapshots...` |
| `queue-fallback-processor` | `0 * * * *` (every minute) | `process_stale_queue_items()` |
| `escalation-cleanup` | `0 2 * * *` (daily 02:00 UTC) | `DELETE FROM escalation_events...` |

### Manual Job Testing

Before relying on cron schedule, test jobs manually:

```sql
-- Test SLA monitoring (should complete in <5 seconds for 10k assignments)
SELECT sla_check_and_escalate();

-- Test queue processing
SELECT process_stale_queue_items();

-- Test capacity snapshot
-- (runs INSERT INTO capacity_snapshots... with ON CONFLICT DO UPDATE)
```

### Monitoring Cron Job Execution

```sql
-- Check recent job runs
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

Look for:
- **Status**: Should be "succeeded" (not "failed")
- **Return message**: Check for errors
- **Execution time**: SLA monitoring should complete in <5 seconds

### Troubleshooting pg_cron

**Issue**: Jobs not running

**Solutions**:
1. Check `pg_cron` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
2. Verify database permissions: `GRANT USAGE ON SCHEMA cron TO postgres;`
3. Check Supabase project plan (Pro or higher required)
4. Review logs: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`

**Issue**: SLA monitoring too slow (>5 seconds)

**Solutions**:
1. Check indexes: `EXPLAIN ANALYZE SELECT sla_check_and_escalate();`
2. Reduce active assignment count (archive completed assignments)
3. Optimize query: Use migration T067 indexes

---

## Supabase Realtime Configuration

### Enable Realtime for Tables

Run migration T066 if not already applied:

```bash
supabase migration apply 20251002066_realtime_rls_policies
```

### Verify Realtime Enabled

```sql
-- Check publication includes our tables
SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('assignments', 'assignment_queue', 'escalation_events');
```

Expected result: 3 rows (one for each table)

### Test Realtime Subscription (Frontend)

```javascript
// Test in browser console
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to assignment updates
const channel = supabase
  .channel('test-assignment-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'assignments',
    },
    (payload) => {
      console.log('Assignment updated:', payload);
    }
  )
  .subscribe();

// Test trigger: Update an assignment
// (should see console log)
```

### Realtime RLS Policies

Verify users can only subscribe to their own data:

```sql
-- Test RLS policy for assignments
SET request.jwt.claims TO '{"sub": "user-123"}';
SELECT * FROM assignments WHERE assignee_id = current_user_id();
-- Should only return user-123's assignments
```

### Troubleshooting Realtime

**Issue**: No real-time updates received

**Solutions**:
1. Check Realtime is enabled in Supabase dashboard (Settings → API → Realtime)
2. Verify RLS policies allow SELECT for authenticated users
3. Check WebSocket connection in browser DevTools (Network → WS)
4. Review Supabase project plan (Free plan has 200 concurrent connections limit)

**Issue**: "Realtime disconnected" errors

**Solutions**:
1. Implement reconnection logic with exponential backoff
2. Reduce subscription count (unsubscribe when component unmounts)
3. Check network stability (corporate firewalls may block WebSockets)

---

## Performance Tuning

### Database Indexes (T067)

Migration T067 creates optimized indexes. Verify they exist:

```sql
-- Check composite indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'assignments'
ORDER BY indexname;
```

Expected indexes:
- `idx_assignments_assignee_status_sla` (composite for My Assignments query)
- `idx_assignments_status_sla_covering` (covering index for SLA monitoring)
- `idx_assignments_sla_partial` (partial index for active assignments only)

### Query Performance Validation

#### Test 1: Auto-Assignment Query (<500ms)

```sql
EXPLAIN ANALYZE
SELECT * FROM find_eligible_staff_for_assignment(
  '{"required_skills": ["skill-arabic"], "target_unit_id": "unit-translation"}'::jsonb
);
```

Expected: `Execution Time: < 500 ms` for 500 staff members

#### Test 2: SLA Monitoring Query (<5s)

```sql
EXPLAIN ANALYZE
SELECT sla_check_and_escalate();
```

Expected: `Execution Time: < 5000 ms` for 10,000 active assignments

#### Test 3: Queue Processing Query (<1s)

```sql
EXPLAIN ANALYZE
SELECT * FROM assignment_queue
ORDER BY priority DESC, created_at ASC
LIMIT 10;
```

Expected: `Execution Time: < 1000 ms`

### Database Connection Pooling

Configure connection pool for high concurrency:

```javascript
// Supabase client configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: { 'x-application-name': 'assignment-engine' },
  },
  // Connection pool settings (handled by Supabase)
  realtime: {
    params: {
      eventsPerSecond: 10, // Throttle realtime events
    },
  },
});
```

### Monitoring & Alerts

Set up monitoring for:

1. **SLA Monitoring Job Duration** (alert if >5 seconds)
   ```sql
   SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_sec
   FROM cron.job_run_details
   WHERE jobname = 'sla-monitoring' AND start_time > NOW() - INTERVAL '1 hour';
   ```

2. **Assignment Queue Depth** (alert if >100 items)
   ```sql
   SELECT COUNT(*) as queue_depth FROM assignment_queue;
   ```

3. **Escalation Rate** (alert if >10% of assignments escalate)
   ```sql
   SELECT
     COUNT(DISTINCT assignment_id)::float / (SELECT COUNT(*) FROM assignments) * 100 as escalation_pct
   FROM escalation_events
   WHERE escalated_at > NOW() - INTERVAL '24 hours';
   ```

---

## Post-Deployment Validation

### Automated Test Suite

Run contract tests to verify endpoints:

```bash
cd backend
npm run test:contract
```

Expected: All tests pass (0 failures)

### Manual Test Scenarios

Follow scenarios from `specs/013-assignment-engine-sla/quickstart.md`:

1. **Scenario 1**: Skill-based auto-assignment
   - Create ticket requiring Arabic skill
   - Verify assignment to staff with matching skill

2. **Scenario 2**: WIP limit enforcement
   - Assign items until staff at WIP limit
   - Verify next item queued (not assigned)

3. **Scenario 3**: SLA escalation
   - Create assignment with short SLA (e.g., 2h for urgent ticket)
   - Wait for SLA breach (or fast-forward deadline in test DB)
   - Verify escalation event created

4. **Scenario 4**: Priority-based queueing
   - Queue items with different priorities (urgent, high, normal)
   - Free capacity
   - Verify urgent assigned first

5. **Scenario 5**: Leave-based reassignment
   - Staff goes on leave
   - Verify urgent/high items reassigned
   - Verify normal/low items flagged for review

### Health Check Endpoint

Create a health check endpoint to verify deployment:

```bash
curl "$SUPABASE_URL/functions/v1/health/assignment-engine" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "pg_cron_jobs": 4,
    "realtime": "enabled",
    "edge_functions": 7
  }
}
```

---

## Rollback Procedure

### Emergency Rollback (Within 1 Hour of Deployment)

If critical issues arise, rollback immediately:

```bash
# Restore database from backup
psql -h db.YOUR_PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  -f backup-YYYYMMDD.sql

# Undeploy edge functions
supabase functions delete assignments-auto-assign
supabase functions delete assignments-manual-override
# ... repeat for all 7 functions

# Disable pg_cron jobs
SELECT cron.unschedule('sla-monitoring');
SELECT cron.unschedule('capacity-snapshot');
SELECT cron.unschedule('queue-fallback-processor');
SELECT cron.unschedule('escalation-cleanup');
```

### Partial Rollback (Specific Migration)

To rollback a specific migration:

```sql
-- Example: Rollback T007 (assignments table)
DROP TABLE IF EXISTS assignments CASCADE;

-- Re-run previous migrations if needed
-- Then re-deploy edge functions
```

### Rollback Validation

After rollback:

1. Verify database state: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';`
2. Check edge functions: `supabase functions list`
3. Test application functionality
4. Review error logs: `supabase logs --level error --limit 100`

---

## Troubleshooting

### Common Issues

#### Issue 1: Migration Fails with Foreign Key Error

**Symptoms**: Migration fails with "violates foreign key constraint"

**Cause**: Migrations applied out of order

**Solution**:
1. Rollback failed migration: `supabase db reset`
2. Re-apply migrations in correct order (T001 → T023)

#### Issue 2: pg_cron Jobs Not Running

**Symptoms**: SLA monitoring not triggering escalations

**Cause**: pg_cron extension not enabled or wrong database

**Solution**:
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Check jobs are in correct database
SELECT * FROM cron.job WHERE database = current_database();
```

#### Issue 3: Realtime Subscriptions Not Receiving Updates

**Symptoms**: Frontend not updating in real-time

**Cause**: RLS policies blocking SELECT or Realtime not enabled

**Solution**:
1. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'assignments';`
2. Enable Realtime in Supabase dashboard: Settings → API → Realtime
3. Test subscription with service role key (bypasses RLS)

#### Issue 4: Edge Functions Timing Out

**Symptoms**: 504 Gateway Timeout on auto-assign endpoint

**Cause**: Auto-assignment query too slow (>500ms)

**Solution**:
1. Check indexes: `EXPLAIN ANALYZE SELECT * FROM find_eligible_staff_for_assignment(...);`
2. Reduce candidate pool: Limit to 50 staff (migration T068)
3. Add query timeout: `SET statement_timeout = 500;` in function

#### Issue 5: Queue Not Processing

**Symptoms**: Items stuck in queue even when capacity available

**Cause**: Trigger not firing or queue processor failing

**Solution**:
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'assignment_completion_trigger';`
2. Manually trigger queue processing: `SELECT process_stale_queue_items();`
3. Review pg_notify channel: `LISTEN queue_process_needed;` then complete an assignment

### Logging & Debugging

Enable detailed logging:

```javascript
// In Edge Functions (supabase/functions/...)
console.log('[AUTO-ASSIGN] Starting assignment for:', workItemId);
console.log('[AUTO-ASSIGN] Eligible staff count:', eligibleStaff.length);
console.log('[AUTO-ASSIGN] Selected assignee:', assigneeId, 'with score:', score);
```

View logs:

```bash
# Real-time logs
supabase functions logs assignments-auto-assign --follow

# Last 100 errors
supabase functions logs assignments-auto-assign --level error --limit 100
```

### Support Channels

For deployment issues:

- **Documentation**: https://docs.gastat.gov.sa/assignment-engine
- **Supabase Support**: https://supabase.com/support
- **Internal Slack**: #assignment-engine-support
- **Email**: devops@gastat.gov.sa

---

## Maintenance Schedule

### Daily
- Monitor pg_cron job execution: `SELECT * FROM cron.job_run_details WHERE start_time > NOW() - INTERVAL '1 day';`
- Check queue depth: `SELECT COUNT(*) FROM assignment_queue;`
- Review error logs: `supabase functions logs --level error --limit 50`

### Weekly
- Archive completed assignments (>90 days): `DELETE FROM assignments WHERE completed_at < NOW() - INTERVAL '90 days';`
- Vacuum database: `VACUUM ANALYZE assignments, assignment_queue;`
- Review escalation trends: `SELECT COUNT(*) FROM escalation_events WHERE escalated_at > NOW() - INTERVAL '7 days';`

### Monthly
- Performance review: Run load tests (T080, T081)
- Index optimization: `REINDEX TABLE assignments;`
- Update documentation with lessons learned

---

**Deployment Checklist**:
- [ ] All 24 migrations applied
- [ ] All 7 edge functions deployed
- [ ] All 4 pg_cron jobs active
- [ ] Realtime enabled for 3 tables
- [ ] Performance indexes created
- [ ] Post-deployment tests passed
- [ ] Monitoring alerts configured
- [ ] Rollback procedure documented
- [ ] Team trained on new features

---

**Last Updated**: 2025-10-02
**Deployment Version**: 1.0.0
**Responsible Team**: GASTAT DevOps & Backend Team
