# Quickstart: Unified Tasks Model

**Branch**: `025-unified-tasks-model` | **Date**: 2025-10-19

## Overview

This quickstart guide helps developers get the unified tasks model up and running quickly. It covers database setup, local development, testing, and deployment steps for consolidating the assignments + tasks tables into a unified structure with contributor support.

---

## Prerequisites

- Node.js 18+ LTS
- pnpm (package manager)
- Docker + Docker Compose (for local Supabase)
- Supabase CLI: `npm install -g supabase`
- Supabase project credentials (for remote deployment)

---

## 1. Environment Setup

### Clone and Install Dependencies

```bash
# Navigate to project root
cd /path/to/Intl-DossierV2.0

# Install dependencies
pnpm install

# Verify installation
pnpm run typecheck
```

### Start Local Supabase

```bash
# Start Supabase local stack (PostgreSQL, Auth, Storage, Realtime)
supabase start

# Note: This will output local URLs and credentials:
# API URL: http://localhost:54321
# Anon key: <anon-key>
# Service role key: <service-key>

# Verify Supabase is running
supabase status
```

---

## 2. Database Migration

### Apply Migrations Locally

```bash
# Navigate to supabase directory
cd supabase

# Apply all migrations (creates tasks, task_contributors tables)
supabase db reset  # Resets DB and applies all migrations from scratch

# OR apply incrementally
supabase migration up

# Verify migrations
supabase db diff  # Should show no changes
```

### Migrations Applied (in order)

1. **20YYYYMMDDHHMMSS_create_unified_tasks.sql**
   - Creates `tasks` table with all fields from old assignments + tasks
   - Includes optimistic locking via `updated_at`
   - Adds engagement_id for kanban boards

2. **20YYYYMMDDHHMMSS_create_task_contributors.sql**
   - Creates `task_contributors` table for team collaboration
   - UNIQUE constraint on (task_id, user_id)

3. **20YYYYMMDDHHMMSS_migrate_assignments_to_tasks.sql**
   - Renames `assignments` → `assignments_deprecated` (rollback safety)
   - Migrates data from old schema to new `tasks` table
   - Includes verification checks

4. **20YYYYMMDDHHMMSS_add_tasks_indexes.sql**
   - Creates composite partial indexes for performance
   - Optimized for variable load (10-1000+ tasks per user)

5. **20YYYYMMDDHHMMSS_add_tasks_rls_policies.sql**
   - Enables Row Level Security on tasks and task_contributors
   - Policies for SELECT/INSERT/UPDATE/DELETE based on ownership + contribution

### Verify Migration Success

```bash
# Check table exists
supabase db query "SELECT COUNT(*) FROM tasks;"

# Check indexes created
supabase db query "SELECT indexname FROM pg_indexes WHERE tablename = 'tasks';"

# Check RLS enabled
supabase db query "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('tasks', 'task_contributors');"
```

---

## 3. Generate TypeScript Types

```bash
# Generate types from database schema
npx supabase gen types typescript --project-id zkrcjzdemdmwhearhfgg > backend/src/types/database.types.ts

# OR for local development
npx supabase gen types typescript --local > backend/src/types/database.types.ts

# Verify types generated
cat backend/src/types/database.types.ts | grep "tasks:"
```

---

## 4. Start Development Servers

### Backend (Express + Supabase Edge Functions)

```bash
# Terminal 1: Start backend Express server
cd backend
pnpm dev

# Expected output:
# Server listening on http://localhost:3001
# Connected to Supabase

# Terminal 2: Start Supabase Edge Functions locally
cd supabase
supabase functions serve

# Expected output:
# Serving functions on http://localhost:54321/functions/v1
```

### Frontend (React + Vite)

```bash
# Terminal 3: Start frontend dev server
cd frontend
pnpm dev

# Expected output:
# VITE v5.x ready in Xms
# Local: http://localhost:5173
```

---

## 5. Test the Implementation

### Run Contract Tests (API Endpoints)

```bash
# Test tasks CRUD endpoints
cd backend
pnpm test tests/contract/tasks-api.test.ts

# Test contributors endpoints
pnpm test tests/contract/contributors-api.test.ts

# Expected: All tests pass ✅
```

### Run Integration Tests (Database Queries)

```bash
# Test migration integrity
pnpm test tests/integration/tasks-migration.test.ts

# Test kanban queries
pnpm test tests/integration/kanban-queries.test.ts

# Expected: All tests pass ✅
```

### Run E2E Tests (User Flows)

```bash
# Start all servers first (backend + frontend + supabase)
cd frontend
pnpm test:e2e

# Or run specific test
pnpm playwright test tests/e2e/task-creation.spec.ts

# Expected: All E2E tests pass ✅
```

### Manual Testing Checklist

1. **Create a Task**
   - Navigate to http://localhost:5173/tasks/new
   - Fill in title: "Test Task"
   - Set assignee, priority, status
   - Click "Create Task"
   - ✅ Task created with descriptive title (not "Assignment #xyz")

2. **View My Tasks**
   - Navigate to http://localhost:5173/tasks
   - ✅ See task list with titles, not IDs
   - ✅ Pagination works for variable loads

3. **Add Contributors**
   - Open task detail page
   - Click "Add Contributor"
   - Select user, role (helper/reviewer/etc.)
   - ✅ Contributor appears in list
   - ✅ Contributor can view task in "Tasks I Contributed To" filter

4. **Kanban Board**
   - Navigate to engagement detail page
   - Click "View Kanban Board"
   - ✅ All engagement tasks display in correct columns
   - Drag task from "todo" to "in_progress"
   - ✅ Task updates immediately (optimistic UI)
   - ✅ Persists after page refresh

5. **Concurrent Edit Conflict**
   - Open same task in two browser tabs
   - Edit title in Tab 1, save (✅ succeeds)
   - Edit priority in Tab 2, save
   - ✅ Conflict dialog appears with options: Reload, Force Save, Cancel

6. **Network Failure Retry**
   - Open DevTools → Network tab
   - Throttle to "Slow 3G"
   - Update task
   - ✅ Loading indicator shows during auto-retry
   - ✅ Task updates after retry succeeds

---

## 6. Deployment to Production

### Pre-Deployment Checklist

```bash
# 1. Run full test suite
pnpm test
pnpm test:e2e

# 2. Type check
pnpm typecheck

# 3. Lint
pnpm lint

# 4. Build frontend
cd frontend
pnpm build

# 5. Verify build output
ls -lh dist/
```

### Apply Migrations to Production

```bash
# Link to production Supabase project
supabase link --project-ref zkrcjzdemdmwhearhfgg

# Apply migrations (< 5 minutes downtime)
supabase db push

# Verify migration success
supabase db query "SELECT COUNT(*) FROM tasks;"
supabase db query "SELECT COUNT(*) FROM assignments_deprecated;"  # Should match

# Generate production types
npx supabase gen types typescript --project-id zkrcjzdemdmwhearhfgg > backend/src/types/database.types.ts
```

### Deploy Backend Services

```bash
# Deploy Edge Functions to Supabase
cd supabase/functions

supabase functions deploy tasks-get
supabase functions deploy tasks-create
supabase functions deploy tasks-update
supabase functions deploy tasks-delete
supabase functions deploy contributors-get
supabase functions deploy contributors-add
supabase functions deploy contributors-remove

# Verify deployments
supabase functions list
```

### Deploy Frontend

```bash
# Build optimized production bundle
cd frontend
pnpm build

# Deploy to hosting (example: Vercel)
vercel --prod

# OR deploy to your hosting platform
# (Netlify, Cloudflare Pages, AWS S3 + CloudFront, etc.)
```

### Post-Deployment Verification

```bash
# Test production endpoints
curl -X GET "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/tasks-get?filter=assigned" \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: 200 OK with tasks list

# Verify frontend
open https://your-production-domain.com/tasks

# Manual smoke tests:
# ✅ Login works
# ✅ Tasks list loads with titles
# ✅ Task creation works
# ✅ Contributors can be added
# ✅ Kanban board displays correctly
```

---

## 7. Rollback Plan (if needed)

If issues arise within 30-day window:

```bash
# 1. Stop application deployments

# 2. Revert database changes
supabase db query "
  DROP TABLE IF EXISTS tasks CASCADE;
  DROP TABLE IF EXISTS task_contributors CASCADE;
  ALTER TABLE assignments_deprecated RENAME TO assignments;
"

# 3. Restore old Edge Functions
git checkout <previous-commit>
cd supabase/functions
supabase functions deploy <old-function-name>

# 4. Restore old frontend
cd frontend
git checkout <previous-commit>
pnpm build
vercel --prod
```

---

## 8. Common Issues & Troubleshooting

### Issue: Migration fails with "table already exists"

**Solution**: Reset local database
```bash
supabase db reset --force
```

### Issue: RLS policies block legitimate queries

**Solution**: Test RLS with different user roles
```bash
# Login as test user
supabase auth login --email test@example.com

# Query tasks as that user
supabase db query "SELECT * FROM tasks WHERE assignee_id = auth.uid();"
```

### Issue: Optimistic locking conflicts on every save

**Solution**: Ensure client sends correct `updated_at` timestamp
```typescript
// Frontend: Send current timestamp from query data
const task = useQuery(['task', taskId]);
await updateTask({ ...changes, updated_at: task.data.updated_at });
```

### Issue: Contributors not appearing in task detail

**Solution**: Check RLS policies allow contributor access
```sql
-- Verify policy allows contributor to SELECT
SELECT * FROM task_contributors WHERE task_id = '<task-id>' AND user_id = auth.uid();
```

### Issue: Kanban drag-and-drop fails silently

**Solution**: Check browser console for network errors, verify optimistic locking
```typescript
// Frontend: Revert optimistic update on error
queryClient.setQueryData(['kanban-tasks'], previousTasks);
```

---

## 9. Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/add-task-tags

# 2. Make changes to code

# 3. Write tests FIRST (TDD)
cd backend/tests
# Create test file: task-tags.test.ts

# 4. Run tests (should fail)
pnpm test tests/contract/task-tags.test.ts

# 5. Implement feature

# 6. Run tests (should pass)
pnpm test tests/contract/task-tags.test.ts

# 7. Update types
npx supabase gen types typescript --local > backend/src/types/database.types.ts

# 8. Commit
git add .
git commit -m "feat: add task tags support"

# 9. Push and create PR
git push origin feature/add-task-tags
```

### Adding New Database Fields

```bash
# 1. Create migration file
supabase migration new add_task_tags

# 2. Write migration SQL
# supabase/migrations/YYYYMMDDHHMMSS_add_task_tags.sql
ALTER TABLE tasks ADD COLUMN tags TEXT[];
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

# 3. Apply migration locally
supabase migration up

# 4. Regenerate types
npx supabase gen types typescript --local > backend/src/types/database.types.ts

# 5. Test migration
pnpm test tests/integration/tasks-migration.test.ts

# 6. Update API contracts
# Edit: specs/025-unified-tasks-model/contracts/tasks-api.yaml
```

---

## 10. Performance Monitoring

### Key Metrics to Track

```typescript
// Frontend: TanStack Query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />

// Monitor:
// - Query cache hit rate
// - Average query duration
// - Mutation success/error rate
```

### Database Query Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
WHERE query LIKE '%tasks%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'tasks'
ORDER BY idx_scan DESC;
```

### Target Performance Metrics (from NFR)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Task detail page load | <2s | Chrome DevTools Performance tab |
| Kanban board render (100 tasks) | <3s | Chrome DevTools Performance tab |
| My Tasks page (10-1000+ tasks) | <2s | React Query devtools + Network tab |
| Auto-retry success rate | 99% | Application monitoring (Sentry/DataDog) |
| Loading indicator visibility | <200ms | Manual testing + performance monitoring |

---

## Additional Resources

- [Data Model Documentation](./data-model.md)
- [API Contracts](./contracts/)
- [Research Findings](./research.md)
- [Implementation Plan](./plan.md)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React 19 Documentation](https://react.dev)

---

**Next Steps**: Run `/speckit.tasks` to generate actionable task breakdown for implementation
