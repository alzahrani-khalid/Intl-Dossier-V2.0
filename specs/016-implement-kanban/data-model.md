# Data Model: Full Engagement Kanban Board

**Feature**: 016-implement-kanban
**Date**: 2025-10-07

## Overview
This document defines the database schema extensions and relationships required for the Engagement Kanban Board feature with dual SLA tracking, role-based permissions, and notification preferences.

---

## Entity Relationship Diagram (Textual)

```
engagements (existing)
    ↓ 1:N
assignments (existing, extended)
    ↓ 1:N
assignment_stage_history (new)

staff_profiles (existing, extended)
    ↓ 1:N (assignee)
assignments
    ↓ 1:N (transitioned_by)
assignment_stage_history
```

---

## Table Schemas

### 1. engagements (Existing - No Changes)

**Purpose**: Container for assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| title | text | NOT NULL | Engagement name |
| created_at | timestamptz | default now() | Creation timestamp |
| ... | ... | ... | Other existing columns |

**Indexes**:
- Primary key on `id`

**RLS Policies**: Existing (no changes required)

---

### 2. assignments (Existing - Extended)

**Purpose**: Work items with workflow stages, assignees, and SLA tracking

**New Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| overall_sla_deadline | timestamptz | NULL | Overall assignment SLA deadline (creation → done) |
| current_stage_sla_deadline | timestamptz | NULL | Current workflow stage SLA deadline |

**Existing Columns** (for reference):

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| engagement_id | uuid | FK → engagements.id, NOT NULL | Parent engagement |
| workflow_stage | workflow_stage_enum | NOT NULL, default 'todo' | Current stage |
| assignee_id | uuid | FK → staff_profiles.id, NULL | Assigned staff member |
| priority | priority_enum | NOT NULL, default 'medium' | Priority level |
| title | text | NOT NULL | Assignment title |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |
| ... | ... | ... | Other existing columns |

**Enums**:

```sql
CREATE TYPE workflow_stage_enum AS ENUM (
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled'
);

CREATE TYPE priority_enum AS ENUM ('high', 'medium', 'low');
```

**Indexes**:
- Primary key on `id`
- Index on `engagement_id` (for Kanban board queries)
- Index on `workflow_stage` (for stage grouping)
- Index on `assignee_id` (for user's assignments)

**RLS Policies**: Existing policies enforce access control

**State Transitions** (enforced in Edge Function):

| From Stage | To Stage | Allowed Roles | Notes |
|------------|----------|---------------|-------|
| todo | in_progress | staff, manager, admin | Sequential transition |
| in_progress | review | staff, manager, admin | Sequential transition |
| review | done | staff, manager, admin | Sequential transition |
| todo | done | manager, admin | Skip allowed for managers |
| any | cancelled | all | Emergency exit |

---

### 3. assignment_stage_history (New)

**Purpose**: Track every stage transition for dual SLA tracking and historical analysis

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| assignment_id | uuid | FK → assignments.id, NOT NULL, ON DELETE CASCADE | Parent assignment |
| from_stage | workflow_stage_enum | NOT NULL | Previous stage |
| to_stage | workflow_stage_enum | NOT NULL | New stage |
| transitioned_by | uuid | FK → staff_profiles.id, NOT NULL | User who moved the assignment |
| transitioned_at | timestamptz | default now(), NOT NULL | Transition timestamp |
| stage_duration_seconds | int | NULL | Time spent in from_stage (calculated on insert) |
| stage_sla_met | boolean | NULL | Whether stage SLA was met (calculated on insert) |

**Indexes**:
- Primary key on `id`
- Index on `assignment_id` (for history queries)
- Index on `transitioned_at` (for time-based analytics)
- Composite index on `(assignment_id, transitioned_at DESC)` (for latest transition)

**Triggers**:

```sql
-- Trigger to calculate stage_duration_seconds on insert
CREATE OR REPLACE FUNCTION calculate_stage_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Find previous transition to this stage
  SELECT EXTRACT(EPOCH FROM (NEW.transitioned_at - prev.transitioned_at))::int
  INTO NEW.stage_duration_seconds
  FROM assignment_stage_history prev
  WHERE prev.assignment_id = NEW.assignment_id
    AND prev.to_stage = NEW.from_stage
  ORDER BY prev.transitioned_at DESC
  LIMIT 1;

  -- If no previous transition, duration = time since assignment creation
  IF NEW.stage_duration_seconds IS NULL THEN
    SELECT EXTRACT(EPOCH FROM (NEW.transitioned_at - a.created_at))::int
    INTO NEW.stage_duration_seconds
    FROM assignments a
    WHERE a.id = NEW.assignment_id;
  END IF;

  -- Check if stage SLA was met
  SELECT (NEW.transitioned_at <= a.current_stage_sla_deadline)
  INTO NEW.stage_sla_met
  FROM assignments a
  WHERE a.id = NEW.assignment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_stage_duration_trigger
BEFORE INSERT ON assignment_stage_history
FOR EACH ROW
EXECUTE FUNCTION calculate_stage_duration();
```

**RLS Policies**:

```sql
-- Users can view stage history for assignments they can see
CREATE POLICY "Users can view stage history for accessible assignments"
ON assignment_stage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_stage_history.assignment_id
  )
);

-- Only system (Edge Functions) can insert stage history
CREATE POLICY "Only Edge Functions can insert stage history"
ON assignment_stage_history FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

---

### 4. staff_profiles (Existing - Extended)

**Purpose**: User profiles with roles and notification preferences

**New Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_preferences | jsonb | default '{"stage_transitions": {"enabled": true, "stages": "all"}}'::jsonb | User notification preferences |

**Existing Columns** (for reference):

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → auth.users.id | User identifier |
| role | role_enum | NOT NULL, default 'staff' | User role |
| ... | ... | ... | Other existing columns |

**Enums**:

```sql
CREATE TYPE role_enum AS ENUM ('staff', 'manager', 'admin');
```

**Notification Preferences Schema** (JSONB):

```json
{
  "stage_transitions": {
    "enabled": boolean,        // true = notifications on, false = all off
    "stages": string | string[] // "all" or ["review", "done", "cancelled"]
  }
}
```

**Constraints**:

```sql
-- Ensure notification_preferences has required keys
ALTER TABLE staff_profiles
ADD CONSTRAINT notification_preferences_schema_check
CHECK (
  notification_preferences ? 'stage_transitions'
  AND notification_preferences->'stage_transitions' ? 'enabled'
  AND notification_preferences->'stage_transitions' ? 'stages'
);
```

**Indexes**:
- Primary key on `id`
- Index on `role` (for permission checks)

**RLS Policies**: Existing policies enforce access control

---

## Validation Rules

### Stage Transition Validation (Edge Function Logic)

```typescript
function canTransitionStage(
  userRole: 'staff' | 'manager' | 'admin',
  fromStage: WorkflowStage,
  toStage: WorkflowStage
): boolean {
  // All roles can cancel
  if (toStage === 'cancelled') return true;

  // Managers and admins can skip stages
  if (userRole === 'manager' || userRole === 'admin') return true;

  // Staff must follow sequential flow
  const sequentialTransitions = {
    'todo': ['in_progress'],
    'in_progress': ['review'],
    'review': ['done'],
    'done': [], // Cannot move from done
    'cancelled': [] // Cannot move from cancelled
  };

  return sequentialTransitions[fromStage]?.includes(toStage) ?? false;
}
```

### SLA Tracking Logic (Edge Function Logic)

```typescript
async function updateSLATracking(
  assignmentId: string,
  fromStage: WorkflowStage,
  toStage: WorkflowStage
) {
  // Insert stage history record (trigger calculates duration and SLA met)
  await supabase.from('assignment_stage_history').insert({
    assignment_id: assignmentId,
    from_stage: fromStage,
    to_stage: toStage,
    transitioned_by: auth.user.id
  });

  // If moving to 'done', mark overall SLA met/missed
  if (toStage === 'done') {
    const assignment = await supabase
      .from('assignments')
      .select('overall_sla_deadline')
      .eq('id', assignmentId)
      .single();

    const overallSLAMet = new Date() <= assignment.overall_sla_deadline;

    // Record overall SLA result (could extend assignments table or create summary table)
  }

  // Calculate new current_stage_sla_deadline based on stage
  const stageSLAHours = {
    'todo': 24,
    'in_progress': 48,
    'review': 12,
    'done': null,
    'cancelled': null
  };

  const newDeadline = toStage in ['done', 'cancelled']
    ? null
    : new Date(Date.now() + stageSLAHours[toStage] * 3600000);

  await supabase
    .from('assignments')
    .update({ current_stage_sla_deadline: newDeadline })
    .eq('id', assignmentId);
}
```

---

## Migration Strategy

### Migration 1: Create assignment_stage_history table

```sql
-- Create table
CREATE TABLE assignment_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_stage workflow_stage_enum NOT NULL,
  to_stage workflow_stage_enum NOT NULL,
  transitioned_by uuid NOT NULL REFERENCES staff_profiles(id),
  transitioned_at timestamptz NOT NULL DEFAULT now(),
  stage_duration_seconds int,
  stage_sla_met boolean
);

-- Create indexes
CREATE INDEX idx_stage_history_assignment ON assignment_stage_history(assignment_id);
CREATE INDEX idx_stage_history_transitioned_at ON assignment_stage_history(transitioned_at);
CREATE INDEX idx_stage_history_assignment_time ON assignment_stage_history(assignment_id, transitioned_at DESC);

-- Create trigger
CREATE TRIGGER calculate_stage_duration_trigger
BEFORE INSERT ON assignment_stage_history
FOR EACH ROW
EXECUTE FUNCTION calculate_stage_duration();

-- Enable RLS
ALTER TABLE assignment_stage_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view stage history for accessible assignments"
ON assignment_stage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_stage_history.assignment_id
  )
);

CREATE POLICY "Only Edge Functions can insert stage history"
ON assignment_stage_history FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

### Migration 2: Extend assignments table

```sql
-- Add new SLA columns
ALTER TABLE assignments
ADD COLUMN overall_sla_deadline timestamptz,
ADD COLUMN current_stage_sla_deadline timestamptz;

-- Create indexes
CREATE INDEX idx_assignments_overall_sla ON assignments(overall_sla_deadline);
CREATE INDEX idx_assignments_stage_sla ON assignments(current_stage_sla_deadline);
```

### Migration 3: Extend staff_profiles table

```sql
-- Add notification preferences column
ALTER TABLE staff_profiles
ADD COLUMN notification_preferences jsonb DEFAULT '{"stage_transitions": {"enabled": true, "stages": "all"}}'::jsonb;

-- Add constraint
ALTER TABLE staff_profiles
ADD CONSTRAINT notification_preferences_schema_check
CHECK (
  notification_preferences ? 'stage_transitions'
  AND notification_preferences->'stage_transitions' ? 'enabled'
  AND notification_preferences->'stage_transitions' ? 'stages'
);

-- Create index for JSONB queries
CREATE INDEX idx_staff_notification_prefs ON staff_profiles USING GIN (notification_preferences);
```

---

## Data Model Summary

- **Extended `assignments` table**: Added `overall_sla_deadline` and `current_stage_sla_deadline` for dual SLA tracking
- **New `assignment_stage_history` table**: Tracks every stage transition with duration and SLA metrics
- **Extended `staff_profiles` table**: Added `notification_preferences` JSONB column for user customization
- **Validation logic**: Role-based stage transition rules enforced server-side
- **SLA tracking**: Automatic calculation via database trigger on stage history inserts
- **RLS policies**: Secure access control maintained on all tables

Ready for API contract definition (Phase 1, Step 2).
