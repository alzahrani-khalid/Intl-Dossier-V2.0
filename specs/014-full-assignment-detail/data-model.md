# Data Model: Full Assignment Detail Page

**Feature**: 014-full-assignment-detail
**Date**: 2025-10-03

## Entity Relationship Diagram

```
┌─────────────────────┐
│   engagements       │
│  (existing table)   │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│   assignments       │◄───────┐
│  (existing table)   │        │
│  UPDATED COLUMNS:   │        │
│  + engagement_id    │        │
│  + workflow_stage   │        │
└─────────────────────┘        │
         │                      │
         │ 1:N                  │
         ▼                      │
┌─────────────────────────┐    │
│ assignment_comments     │    │
│                         │    │
│ - id                    │    │
│ - assignment_id    ────┼────┘
│ - user_id              │
│ - text (with @mentions)│
│ - created_at           │
│ - updated_at           │
└─────────────────────────┘
         │ 1:N
         ├────────► ┌─────────────────────────┐
         │          │ comment_reactions       │
         │          │                         │
         │          │ - id                    │
         │          │ - comment_id            │
         │          │ - user_id               │
         │          │ - emoji                 │
         │          │ - created_at            │
         │          │ UNIQUE(comment_id,      │
         │          │        user_id, emoji)  │
         │          └─────────────────────────┘
         │
         └────────► ┌─────────────────────────┐
                    │ comment_mentions        │
                    │                         │
                    │ - id                    │
                    │ - comment_id            │
                    │ - mentioned_user_id     │
                    │ - notified_at           │
                    │ - created_at            │
                    └─────────────────────────┘

┌─────────────────────┐
│   assignments       │◄───────┐
└─────────────────────┘        │
         │ 1:N                  │
         ▼                      │
┌──────────────────────────┐   │
│ assignment_checklist_items│  │
│                          │   │
│ - id                     │   │
│ - assignment_id     ─────┼───┘
│ - text                   │
│ - completed              │
│ - completed_at           │
│ - completed_by           │
│ - sequence               │
│ - created_at             │
└──────────────────────────┘

┌──────────────────────────────┐
│ assignment_checklist_templates│
│                              │
│ - id                         │
│ - name (bilingual)           │
│ - description (bilingual)    │
│ - applicable_work_types[]    │
│ - items_json                 │
│ - created_at                 │
│ - updated_at                 │
└──────────────────────────────┘

┌─────────────────────┐
│   assignments       │◄───────┐
└─────────────────────┘        │
         │ 1:N                  │
         ▼                      │
┌─────────────────────────┐    │
│ assignment_observers    │    │
│                         │    │
│ - id                    │    │
│ - assignment_id    ─────┼────┘
│ - user_id               │
│ - role                  │
│ - added_at              │
│ UNIQUE(assignment_id,   │
│        user_id)         │
└─────────────────────────┘

┌─────────────────────┐
│   assignments       │◄───────┐
└─────────────────────┘        │
         │ 1:N                  │
         ▼                      │
┌─────────────────────────┐    │
│ assignment_events       │    │
│                         │    │
│ - id                    │    │
│ - assignment_id    ─────┼────┘
│ - event_type            │
│ - actor_user_id         │
│ - event_data (JSONB)    │
│ - created_at            │
└─────────────────────────┘
```

## Table Definitions

### assignments (Updated Fields)

**Note**: The `assignments` table already exists from feature 013-assignment-engine-sla. This feature adds two new columns.

```sql
-- Add engagement_id to link assignments to parent engagement
ALTER TABLE assignments ADD COLUMN engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;

-- Index for querying assignments by engagement
CREATE INDEX idx_assignments_engagement ON assignments(engagement_id) WHERE engagement_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN assignments.engagement_id IS 'Optional link to engagement (NULL for standalone assignments from intake)';

-- Create engagement workflow stages enum
CREATE TYPE engagement_workflow_stage AS ENUM (
  'todo',          -- Not started
  'in_progress',   -- Being worked on
  'review',        -- Awaiting review/approval
  'done'           -- Completed
);

-- Add workflow_stage to assignments
ALTER TABLE assignments ADD COLUMN workflow_stage engagement_workflow_stage NOT NULL DEFAULT 'todo';

-- Update workflow_stage when status changes (trigger)
CREATE OR REPLACE FUNCTION sync_assignment_workflow_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Map assignment status to workflow stage
  NEW.workflow_stage := CASE NEW.status
    WHEN 'assigned' THEN 'todo'::engagement_workflow_stage
    WHEN 'in_progress' THEN 'in_progress'::engagement_workflow_stage
    WHEN 'completed' THEN 'done'::engagement_workflow_stage
    WHEN 'cancelled' THEN 'done'::engagement_workflow_stage
    ELSE NEW.workflow_stage
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_workflow_stage_on_status_change
  BEFORE INSERT OR UPDATE OF status ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_assignment_workflow_stage();
```

**Assignment Types**:
- **Engagement-linked**: `engagement_id` is NOT NULL → part of multi-task engagement (e.g., "Minister visit preparation")
- **Standalone**: `engagement_id` is NULL → direct from intake/dossier (e.g., "Review visa application")

**Validations**:
- engagement_id: nullable, must reference valid engagement if provided
- workflow_stage: must be one of enum values, auto-synced with status via trigger

### engagements (Existing Table Reference)

**Note**: This table exists from feature 010-after-action-notes. No changes needed for this feature.

Key fields used:
- id: UUID (referenced by assignments.engagement_id)
- title_en, title_ar: Engagement names shown in context banner
- engagement_type: Event type (e.g., "minister_visit", "trade_mission")
- start_date, end_date: Engagement timeline

### assignment_comments

Freeform progress notes with @mention support and reactions.

```sql
CREATE TABLE assignment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_assignment ON assignment_comments(assignment_id, created_at DESC);
CREATE INDEX idx_comments_user ON assignment_comments(user_id);

-- RLS Policy: Users with view permission to assignment can read comments
CREATE POLICY comments_select ON assignment_comments FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Users with view permission can insert comments
CREATE POLICY comments_insert ON assignment_comments FOR INSERT WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);
```

**Validations**:
- text: max 5000 characters, not null
- HTML sanitized before storage
- @mentions extracted and validated via Edge Function

**State Transitions**: None (comments are immutable after creation)

### comment_reactions

Emoji reactions to comments.

```sql
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES assignment_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '✅', '❓', '❤️', '🎯', '💡')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX idx_reactions_comment ON comment_reactions(comment_id);

-- RLS Policy: Users with view permission to assignment can read reactions
CREATE POLICY reactions_select ON comment_reactions FOR SELECT USING (
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policy: Users with view permission can add/remove their own reactions
CREATE POLICY reactions_insert ON comment_reactions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY reactions_delete ON comment_reactions FOR DELETE USING (
  user_id = auth.uid()
);
```

**Validations**:
- emoji: must be from allowed list
- UNIQUE constraint prevents duplicate reactions

### comment_mentions

Track users mentioned via @username in comments.

```sql
CREATE TABLE comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES assignment_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentions_comment ON comment_mentions(comment_id);
CREATE INDEX idx_mentions_user ON comment_mentions(mentioned_user_id, notified_at);

-- RLS Policy: Mentioned users can read their mentions
CREATE POLICY mentions_select ON comment_mentions FOR SELECT USING (
  mentioned_user_id = auth.uid() OR
  comment_id IN (
    SELECT id FROM assignment_comments WHERE assignment_id IN (
      SELECT id FROM assignments WHERE
        assignee_id = auth.uid() OR
        id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
    )
  )
);
```

**Validations**:
- mentioned_user_id: must exist in auth.users
- mentioned user must have view permission to assignment (enforced in Edge Function)

### assignment_checklist_items

Individual checklist items for progress tracking.

```sql
CREATE TABLE assignment_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_assignment ON assignment_checklist_items(assignment_id, sequence);

-- RLS Policy: Users with view permission can read checklist
CREATE POLICY checklist_select ON assignment_checklist_items FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Users with view permission can manage checklist
CREATE POLICY checklist_insert ON assignment_checklist_items FOR INSERT WITH CHECK (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

CREATE POLICY checklist_update ON assignment_checklist_items FOR UPDATE USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

CREATE POLICY checklist_delete ON assignment_checklist_items FOR DELETE USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);
```

**Validations**:
- text: max 500 characters, not null
- sequence: maintains order for display
- completed_at/completed_by: set atomically when item completed

**State Transitions**:
```
incomplete (completed=false)
  ↓ (user marks complete)
complete (completed=true, completed_at set, completed_by set)
  ↓ (user unchecks)
incomplete (completed=false, completed_at=null, completed_by=null)
```

### assignment_checklist_templates

Predefined checklist templates for common work item types.

```sql
CREATE TABLE assignment_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  applicable_work_types TEXT[] NOT NULL, -- e.g., ['dossier', 'ticket']
  items_json JSONB NOT NULL, -- [{ "text_en": "...", "text_ar": "...", "sequence": 1 }, ...]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_work_type ON assignment_checklist_templates USING GIN(applicable_work_types);

-- RLS Policy: All authenticated users can read templates
CREATE POLICY templates_select ON assignment_checklist_templates FOR SELECT USING (
  auth.role() = 'authenticated'
);
```

**Validations**:
- name/description: bilingual required
- items_json: array of objects with text_en, text_ar, sequence
- applicable_work_types: non-empty array

### assignment_observers

Users added as observers (typically supervisors after escalation).

```sql
CREATE TABLE assignment_observers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'other')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

CREATE INDEX idx_observers_assignment ON assignment_observers(assignment_id);
CREATE INDEX idx_observers_user ON assignment_observers(user_id);

-- RLS Policy: Assignment assignee and observers can read observers
CREATE POLICY observers_select ON assignment_observers FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE assignee_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

-- RLS Policy: Only supervisors can add observers (enforced in Edge Function)
CREATE POLICY observers_insert ON assignment_observers FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'supervisor'
  )
);
```

**Validations**:
- role: must be 'supervisor' or 'other'
- UNIQUE constraint prevents duplicate observers

### assignment_events

Audit trail of all actions taken on an assignment.

```sql
CREATE TABLE assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'escalated', 'completed',
    'commented', 'checklist_updated', 'observer_added', 'reassigned'
  )),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_assignment ON assignment_events(assignment_id, created_at DESC);
CREATE INDEX idx_events_type ON assignment_events(event_type);

-- RLS Policy: Users with view permission can read events
CREATE POLICY events_select ON assignment_events FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);
```

**Event Data Examples**:
```json
// status_changed
{
  "old_status": "in_progress",
  "new_status": "completed"
}

// escalated
{
  "reason": "SLA breach",
  "supervisor_id": "uuid",
  "trigger": "manual"
}

// commented
{
  "comment_id": "uuid",
  "mentions": ["user1", "user2"]
}

// checklist_updated
{
  "item_id": "uuid",
  "action": "completed",
  "progress_percentage": 75
}
```

## Database Functions

### Calculate Checklist Progress

```sql
CREATE OR REPLACE FUNCTION get_assignment_progress(p_assignment_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / COUNT(*)::DECIMAL) * 100)
  END::INTEGER
  FROM assignment_checklist_items
  WHERE assignment_id = p_assignment_id;
$$;
```

### Calculate Engagement Progress

```sql
CREATE OR REPLACE FUNCTION get_engagement_progress(p_engagement_id UUID)
RETURNS TABLE(
  total_assignments INTEGER,
  completed_assignments INTEGER,
  in_progress_assignments INTEGER,
  todo_assignments INTEGER,
  progress_percentage INTEGER,
  kanban_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'done')::INTEGER as completed_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'in_progress')::INTEGER as in_progress_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'todo')::INTEGER as todo_assignments,
    ROUND((COUNT(*) FILTER (WHERE workflow_stage = 'done')::DECIMAL / NULLIF(COUNT(*), 0)::DECIMAL) * 100)::INTEGER as progress_percentage,
    jsonb_build_object(
      'todo', COUNT(*) FILTER (WHERE workflow_stage = 'todo'),
      'in_progress', COUNT(*) FILTER (WHERE workflow_stage = 'in_progress'),
      'review', COUNT(*) FILTER (WHERE workflow_stage = 'review'),
      'done', COUNT(*) FILTER (WHERE workflow_stage = 'done')
    ) as kanban_stats
  FROM assignments
  WHERE engagement_id = p_engagement_id;
END;
$$ LANGUAGE plpgsql;
```

### Get Reaction Summary

```sql
CREATE OR REPLACE FUNCTION get_comment_reactions(p_comment_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT, users TEXT[])
LANGUAGE SQL
STABLE
AS $$
  SELECT
    r.emoji,
    COUNT(*) as count,
    ARRAY_AGG(u.name ORDER BY r.created_at) as users
  FROM comment_reactions r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.comment_id = p_comment_id
  GROUP BY r.emoji
  ORDER BY count DESC;
$$;
```

## Migrations

See `supabase/migrations/` for SQL migration files.

**Migration Order**:
1. `20251003000_add_engagement_context_to_assignments.sql` ← NEW (engagement_id, workflow_stage)
2. `20251003001_create_assignment_comments.sql`
3. `20251003002_create_comment_reactions.sql`
4. `20251003003_create_comment_mentions.sql`
5. `20251003004_create_assignment_checklist_items.sql`
6. `20251003005_create_assignment_checklist_templates.sql`
7. `20251003006_create_assignment_observers.sql`
8. `20251003007_create_assignment_events.sql`
9. `20251003008_create_rls_policies.sql`
10. `20251003009_create_functions.sql` (includes get_engagement_progress)
11. `20251003010_seed_checklist_templates.sql`
12. `20251003011_backfill_engagement_assignments.sql` ← NEW (backfill existing data)

---

**Status**: Data model complete ✅
**Next**: API Contracts
