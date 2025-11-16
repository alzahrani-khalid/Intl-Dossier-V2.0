# Quickstart Guide: Relationship Health & Commitment Intelligence

**Feature**: 030-health-commitment
**Date**: 2025-11-15
**Audience**: Developers setting up local environment for testing

## Overview

This guide walks you through setting up and testing the Relationship Health & Commitment Intelligence feature locally. By the end, you'll have:

✅ Database tables and materialized views created
✅ Supabase Edge Functions deployed locally
✅ Frontend components wired to display real stats
✅ Scheduled jobs running for automated refresh
✅ Sample test data loaded for verification

**Estimated Setup Time**: 30 minutes

---

## Prerequisites

Ensure you have the following installed and configured:

- **Node.js**: 18+ LTS (`node --version`)
- **pnpm**: 10.x+ (`pnpm --version`)
- **Docker**: 20+ with Docker Compose (`docker --version`)
- **Supabase CLI**: Latest version (`supabase --version`)
- **Git**: Repository cloned locally

---

## Step 1: Start Development Environment

### 1.1 Start Docker Services

```bash
# Start PostgreSQL, Redis, and other services
pnpm run docker:up

# Verify services are healthy
docker ps
# Should see: postgres, redis, supabase-studio containers running
```

### 1.2 Start Supabase Local Development

```bash
# Initialize Supabase (if first time)
supabase init

# Start Supabase local stack
supabase start

# Note the API URL and anon key from output:
# API URL: http://localhost:54321
# Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these values** - you'll need them for environment variables.

---

## Step 2: Database Setup

### 2.1 Apply Migrations

```bash
# Run all pending migrations
pnpm run db:migrate

# Migrations to be applied:
# - [timestamp]_create_health_scores_table.sql
# - [timestamp]_create_engagement_stats_view.sql
# - [timestamp]_create_commitment_stats_view.sql
# - [timestamp]_create_refresh_functions.sql
# - [timestamp]_add_commitment_overdue_trigger.sql
```

### 2.2 Seed Test Data

```bash
# Seed database with test dossiers, engagements, commitments
pnpm run db:seed

# This creates:
# - 10 test dossiers (countries, organizations, forums)
# - 200 engagements (distributed across 12 months)
# - 50 commitments (mix of statuses: pending, in_progress, completed, overdue, cancelled)
```

### 2.3 Verify Database Setup

```bash
# Open Supabase Studio
open http://localhost:54323

# Navigate to Table Editor and verify tables exist:
# - health_scores (empty initially - will be populated by Edge Function)
# - dossier_engagement_stats (materialized view - should have 10 rows)
# - dossier_commitment_stats (materialized view - should have 10 rows)

# Navigate to SQL Editor and run:
SELECT COUNT(*) FROM dossier_engagement_stats;
-- Expected: 10 (one row per dossier)

SELECT COUNT(*) FROM dossier_commitment_stats;
-- Expected: 10 (one row per dossier)

SELECT * FROM commitments WHERE status = 'overdue';
-- Expected: A few overdue commitments from seed data
```

---

## Step 3: Deploy Supabase Edge Functions

### 3.1 Deploy Functions Locally

```bash
# Deploy all Edge Functions to local Supabase
supabase functions deploy dossier-stats
supabase functions deploy calculate-health-score
supabase functions deploy refresh-commitment-stats
supabase functions deploy detect-overdue-commitments

# Verify deployment
supabase functions list
# Should show all 4 functions as "deployed"
```

### 3.2 Test Edge Functions

```bash
# Test calculate-health-score function
curl -X POST http://localhost:54321/functions/v1/calculate-health-score \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dossierId": "DOSSIER_UUID_FROM_SEED_DATA"}'

# Expected response:
# {
#   "dossierId": "...",
#   "overallScore": 78,
#   "components": {
#     "engagementFrequency": 80,
#     "commitmentFulfillment": 75,
#     "recencyScore": 70
#   },
#   "sufficientData": true,
#   "calculatedAt": "2025-11-15T14:30:00Z",
#   "calculationTimeMs": 45,
#   "cached": false
# }

# Test dossier-stats function (GET)
curl "http://localhost:54321/functions/v1/dossier-stats?dossierId=DOSSIER_UUID_FROM_SEED_DATA" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected response:
# {
#   "dossierId": "...",
#   "commitments": { "active": 5, "overdue": 2, ... },
#   "engagements": { "total365d": 24, "recent90d": 8, ... },
#   "documents": { "total": 45 },
#   "health": { "overallScore": 78, ... },
#   "dataFreshness": { "isCurrent": true, ... }
# }
```

---

## Step 4: Configure Environment Variables

### 4.1 Frontend Environment

Create/update `frontend/.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_FROM_STEP_1.2

# Feature Flags
VITE_ENABLE_HEALTH_SCORES=true
VITE_ENABLE_COMMITMENT_TRACKING=true
```

### 4.2 Backend Environment

Create/update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY_FROM_STEP_1.2
SUPABASE_ANON_KEY=YOUR_ANON_KEY_FROM_STEP_1.2

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Scheduled Job Configuration
ENABLE_SCHEDULED_JOBS=true
HEALTH_REFRESH_INTERVAL_MINUTES=15
OVERDUE_CHECK_HOUR=2  # 2:00 AM AST
```

---

## Step 5: Start Development Servers

### 5.1 Start Backend (Scheduled Jobs)

```bash
# Terminal 1: Start backend service with scheduled jobs
cd backend
pnpm dev

# You should see logs:
# [HEALTH-REFRESH] Scheduled job registered: every 15 minutes
# [OVERDUE-CHECK] Scheduled job registered: daily at 2:00 AM
```

### 5.2 Start Frontend

```bash
# Terminal 2: Start frontend dev server
cd frontend
pnpm dev

# Frontend should start at http://localhost:5173
```

---

## Step 6: Verify Feature in Browser

### 6.1 Test Dossier Stats Display

1. Open http://localhost:5173
2. Navigate to a test dossier (e.g., `/dossiers/countries/DOSSIER_UUID`)
3. Verify stats panel displays:
   - ✅ Active commitments count (not zero)
   - ✅ Overdue commitments count (with red/warning color if >0)
   - ✅ Total documents count
   - ✅ Recent activity count
   - ✅ Health score with color-coded indicator (green/yellow/orange/red)
4. Hover over health score → verify tooltip shows component breakdown

### 6.2 Test Dashboard Health Chart

1. Navigate to dashboard (e.g., `/dashboard`)
2. Verify relationship health chart displays:
   - ✅ Real aggregated data grouped by region (not hardcoded)
   - ✅ Health scores for each region/bloc
   - ✅ Color-coded bars based on health tier
3. Hover over region bar → verify tooltip shows component breakdown

### 6.3 Test Commitment Tracking

1. Navigate to commitments list (e.g., `/commitments`)
2. Verify:
   - ✅ Upcoming commitments flagged (due within 30 days)
   - ✅ Overdue commitments displayed with warning indicator
   - ✅ Status update triggers health score recalculation (check browser DevTools network tab for POST to calculate-health-score)

---

## Step 7: Test Scheduled Jobs

### 7.1 Manually Trigger Materialized View Refresh

```bash
# Trigger refresh via Edge Function
curl -X POST http://localhost:54321/functions/v1/refresh-commitment-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected response:
# {
#   "success": true,
#   "refreshedAt": "2025-11-15T14:30:00Z",
#   "executionTimeMs": 4823,
#   "rowsUpdated": 10
# }

# Verify materialized view updated
# Open Supabase Studio → SQL Editor:
SELECT * FROM dossier_commitment_stats;
-- Check that stats reflect latest commitment data
```

### 7.2 Manually Trigger Overdue Detection

```bash
# Trigger overdue detection (dry run)
curl -X POST http://localhost:54321/functions/v1/detect-overdue-commitments \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Expected response:
# {
#   "overdueCount": 5,
#   "affectedDossiers": 3,
#   "notificationsSent": 0,
#   "healthScoresRecalculated": 0,
#   "dryRun": true,
#   "commitments": [...]
# }

# Trigger actual overdue detection (updates status)
curl -X POST http://localhost:54321/functions/v1/detect-overdue-commitments \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'

# Verify commitments marked as overdue in database
```

---

## Step 8: Run Tests

### 8.1 Backend Contract Tests

```bash
cd backend
pnpm test:contract

# Expected output:
# ✓ dossier-stats.contract.test.ts (10 tests)
# ✓ health-calculation.contract.test.ts (8 tests)
# ✓ commitment-tracking.contract.test.ts (6 tests)
# Total: 24 passing
```

### 8.2 Backend Integration Tests

```bash
cd backend
pnpm test:integration

# Expected output:
# ✓ health-score.integration.test.ts (12 tests)
#   ✓ calculates health score with sufficient data
#   ✓ returns null for insufficient data
#   ✓ uses cached score when current
#   ✓ recalculates stale scores
#   ...
# Total: 12 passing
```

### 8.3 Frontend E2E Tests

```bash
cd frontend
pnpm exec playwright test

# Expected output:
# ✓ dossier-stats.spec.ts (5 tests)
#   ✓ displays accurate dossier stats
#   ✓ navigates to commitments on click
#   ✓ shows insufficient data message
#   ...
# ✓ dashboard-health.spec.ts (4 tests)
#   ✓ displays real health chart data
#   ✓ updates chart on commitment status change
#   ...
# Total: 9 passing
```

---

## Troubleshooting

### Issue: Edge Functions fail with "function not found"

**Solution**:
```bash
# Re-deploy Edge Functions
supabase functions deploy dossier-stats --no-verify-jwt
supabase functions deploy calculate-health-score --no-verify-jwt

# Verify deployment
supabase functions list
```

### Issue: Materialized views return empty results

**Solution**:
```bash
# Manually refresh materialized views
supabase db reset  # Warning: Deletes all data!
pnpm run db:migrate
pnpm run db:seed

# Or refresh views without reset:
supabase db query "REFRESH MATERIALIZED VIEW dossier_engagement_stats;"
supabase db query "REFRESH MATERIALIZED VIEW dossier_commitment_stats;"
```

### Issue: Health scores return null (insufficient data)

**Solution**:
```bash
# Check dossier has sufficient data
supabase db query "SELECT COUNT(*) FROM engagements WHERE dossier_id = 'YOUR_DOSSIER_UUID' AND created_at >= NOW() - INTERVAL '365 days';"
# Expected: >= 3 engagements

supabase db query "SELECT COUNT(*) FROM commitments WHERE dossier_id = 'YOUR_DOSSIER_UUID' AND status != 'cancelled';"
# Expected: >= 1 commitment

# If insufficient, add more test data via seed script
```

### Issue: Scheduled jobs not running

**Solution**:
```bash
# Verify Redis is running
docker ps | grep redis
# Expected: redis container running

# Check backend logs for job registration
cd backend
pnpm dev
# Expected: [HEALTH-REFRESH] Scheduled job registered

# Manually trigger job to test
curl -X POST http://localhost:54321/functions/v1/refresh-commitment-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Next Steps

After completing this quickstart, you're ready to:

1. **Implement Tasks**: Generate actionable tasks via `/speckit.tasks`
2. **Write Tests**: Follow TDD approach (tests first, then code)
3. **Deploy to Staging**: Test on staging Supabase project (zkrcjzdemdmwhearhfgg)
4. **Monitor Performance**: Verify ≤500ms stats queries, 2-minute recalculation SLA

---

## Reference Links

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**:
  - [dossier-stats.openapi.yaml](./contracts/dossier-stats.openapi.yaml)
  - [health-calculation.openapi.yaml](./contracts/health-calculation.openapi.yaml)
  - [commitment-tracking.openapi.yaml](./contracts/commitment-tracking.openapi.yaml)
- **Supabase Docs**: https://supabase.com/docs
- **TanStack Query Docs**: https://tanstack.com/query/latest/docs

---

## Support

If you encounter issues not covered in troubleshooting:

1. Check backend logs: `cd backend && pnpm dev` (Terminal 1)
2. Check Supabase logs: `supabase logs` or Supabase Studio → Logs
3. Verify database state: Supabase Studio → Table Editor
4. Review Edge Function logs: Supabase Studio → Functions → Logs
5. Contact team: Slack #intl-dossier-dev channel

---

**Last Updated**: 2025-11-15
**Maintainer**: GASTAT Technical Team
