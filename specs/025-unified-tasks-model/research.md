# Research: Unified Tasks Model

**Branch**: `025-unified-tasks-model` | **Date**: 2025-10-19

## Overview

This document consolidates research findings for implementing the unified tasks model. Key areas researched: optimistic locking patterns, data migration strategies, auto-retry logic with exponential backoff, database indexing for variable-load scenarios, and RLS policy patterns for multi-table joins.

---

## 1. Optimistic Locking Patterns

### Decision
Use **updated_at timestamp comparison** for optimistic locking rather than a separate version column.

### Rationale
- **Simplicity**: updated_at already exists for audit trail (FR-017), no additional column needed
- **Supabase compatibility**: Works seamlessly with Supabase's automatic timestamp handling
- **Implementation**:
  - Client sends current `updated_at` value with UPDATE request
  - Server compares sent timestamp with database timestamp
  - If timestamps don't match → conflict detected → return 409 Conflict
  - Client shows conflict dialog with options: reload, force save, cancel (FR-022)

### Alternatives Considered
- **Dedicated version column (integer)**: Adds complexity, requires triggers to increment, more storage
- **Entity tags (ETags)**: Better for REST caching but overkill for internal state management
- **Last-write-wins**: Rejected - violates FR-022 requirement for conflict detection

### Implementation Pattern
```typescript
// Backend service
async updateTask(taskId: string, updates: Partial<Task>, clientTimestamp: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({...updates, updated_at: 'now()'})
    .eq('id', taskId)
    .eq('updated_at', clientTimestamp) // Optimistic lock check
    .select()
    .single();

  if (!data) {
    throw new ConflictError('Task was modified by another user');
  }
  return data;
}

// Frontend hook
const handleSave = async () => {
  try {
    await updateTask(taskId, changes, task.updated_at);
    toast.success('Task updated');
  } catch (error) {
    if (error instanceof ConflictError) {
      showConflictDialog({
        onReload: () => refetch(),
        onForce: () => updateTask(taskId, changes, null), // Force save
        onCancel: () => resetForm()
      });
    }
  }
};
```

### References
- [Supabase Optimistic Updates Guide](https://supabase.com/docs/guides/database/postgres/column-level-security#optimistic-locking)
- Martin Fowler: Patterns of Enterprise Application Architecture - Optimistic Offline Lock

---

## 2. Zero-Downtime Data Migration Strategy

### Decision
Use **three-phase migration** with backwards compatibility table rename.

### Rationale
- **Zero data loss** (NFR-001): All assignment data preserved
- **Rollback capability**: 30-day window via assignments_deprecated table (NFR-005)
- **Minimal downtime**: < 5 minutes deployment window
- **Verification**: Count validation and sample data checks at each phase

### Migration Phases

#### Phase 1: Schema Setup (Pre-deployment)
```sql
-- Migration: YYYYMMDDHHMMSS_create_unified_tasks.sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id),
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  workflow_stage TEXT NOT NULL CHECK (workflow_stage IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority TEXT NOT NULL,
  sla_deadline TIMESTAMPTZ,
  work_item_type TEXT CHECK (work_item_type IN ('dossier', 'position', 'ticket', 'generic')),
  work_item_id UUID,
  source JSONB, -- For multiple work items
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE task_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('helper', 'reviewer', 'advisor', 'observer', 'supervisor')),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  UNIQUE(task_id, user_id)
);
```

#### Phase 2: Data Migration (Deployment window)
```sql
-- Migration: YYYYMMDDHHMMSS_migrate_assignments_to_tasks.sql

-- Rename old table for rollback capability
ALTER TABLE IF EXISTS assignments RENAME TO assignments_deprecated;

-- Migrate data from assignments_deprecated → tasks
INSERT INTO tasks (
  id, title, description, assignee_id, engagement_id,
  status, workflow_stage, priority, sla_deadline,
  work_item_type, work_item_id, source,
  created_by, updated_by, completed_by,
  created_at, updated_at, completed_at, is_deleted
)
SELECT
  a.id,
  COALESCE(t.title, 'Assignment #' || SUBSTRING(a.id::text, 1, 8)) AS title,
  COALESCE(t.description, '') AS description,
  a.assignee_id,
  NULL AS engagement_id, -- MUST be manually backfilled if engagements exist
  a.status,
  a.workflow_stage,
  a.priority,
  a.sla_deadline,
  a.work_item_type,
  a.work_item_id,
  a.source,
  a.created_by,
  a.updated_by,
  a.completed_by,
  a.created_at,
  a.updated_at,
  a.completed_at,
  a.is_deleted
FROM assignments_deprecated a
LEFT JOIN tasks_deprecated t ON t.assignment_id = a.id; -- If old tasks table exists

-- Verification queries
DO $$
DECLARE
  old_count INT;
  new_count INT;
BEGIN
  SELECT COUNT(*) INTO old_count FROM assignments_deprecated;
  SELECT COUNT(*) INTO new_count FROM tasks;

  IF old_count != new_count THEN
    RAISE EXCEPTION 'Migration failed: Expected % rows, got %', old_count, new_count;
  END IF;

  RAISE NOTICE 'Migration successful: % rows migrated', new_count;
END $$;
```

#### Phase 3: Indexes & Policies (Post-deployment)
```sql
-- Migration: YYYYMMDDHHMMSS_add_tasks_indexes.sql
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE is_deleted = false;
CREATE INDEX idx_tasks_engagement ON tasks(engagement_id) WHERE is_deleted = false;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE is_deleted = false;
CREATE INDEX idx_tasks_workflow_stage ON tasks(workflow_stage) WHERE is_deleted = false;
CREATE INDEX idx_tasks_sla_deadline ON tasks(sla_deadline) WHERE is_deleted = false;
CREATE INDEX idx_tasks_work_item ON tasks(work_item_type, work_item_id) WHERE is_deleted = false;
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_contributors_task ON task_contributors(task_id);
CREATE INDEX idx_contributors_user ON task_contributors(user_id) WHERE removed_at IS NULL;
```

### Rollback Procedure
```sql
-- If rollback needed within 30 days:
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_contributors CASCADE;
ALTER TABLE assignments_deprecated RENAME TO assignments;
-- Re-apply original RLS policies
```

### Alternatives Considered
- **Blue-green deployment**: Requires duplicate infrastructure, overkill for schema change
- **Gradual migration**: Adds complexity with dual-write scenarios, higher risk
- **Feature flags**: Unnecessary - migration is one-way with rollback capability

### References
- [Supabase Zero-Downtime Migrations](https://supabase.com/docs/guides/database/postgres/migrations#zero-downtime-migrations)
- [PostgreSQL Large Table Migrations](https://www.postgresql.org/docs/15/sql-altertable.html)

---

## 3. Auto-Retry with Exponential Backoff

### Decision
Use **TanStack Query retry configuration** with exponential backoff for frontend operations.

### Rationale
- **Built-in support**: TanStack Query v5 has mature retry logic
- **Configurable**: Easy to set retry attempts (2-3) and backoff multiplier
- **User feedback**: Loading states automatically handled by query status
- **Transient failure recovery**: 99% success rate for network hiccups (NFR-009)

### Implementation Pattern
```typescript
// Global configuration in queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 2, // Fewer retries for mutations
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
    },
  },
});

// Task update mutation with retry
const updateTaskMutation = useMutation({
  mutationFn: (data: UpdateTaskData) => updateTask(data),
  retry: 2,
  retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 10000),
  onError: (error, variables, context) => {
    if (error.message.includes('conflict')) {
      showConflictDialog(); // Optimistic locking conflict
    } else {
      toast.error('Failed to update task. Please try again.');
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    toast.success('Task updated successfully');
  },
});

// Loading indicator (visible within 200ms per NFR-010)
{updateTaskMutation.isPending && <Spinner />}
{updateTaskMutation.isError && (
  <Button onClick={() => updateTaskMutation.mutate(data)}>
    Retry
  </Button>
)}
```

### Kanban Drag-and-Drop Retry
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  // Optimistic update
  const previousTasks = queryClient.getQueryData(['kanban-tasks']);
  queryClient.setQueryData(['kanban-tasks'], (old) =>
    updateTaskStageOptimistically(old, active.id, over.id)
  );

  try {
    await updateTaskStage({
      taskId: active.id as string,
      newStage: over.id as WorkflowStage,
      updatedAt: task.updated_at, // Optimistic locking
    });
  } catch (error) {
    // Revert on failure (NFR-028)
    queryClient.setQueryData(['kanban-tasks'], previousTasks);
    toast.error('Failed to move task. Please try again.');
  }
};
```

### Alternatives Considered
- **Manual retry logic**: Reinventing the wheel, error-prone
- **Axios interceptors**: Less React-integrated than TanStack Query
- **Service workers**: Overkill for simple retry logic

### References
- [TanStack Query Retry Documentation](https://tanstack.com/query/latest/docs/react/guides/query-retries)
- [Exponential Backoff Best Practices](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

---

## 4. Database Indexing for Variable Load (10-1000+ tasks)

### Decision
Use **composite indexes with partial WHERE clauses** targeting is_deleted = false for optimal query performance across variable user loads.

### Rationale
- **Variable load optimization**: Users with 10 tasks and 1000+ tasks both get <2s page loads (NFR-008)
- **Index selectivity**: Partial indexes reduce index size by excluding soft-deleted records
- **Query patterns**: Most queries filter by assignee + status/stage + is_deleted

### Index Strategy

#### Primary Indexes
```sql
-- Most common query: My active tasks
CREATE INDEX idx_tasks_assignee_active
ON tasks(assignee_id, status, created_at DESC)
WHERE is_deleted = false;

-- Kanban board query: Tasks by engagement and workflow stage
CREATE INDEX idx_tasks_engagement_stage
ON tasks(engagement_id, workflow_stage, created_at DESC)
WHERE is_deleted = false;

-- SLA monitoring: Tasks approaching deadline
CREATE INDEX idx_tasks_sla_warning
ON tasks(sla_deadline, assignee_id)
WHERE is_deleted = false AND status NOT IN ('completed', 'cancelled');

-- Contributors query: Tasks I contributed to
CREATE INDEX idx_contributors_user_active
ON task_contributors(user_id, task_id)
WHERE removed_at IS NULL;

-- Work item reverse lookup: Find tasks for specific dossier/position
CREATE INDEX idx_tasks_work_item_lookup
ON tasks(work_item_type, work_item_id)
WHERE is_deleted = false;

-- Full-text search on task titles/descriptions (if needed)
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')))
WHERE is_deleted = false;
```

#### Query Optimization Examples
```sql
-- My Tasks query (uses idx_tasks_assignee_active)
SELECT * FROM tasks
WHERE assignee_id = $1
  AND is_deleted = false
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;

-- Kanban Board query (uses idx_tasks_engagement_stage)
SELECT * FROM tasks
WHERE engagement_id = $1
  AND is_deleted = false
ORDER BY workflow_stage, created_at DESC;

-- Tasks I Contributed To (uses idx_contributors_user_active + idx_tasks_assignee_active)
SELECT t.* FROM tasks t
INNER JOIN task_contributors tc ON t.id = tc.task_id
WHERE tc.user_id = $1
  AND tc.removed_at IS NULL
  AND t.is_deleted = false
ORDER BY t.created_at DESC;
```

### Pagination Strategy for Variable Loads
```typescript
// Cursor-based pagination for high-volume users
const useTasks = (assigneeId: string, cursor?: string) => {
  return useInfiniteQuery({
    queryKey: ['tasks', assigneeId],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', assigneeId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(pageParam * 50, (pageParam + 1) * 50 - 1);

      return { data, nextCursor: data.length === 50 ? pageParam + 1 : null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

### Alternatives Considered
- **No partial indexes**: Larger index size, slower queries on soft-deleted records
- **Separate table for deleted tasks**: Adds complexity, breaks foreign keys
- **Redis caching only**: Still need optimized queries for cache misses

### References
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/15/indexes-partial.html)
- [Supabase Query Performance Optimization](https://supabase.com/docs/guides/database/postgres/query-performance)

---

## 5. RLS Policies for Multi-Table Joins

### Decision
Use **policy functions with subqueries** for contributor access checks, avoiding row-level JOINs in policies.

### Rationale
- **Performance**: Policy functions are evaluated once per query, not per row
- **Maintainability**: Centralized permission logic
- **Security**: RLS guarantees maintained across tasks and contributors (FR-011)

### RLS Policy Patterns

#### Tasks Table Policies
```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks they are assigned to, created, or contributed to
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

-- Policy: Users can update tasks they own
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE
USING (auth.uid() = assignee_id OR auth.uid() = created_by)
WITH CHECK (auth.uid() = assignee_id OR auth.uid() = created_by);

-- Policy: Users can create tasks
CREATE POLICY tasks_insert_policy ON tasks
FOR INSERT
WITH CHECK (auth.uid() = assignee_id OR auth.uid() = created_by);

-- Policy: Users can soft-delete tasks they own
CREATE POLICY tasks_delete_policy ON tasks
FOR UPDATE
USING (auth.uid() = assignee_id OR auth.uid() = created_by)
WITH CHECK (is_deleted = true);
```

#### Task Contributors Table Policies
```sql
-- Enable RLS
ALTER TABLE task_contributors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view contributors on tasks they have access to
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

-- Policy: Task owners can add contributors
CREATE POLICY contributors_insert_policy ON task_contributors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
);

-- Policy: Task owners can remove contributors
CREATE POLICY contributors_update_policy ON task_contributors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
);
```

### Testing RLS Policies
```typescript
// RLS test suite (backend/tests/integration/rls-policies.test.ts)
describe('Tasks RLS Policies', () => {
  it('should allow assignee to view their tasks', async () => {
    const { data, error } = await supabaseAsUser1
      .from('tasks')
      .select('*')
      .eq('assignee_id', user1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(expectedCount);
  });

  it('should allow contributors to view tasks they contributed to', async () => {
    // User2 is contributor on task owned by User1
    const { data, error } = await supabaseAsUser2
      .from('tasks')
      .select('*')
      .eq('id', taskWithUser2AsContributor.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('should deny access to tasks user has no relation to', async () => {
    const { data, error } = await supabaseAsUser2
      .from('tasks')
      .select('*')
      .eq('id', user1PrivateTask.id);
    expect(data).toHaveLength(0); // RLS filters out
  });
});
```

### Alternatives Considered
- **Row-level JOINs in RLS**: Performance nightmare for large tables
- **Application-level filtering**: Defeats purpose of RLS security
- **Materialized views**: Adds complexity, stale data issues

### References
- [Supabase RLS Patterns](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/15/ddl-rowsecurity.html)

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Optimistic Locking** | updated_at timestamp comparison | Simplicity, Supabase compatibility, no extra columns |
| **Data Migration** | Three-phase migration with rollback table | Zero data loss, 30-day rollback window, verification at each phase |
| **Auto-Retry** | TanStack Query with exponential backoff | Built-in support, 2-3 retries, loading states handled automatically |
| **Indexing** | Composite partial indexes (is_deleted = false) | Variable load optimization, index selectivity, query pattern alignment |
| **RLS Policies** | Policy functions with subqueries | Performance (evaluated once), maintainability, security guarantees |

---

**Next Steps**: Proceed to Phase 1 - Design (data-model.md, contracts/, quickstart.md)
