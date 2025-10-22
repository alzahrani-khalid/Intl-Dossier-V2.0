# Data Model: Unified Tasks Model

**Branch**: `025-unified-tasks-model` | **Date**: 2025-10-19

## Overview

This document defines the database schema for the unified tasks model, consolidating the previous 3-layer architecture (Assignment → Task → Work Items) into a simpler 2-layer model (Task → Work Items). The new schema includes the unified `tasks` table (merging assignments + tasks) and a new `task_contributors` table for team collaboration tracking.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
└────────┬────────┘
         │ 1
         │
         │ *
┌────────┴────────────────────────────────────┐
│              tasks (Unified)                 │
│──────────────────────────────────────────────│
│ id (PK)                  UUID                │
│ title                    TEXT NOT NULL       │
│ description              TEXT                │
│ assignee_id (FK)         UUID → auth.users   │
│ engagement_id (FK)       UUID → engagements  │
│ status                   TEXT NOT NULL       │
│ workflow_stage           TEXT NOT NULL       │
│ priority                 TEXT NOT NULL       │
│ sla_deadline             TIMESTAMPTZ         │
│ work_item_type           TEXT                │
│ work_item_id             UUID                │
│ source                   JSONB               │
│ created_by (FK)          UUID → auth.users   │
│ updated_by (FK)          UUID → auth.users   │
│ completed_by (FK)        UUID → auth.users   │
│ created_at               TIMESTAMPTZ         │
│ updated_at               TIMESTAMPTZ         │
│ completed_at             TIMESTAMPTZ         │
│ is_deleted               BOOLEAN             │
└────────┬────────────────────────────────────┘
         │ 1
         │
         │ *
┌────────┴────────────────────────────────────┐
│         task_contributors                    │
│──────────────────────────────────────────────│
│ id (PK)                  UUID                │
│ task_id (FK)             UUID → tasks        │
│ user_id (FK)             UUID → auth.users   │
│ role                     TEXT NOT NULL       │
│ notes                    TEXT                │
│ added_at                 TIMESTAMPTZ         │
│ removed_at               TIMESTAMPTZ         │
│ UNIQUE(task_id, user_id)                     │
└──────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  dossiers    │       │  positions   │       │intake_tickets│
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       └──────────────────────┴──────────────────────┘
                              │
                              │ (work_item_type, work_item_id)
                              │ or source JSONB for multiple
                              │
                      ┌───────┴───────┐
                      │     tasks     │
                      └───────────────┘
```

---

## Entity Definitions

### 1. tasks (Unified Table)

**Description**: Consolidates assignment context (WHO, WHEN, STATUS) with task details (WHAT, WHY). Replaces the old `assignments` and `tasks` tables with a single unified structure.

**Table**: `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique task identifier |
| `title` | TEXT | NOT NULL | Descriptive task title (e.g., "Review Australia Population Data Initiative") |
| `description` | TEXT | NULL | Detailed task description explaining WHAT needs to be done and WHY |
| `assignee_id` | UUID | FOREIGN KEY → auth.users(id), NOT NULL | Primary person responsible for completing the task |
| `engagement_id` | UUID | FOREIGN KEY → engagements(id) ON DELETE SET NULL | Optional engagement context for kanban board grouping |
| `status` | TEXT | NOT NULL, CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')) | Current lifecycle status of the task |
| `workflow_stage` | TEXT | NOT NULL, CHECK (workflow_stage IN ('todo', 'in_progress', 'review', 'done', 'cancelled')) | Kanban board column for visual workflow tracking |
| `priority` | TEXT | NOT NULL, CHECK (priority IN ('low', 'medium', 'high', 'urgent')) | Task priority level |
| `sla_deadline` | TIMESTAMPTZ | NULL | Service Level Agreement deadline (overall task SLA) |
| `work_item_type` | TEXT | NULL, CHECK (work_item_type IN ('dossier', 'position', 'ticket', 'generic')) | Type of entity this task relates to (generic = no entity link) |
| `work_item_id` | UUID | NULL | ID of the related work item (dossier/position/ticket) |
| `source` | JSONB | NULL, DEFAULT '{}' | For linking multiple work items: `{"dossier_ids": [...], "position_ids": [...], "ticket_ids": [...]}` |
| `created_by` | UUID | FOREIGN KEY → auth.users(id), NOT NULL | User who created the task |
| `updated_by` | UUID | FOREIGN KEY → auth.users(id), NULL | User who last updated the task |
| `completed_by` | UUID | FOREIGN KEY → auth.users(id), NULL | User who marked the task as completed |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Task creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp (used for optimistic locking) |
| `completed_at` | TIMESTAMPTZ | NULL | Task completion timestamp |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false | Soft delete flag for audit trail compliance |

**Indexes**:
```sql
CREATE INDEX idx_tasks_assignee_active ON tasks(assignee_id, status, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_tasks_engagement_stage ON tasks(engagement_id, workflow_stage, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_tasks_sla_warning ON tasks(sla_deadline, assignee_id) WHERE is_deleted = false AND status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_tasks_work_item_lookup ON tasks(work_item_type, work_item_id) WHERE is_deleted = false;
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**Constraints**:
- `status` and `workflow_stage` must be in sync conceptually (e.g., status='completed' → workflow_stage='done')
- If `work_item_type` is 'generic', `work_item_id` must be NULL
- If linking to multiple work items, use `source` JSONB field instead of `work_item_id`
- `engagement_id` is optional (some tasks are not engagement-specific)
- `updated_at` is used for optimistic locking (client sends current value, server checks for conflicts)

**State Transitions**:
```
status: pending → in_progress → review → completed
                ↘ cancelled

workflow_stage: todo → in_progress → review → done
                ↘ cancelled
```

**Validation Rules**:
- Title must be non-empty and ≤ 200 characters (application-level)
- Priority must be set on creation
- SLA deadline must be in the future when set (application-level)
- Cannot change status to 'completed' without setting `completed_by` and `completed_at`
- Cannot modify task if `is_deleted = true` (application-level)

---

### 2. task_contributors

**Description**: Tracks additional team members who contributed to a task beyond the primary assignee. Enables team collaboration visibility and proper credit attribution.

**Table**: `task_contributors`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique contributor record identifier |
| `task_id` | UUID | FOREIGN KEY → tasks(id) ON DELETE CASCADE, NOT NULL | Reference to the task |
| `user_id` | UUID | FOREIGN KEY → auth.users(id), NOT NULL | Reference to the contributing user |
| `role` | TEXT | NOT NULL, CHECK (role IN ('helper', 'reviewer', 'advisor', 'observer', 'supervisor')) | Type of contribution made |
| `notes` | TEXT | NULL | Optional notes about the contributor's specific contribution |
| `added_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp when contributor was added |
| `removed_at` | TIMESTAMPTZ | NULL | Timestamp when contributor was removed (soft delete for audit trail) |
| **UNIQUE** | | (task_id, user_id) | Prevents same user from being added as contributor twice to the same task |

**Indexes**:
```sql
CREATE INDEX idx_contributors_task ON task_contributors(task_id);
CREATE INDEX idx_contributors_user_active ON task_contributors(user_id) WHERE removed_at IS NULL;
```

**Constraints**:
- A user cannot be both `assignee_id` on task AND contributor on the same task (enforced application-level)
- Cannot add contributors to tasks with `is_deleted = true`
- Once `removed_at` is set, contributor cannot be "re-added" (must create new record)

**Contributor Roles**:
- **helper**: Assisted with task execution
- **reviewer**: Reviewed task outputs or quality
- **advisor**: Provided expert guidance or consultation
- **observer**: Monitored progress (e.g., for training/knowledge transfer)
- **supervisor**: Provided oversight or approval

**Validation Rules**:
- Role must be specified on creation
- Cannot add contributor if user does not exist
- Cannot add contributor if task does not exist
- Cannot set `removed_at` in the past (application-level)

---

## Migration from Old Schema

### Old Schema (Deprecated)
```
assignments (renamed to assignments_deprecated)
├── id
├── assignee_id
├── status
├── workflow_stage
├── priority
├── sla_deadline
├── work_item_type
├── work_item_id
├── source
├── created_by, updated_by, completed_by
├── created_at, updated_at, completed_at
└── is_deleted

tasks_deprecated (if exists - old task definitions)
├── id
├── assignment_id (FK)
├── title
├── description
└── ...
```

### Mapping to New Schema
| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `assignments.id` | `tasks.id` | Direct copy |
| `assignments.assignee_id` | `tasks.assignee_id` | Direct copy |
| `assignments.status` | `tasks.status` | Direct copy |
| `assignments.workflow_stage` | `tasks.workflow_stage` | Direct copy |
| `assignments.priority` | `tasks.priority` | Direct copy |
| `assignments.sla_deadline` | `tasks.sla_deadline` | Direct copy |
| `assignments.work_item_type` | `tasks.work_item_type` | Direct copy |
| `assignments.work_item_id` | `tasks.work_item_id` | Direct copy |
| `assignments.source` | `tasks.source` | Direct copy |
| `assignments.*_by, *_at` | `tasks.*_by, *_at` | Direct copy (audit trail preserved) |
| `tasks_deprecated.title` | `tasks.title` | Copy if old tasks table exists, else generate from assignment ID |
| `tasks_deprecated.description` | `tasks.description` | Copy if exists, else empty string |
| N/A | `tasks.engagement_id` | NULL initially (must be backfilled manually if engagements exist) |

### Data Integrity Checks
```sql
-- Pre-migration check
SELECT COUNT(*) AS total_assignments FROM assignments;

-- Post-migration verification
SELECT COUNT(*) AS total_tasks FROM tasks;
SELECT COUNT(*) AS orphaned_tasks FROM tasks WHERE assignee_id NOT IN (SELECT id FROM auth.users);
SELECT COUNT(*) AS invalid_status FROM tasks WHERE status NOT IN ('pending', 'in_progress', 'review', 'completed', 'cancelled');

-- Sample data comparison
SELECT * FROM assignments_deprecated WHERE id = '<sample-id>';
SELECT * FROM tasks WHERE id = '<sample-id>';
```

---

## RLS Policies

### tasks Table

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view tasks they are assigned to, created, or contributed to
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

-- INSERT: Users can create tasks where they are the assignee or creator
CREATE POLICY tasks_insert_policy ON tasks
FOR INSERT
WITH CHECK (auth.uid() = assignee_id OR auth.uid() = created_by);

-- UPDATE: Users can update tasks they own (assignee or creator)
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE
USING (auth.uid() = assignee_id OR auth.uid() = created_by)
WITH CHECK (auth.uid() = assignee_id OR auth.uid() = created_by);

-- DELETE: Users can soft-delete tasks they own
CREATE POLICY tasks_delete_policy ON tasks
FOR UPDATE
USING (auth.uid() = assignee_id OR auth.uid() = created_by)
WITH CHECK (is_deleted = true);
```

### task_contributors Table

```sql
-- Enable RLS
ALTER TABLE task_contributors ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view contributors on tasks they have access to
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

-- INSERT: Task owners can add contributors
CREATE POLICY contributors_insert_policy ON task_contributors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_contributors.task_id
      AND (auth.uid() = tasks.assignee_id OR auth.uid() = tasks.created_by)
  )
);

-- UPDATE: Task owners can remove contributors (set removed_at)
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

---

## TypeScript Types (Generated from Supabase)

```typescript
// Generated via: npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assignee_id: string;
          engagement_id: string | null;
          status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
          workflow_stage: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          sla_deadline: string | null;
          work_item_type: 'dossier' | 'position' | 'ticket' | 'generic' | null;
          work_item_id: string | null;
          source: {
            dossier_ids?: string[];
            position_ids?: string[];
            ticket_ids?: string[];
          };
          created_by: string;
          updated_by: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assignee_id: string;
          engagement_id?: string | null;
          status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
          workflow_stage: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          sla_deadline?: string | null;
          work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic' | null;
          work_item_id?: string | null;
          source?: {
            dossier_ids?: string[];
            position_ids?: string[];
            ticket_ids?: string[];
          };
          created_by: string;
          updated_by?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string;
          engagement_id?: string | null;
          status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
          workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          sla_deadline?: string | null;
          work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic' | null;
          work_item_id?: string | null;
          source?: {
            dossier_ids?: string[];
            position_ids?: string[];
            ticket_ids?: string[];
          };
          updated_by?: string | null;
          completed_by?: string | null;
          updated_at?: string;
          completed_at?: string | null;
          is_deleted?: boolean;
        };
      };
      task_contributors: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          role: 'helper' | 'reviewer' | 'advisor' | 'observer' | 'supervisor';
          notes: string | null;
          added_at: string;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          role: 'helper' | 'reviewer' | 'advisor' | 'observer' | 'supervisor';
          notes?: string | null;
          added_at?: string;
          removed_at?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          role?: 'helper' | 'reviewer' | 'advisor' | 'observer' | 'supervisor';
          notes?: string | null;
          removed_at?: string | null;
        };
      };
    };
  };
}

// Helper types
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type TaskContributor = Database['public']['Tables']['task_contributors']['Row'];
export type TaskContributorInsert = Database['public']['Tables']['task_contributors']['Insert'];
export type TaskContributorUpdate = Database['public']['Tables']['task_contributors']['Update'];
```

---

## Query Examples

### Fetch My Active Tasks
```sql
SELECT *
FROM tasks
WHERE assignee_id = $1
  AND is_deleted = false
  AND status != 'completed'
ORDER BY sla_deadline ASC NULLS LAST, created_at DESC
LIMIT 50 OFFSET 0;
```

### Fetch Tasks I Contributed To
```sql
SELECT t.*
FROM tasks t
INNER JOIN task_contributors tc ON t.id = tc.task_id
WHERE tc.user_id = $1
  AND tc.removed_at IS NULL
  AND t.is_deleted = false
ORDER BY t.created_at DESC;
```

### Fetch Kanban Board for Engagement
```sql
SELECT *
FROM tasks
WHERE engagement_id = $1
  AND is_deleted = false
ORDER BY workflow_stage, created_at DESC;
```

### Fetch Task with Contributors
```sql
SELECT
  t.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tc.id,
        'user_id', tc.user_id,
        'role', tc.role,
        'notes', tc.notes,
        'added_at', tc.added_at
      )
    ) FILTER (WHERE tc.removed_at IS NULL),
    '[]'
  ) AS contributors
FROM tasks t
LEFT JOIN task_contributors tc ON t.id = tc.task_id AND tc.removed_at IS NULL
WHERE t.id = $1
  AND t.is_deleted = false
GROUP BY t.id;
```

---

**Next Steps**: Proceed to API contracts generation (contracts/)
